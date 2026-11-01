/**
 * A small but real Dynamo-style cluster: consistent hashing, N/R/W quorums,
 * vector clocks with sibling versions, sloppy quorums with hinted handoff,
 * read repair, and anti-entropy. Eight nodes, one token each.
 */
export type VC = Record<string, number>;
export type Version = { value: string; vc: VC };
export type Hint = { target: number; key: string; v: Version };
export type KNode = { id: number; alive: boolean; pos: number; store: Map<string, Version[]>; hints: Hint[] };

export const N = 3;
export const NODES = 8;

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 2 ** 32;
}

const leq = (a: VC, b: VC) => Object.keys(a).every((k) => a[k] <= (b[k] ?? 0));

/** Keep only versions that no other version supersedes. */
export function reduce(vs: Version[]): Version[] {
  let out: Version[] = [];
  for (const v of vs) {
    if (out.some((o) => leq(v.vc, o.vc))) continue;
    out = out.filter((o) => !leq(o.vc, v.vc));
    out.push(v);
  }
  return out;
}

export function mergeVC(vs: Version[]): VC {
  const m: VC = {};
  for (const v of vs) for (const [k, c] of Object.entries(v.vc)) m[k] = Math.max(m[k] ?? 0, c);
  return m;
}

export const fmtVC = (vc: VC) =>
  "{" + Object.keys(vc).sort().map((k) => `n${k}:${vc[k]}`).join(",") + "}";

export class Cluster {
  nodes: KNode[] = Array.from({ length: NODES }, (_, id) => ({
    id,
    alive: true,
    pos: (id + hash(`node-${id}`) * 0.55) / NODES,
    store: new Map(),
    hints: [],
  }));
  partitioned = false;
  log: string[] = [];

  /** Clients: 0 sits with nodes 0-3 (east half of the ring), 1 with nodes 4-7. */
  side = (id: number) => (id < NODES / 2 ? 0 : 1);
  reach = (client: number, id: number) =>
    this.nodes[id].alive && (!this.partitioned || this.side(id) === client);

  say(s: string) {
    this.log = [...this.log.slice(-5), s];
  }

  /** Nodes in clockwise order starting from the key's position on the ring. */
  walk(key: string) {
    const k = hash(key);
    const sorted = [...this.nodes].sort((a, b) => a.pos - b.pos);
    let start = sorted.findIndex((n) => n.pos >= k);
    if (start < 0) start = 0;
    return Array.from({ length: NODES }, (_, i) => sorted[(start + i) % NODES].id);
  }
  pref = (key: string) => this.walk(key).slice(0, N);

  private apply(id: number, key: string, v: Version) {
    const n = this.nodes[id];
    n.store.set(key, reduce([...(n.store.get(key) ?? []), v]));
  }

  put(client: number, key: string, value: string, ctx: VC, W: number) {
    const walk = this.walk(key);
    const coord = walk.find((id) => this.reach(client, id));
    if (coord === undefined) {
      this.say("PUT failed: no reachable node");
      return { ok: false, vc: ctx };
    }
    const vc = { ...ctx, [coord]: (ctx[coord] ?? 0) + 1 };
    const v: Version = { value, vc };
    const spares = walk.slice(N).filter((id) => this.reach(client, id));
    let acks = 0;
    const stand: string[] = [];
    for (const p of walk.slice(0, N)) {
      if (this.reach(client, p)) {
        this.apply(p, key, v);
        acks++;
      } else if (spares.length) {
        const s = spares.shift()!;
        this.nodes[s].hints.push({ target: p, key, v });
        stand.push(`n${s} holds a hint for n${p}`);
        acks++;
      }
    }
    const ok = acks >= W;
    this.say(
      `PUT ${key}=${value} via n${coord} ${fmtVC(vc)}: ${acks}/${W} acks${stand.length ? " (" + stand.join(", ") + ")" : ""}${ok ? "" : " — W not met, write reported failed"}`,
    );
    return { ok, vc };
  }

  get(client: number, key: string, R: number) {
    const resp = this.pref(key).filter((id) => this.reach(client, id));
    if (resp.length < R) {
      this.say(`GET ${key}: only ${resp.length} replicas reachable, need R=${R}`);
      return { ok: false, versions: [] as Version[], ctx: {} as VC };
    }
    const used = resp.slice(0, Math.max(R, 1));
    const versions = reduce(used.flatMap((id) => this.nodes[id].store.get(key) ?? []));
    let repaired = 0;
    for (const id of used) {
      const have = this.nodes[id].store.get(key) ?? [];
      if (have.length !== versions.length || versions.some((v) => !have.some((h) => leq(v.vc, h.vc)))) {
        for (const v of versions) this.apply(id, key, v);
        repaired++;
      }
    }
    this.say(
      `GET ${key} from ${used.map((i) => "n" + i).join(",")}: ${versions.length ? versions.map((v) => `"${v.value}"`).join(" | ") : "∅"}${versions.length > 1 ? " — concurrent siblings" : ""}${repaired ? ` · read repair fixed ${repaired}` : ""}`,
    );
    return { ok: true, versions, ctx: mergeVC(versions) };
  }

  /** Deliver stored hints whose owner is reachable from the holder again. */
  handoff() {
    let sent = 0;
    for (const n of this.nodes) {
      if (!n.alive) continue;
      n.hints = n.hints.filter((h) => {
        const t = this.nodes[h.target];
        const ok = t.alive && (!this.partitioned || this.side(t.id) === this.side(n.id));
        if (ok) {
          this.apply(h.target, h.key, h.v);
          sent++;
        }
        return !ok;
      });
    }
    if (sent) this.say(`hinted handoff: delivered ${sent} hint${sent > 1 ? "s" : ""}`);
    return sent;
  }

  /** Replicas of each key exchange differences. Skipped across a partition. */
  antiEntropy() {
    const keys = new Set(this.nodes.flatMap((n) => [...n.store.keys()]));
    let fixed = 0;
    for (const key of keys) {
      for (const side of this.partitioned ? [0, 1] : [-1]) {
        const grp = this.pref(key).filter((id) => this.nodes[id].alive && (side < 0 || this.side(id) === side));
        const merged = reduce(grp.flatMap((id) => this.nodes[id].store.get(key) ?? []));
        for (const id of grp) {
          const have = this.nodes[id].store.get(key) ?? [];
          if (have.length !== merged.length || merged.some((v) => !have.some((h) => leq(v.vc, h.vc)))) {
            for (const v of merged) this.apply(id, key, v);
            fixed++;
          }
        }
      }
    }
    this.say(fixed ? `anti-entropy: Merkle digests differed on ${fixed} replica${fixed > 1 ? "s"  : ""}, repaired` : "anti-entropy: all replica digests already match");
    return fixed;
  }

  digest(id: number) {
    const parts = [...this.nodes[id].store.entries()]
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([k, vs]) => k + vs.map((v) => v.value + fmtVC(v.vc)).sort().join(""));
    return parts.length ? Math.floor(hash(parts.join("|")) * 65535).toString(16).padStart(4, "0") : "····";
  }
}
