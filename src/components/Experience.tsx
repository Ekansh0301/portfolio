import { experience } from "../data/content";
import Reveal from "./Reveal";

export default function Experience() {
  return (
    <section id="experience">
      <div className="wrap">
        <Reveal>
          <div className="eyebrow"><b>03</b> / Experience</div>
          <h2 className="h2">Where I've <em>worked</em></h2>
        </Reveal>
        <div style={{ marginTop: "3rem" }}>
          {experience.map((e) => (
            <Reveal key={e.role + e.period}>
              <div className="row-item">
                <div>
                  <div className="mono">{e.period}</div>
                  <div className="mono" style={{ color: "var(--accent)", marginTop: "0.3rem" }}>{e.org}</div>
                </div>
                <div>
                  <h3>{e.role}</h3>
                  <p>{e.summary}</p>
                  <ul>{e.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
