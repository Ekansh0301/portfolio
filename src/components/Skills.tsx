import { skillGroups } from "../data/content";
import Reveal from "./Reveal";

export default function Skills() {
  return (
    <section style={{ background: "var(--bg-2)" }}>
      <div className="wrap">
        <Reveal>
          <div className="eyebrow"><b>·</b> / Toolkit</div>
          <h2 className="h2">What I build <em>with</em></h2>
          <div className="skills" style={{ marginTop: "3rem" }}>
            {skillGroups.map((g) => (
              <div key={g.label}>
                <h4>{g.label}</h4>
                <p>{g.items.join(" · ")}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
