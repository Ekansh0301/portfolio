import { education, experience } from "../data/content";
import { Slate } from "./Pages";

/** Where I have worked: a timeline of three roles, most recent first. */
export default function Experience({ id, scene }: { id: string; scene: number }) {
  return (
    <section id={id} className="page alt compact">
      <div className="wrap">
        <Slate scene={scene} title={<>Where I've <em>worked</em></>} note="most recent first" />
        <div className="xp-line" aria-hidden>
          {[4, 37, 70].map((x) => <i key={x} style={{ left: `calc(${x}% - 4px)` }} />)}
        </div>
        <div className="xp-grid">
          {experience.map((e) => (
            <article className="xpcard" key={e.org + e.period}>
              <div className="when"><span className="mono acc">{e.period}</span><span className="mono dim">{e.advisor}</span></div>
              <h3 className="org">{e.org}</h3>
              <div className="role">{e.role}</div>
              <p>{e.summary}</p>
              <ul>{e.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
              <div className="chips" style={{ marginTop: "auto" }}>{e.tags.map((t) => <span className="chip" key={t}>{t}</span>)}</div>
            </article>
          ))}
        </div>
        <article className="xpcard edu">
          <div><span className="mono acc">{education.period}</span><h3 className="org">{education.school}</h3></div>
          <div><p>{education.degree}</p><p className="mono dim" style={{ fontSize: "0.7rem", marginTop: "0.35rem" }}>{education.line}</p></div>
        </article>
      </div>
    </section>
  );
}
