import { philosophy } from "../data/content";
import Reveal from "./Reveal";

export default function Philosophy() {
  return (
    <section style={{ borderTop: "1px solid var(--rule)" }}>
      <div className="wrap">
        <Reveal>
          <div className="eyebrow"><b>04</b> / Philosophy</div>
          <p className="quote">{philosophy}</p>
        </Reveal>
      </div>
    </section>
  );
}
