import { projects, type Project } from "../data/content";
import Reveal from "./Reveal";
import Ring from "./demos/Ring";
import Critics from "./demos/Critics";
import Voice from "./demos/Voice";
import Cipher from "./demos/Cipher";
import Leaf from "./demos/Leaf";
import Planes from "./demos/Planes";

const demos: Record<Project["demo"], () => React.JSX.Element> = {
  ring: Ring, critics: Critics, voice: Voice, cipher: Cipher, leaf: Leaf, planes: Planes,
};

export default function Projects() {
  return (
    <section id="work" style={{ paddingBottom: 0 }}>
      <div className="wrap">
        <Reveal>
          <div className="eyebrow"><b>01</b> / Selected work</div>
          <h2 className="h2">Projects you can <em>poke at</em></h2>
          <p style={{ color: "var(--ink-2)", maxWidth: "34rem", margin: "1rem 0 3rem" }}>
            Each one has a small working model of its core idea. Break it.
          </p>
        </Reveal>

        {projects.map((p, i) => {
          const Demo = demos[p.demo];
          return (
            <Reveal key={p.title} className="proj">
              <div className="proj-text">
                <div className="proj-num">{String(i + 1).padStart(2, "0")}</div>
                <h3>{p.title}</h3>
                <span className="metric">{p.metric}</span>
                <p>{p.blurb}</p>
                <div className="chips">{p.stack.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
                <a className="link" href={p.href} target="_blank" rel="noreferrer">View source ↗</a>
              </div>
              <div className="demo">
                <div className="demo-bar">
                  <span className="eyebrow">Try it · {p.hint}</span>
                  <span className="eyebrow">demo</span>
                </div>
                <div className="demo-body"><Demo /></div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
