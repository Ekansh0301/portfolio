import { type Project } from "../data/content";
import Ring from "./demos/Ring";
import Critics from "./demos/Critics";
import Voice from "./demos/Voice";
import Cipher from "./demos/Cipher";
import Eye from "./demos/Eye";
import Futures from "./demos/Futures";

const demos: Record<Project["demo"], () => React.JSX.Element> = {
  ring: Ring, critics: Critics, voice: Voice, cipher: Cipher, eye: Eye, futures: Futures,
};

export function Slate({ scene, title, note }: { scene: number; title: React.ReactNode; note?: string }) {
  return (
    <div className="slate">
      <h2>{title}</h2>
      <span className="mono">Scene <b>{String(scene).padStart(2, "0")}</b>{note ? ` · ${note}` : ""}</span>
    </div>
  );
}

export function Card({ n, title, metric, txt, chips, href, video, priv, children }: {
  n: string; title: string; metric?: string; txt: string; chips?: string[]; href?: string; video?: string; priv?: boolean; children: React.ReactNode;
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
        <span style={{ display: "flex", gap: "0.9rem", alignItems: "baseline" }}>{video && <a className="link" href={video} target="_blank" rel="noreferrer">watch the demo ↗</a>}{href ? <a className="link" href={href} target="_blank" rel="noreferrer">source ↗</a> : priv && <span className="mono dim" title="The code is not public">private repository</span>}</span>
      </div>
    </article>
  );
}

export function WorkPage({ id, scene, title, items, first, alt, cols }: {
  id: string; scene: number; title: React.ReactNode; items: Project[]; first: number; alt?: boolean; cols?: string;
}) {
  return (
    <section id={id} className={`page ${alt ? "alt" : ""}`}>
      <div className="wrap">
        <Slate scene={scene} title={title} note={`projects ${first}–${first + 1} of 6`} />
        <div className="pair" style={cols ? ({ "--cols": cols } as React.CSSProperties) : undefined}>
          {items.map((p, i) => {
            const Demo = demos[p.demo];
            return (
              <Card key={p.title} n={String(first + i).padStart(2, "0")} title={p.title} metric={p.metric} txt={p.short} chips={p.stack} href={p.href} video={p.video} priv={!p.href}>
                <Demo />
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
