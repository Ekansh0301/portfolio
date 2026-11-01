import { experience, philosophy, skillGroups } from "../data/content";
import { Slate } from "./Pages";

export default function Closing({ id, scene }: { id: string; scene: number }) {
  return (
    <section id={id} className="page alt">
      <div className="wrap">
        <Slate scene={scene} title={<>Where I've <em>worked</em>, what I use</>} />
        <div className="pair" style={{ gap: "2.5rem" }}>
          <div>
            {experience.map((e) => (
              <div className="xp" key={e.role + e.period}>
                <div>
                  <div className="mono dim">{e.period}</div>
                  <div className="mono acc" style={{ marginTop: "0.2rem" }}>{e.org}</div>
                </div>
                <div>
                  <h4>{e.role}</h4>
                  <p>{e.summary}</p>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="skillgrid">
              {skillGroups.map((g) => (
                <div key={g.label}><h5>{g.label}</h5><p>{g.items.join(" · ")}</p></div>
              ))}
            </div>
            <p className="quote">{philosophy}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
