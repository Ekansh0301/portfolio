import { skillGroups } from "../data/content";
import { Slate } from "./Pages";

/** The toolkit, grouped the way I actually reach for it. */
export default function Tools({ id, scene }: { id: string; scene: number }) {
  return (
    <section id={id} className="page compact">
      <div className="wrap">
        <Slate scene={scene} title={<>What I build <em>with</em></>} note={`${skillGroups.reduce((n, g) => n + g.items.length, 0)} tools and topics`} />
        <div className="tools-grid">
          {skillGroups.map((g) => (
            <div className="toolcard" key={g.label}>
              <header><h3>{g.label}</h3><span className="mono dim">{String(g.items.length).padStart(2, "0")}</span></header>
              <div className="chips">{g.items.map((t) => <span className="chip" key={t}>{t}</span>)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
