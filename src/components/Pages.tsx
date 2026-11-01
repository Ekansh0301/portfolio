import { type Project } from "../data/content";
import Ring from "./demos/Ring";
import Critics from "./demos/Critics";
import Voice from "./demos/Voice";
import Cipher from "./demos/Cipher";
import Eye from "./demos/Eye";
import Planes from "./demos/Planes";

const demos: Record<Project["demo"], () => React.JSX.Element> = {
  ring: Ring, critics: Critics, voice: Voice, cipher: Cipher, eye: Eye, planes: Planes,
};

export function Slate({ scene, title, note }: { scene: number; title: React.ReactNode; note?: string }) {
  return (
    <div className="slate">
      <h2>{title}</h2>
      <span className="mono">Scene <b>{String(scene).padStart(2, "0")}</b>{note ? ` · ${note}` : ""}</span>
    </div>
  );
}

export function Card({ n, title, metric, txt, chips, href, priv, children }: {
  n: string; title: string; metric?: string; txt: string; chips?: string[]; href?: string; priv?: boolean; children: React.ReactNode;
}) {
  return (
    <article className="card">
      <div className="card-top">
        <div><span className="num">{n}</span><h3>{title}</h3></div>
        {metric && <span className="metric">{metric}</span>}
      </div>
      <p className="txt">{txt}</p>
      {children}
      <div className="card-foot">
        <div className="chips">{chips?.map((c) => <span className="chip" key={c}>{c}</span>)}</div>
        {href ? <a className="link" href={href} target="_blank" rel="noreferrer">source ↗</a> : priv && <span className="mono dim" title="The code is not public">private repository</span>}
      </div>
    </article>
  );
}

export function WorkPage({ id, scene, title, items, first, alt }: {
  id: string; scene: number; title: React.ReactNode; items: Project[]; first: number; alt?: boolean;
}) {
  return (
    <section id={id} className={`page ${alt ? "alt" : ""}`}>
      <div className="wrap">
        <Slate scene={scene} title={title} note={`projects ${first}–${first + 1} of 6`} />
        <div className="pair">
          {items.map((p, i) => {
            const Demo = demos[p.demo];
            return (
              <Card key={p.title} n={String(first + i).padStart(2, "0")} title={p.title} metric={p.metric} txt={p.short} chips={p.stack} href={p.href} priv={!p.href}>
                <Demo />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
