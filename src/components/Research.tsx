import { publications } from "../data/content";
import Reveal from "./Reveal";

export default function Research() {
  return (
    <section id="research" style={{ background: "var(--bg-2)" }}>
      <div className="wrap">
        <Reveal>
          <div className="eyebrow"><b>02</b> / Research</div>
          <h2 className="h2">Papers &amp; <em>findings</em></h2>
        </Reveal>
        <div style={{ marginTop: "3rem" }}>
          {publications.map((p) => (
            <Reveal key={p.title}>
              <div className="row-item">
                <div>
                  <div className="mono">{p.venue}</div>
                  <div className="mono" style={{ color: "var(--accent)", marginTop: "0.3rem" }}>{p.status}</div>
                </div>
                <div>
                  <h3>{p.title}</h3>
                  <p>{p.detail}</p>
                  {"href" in p && p.href && (
                    <a className="link" href={p.href} target="_blank" rel="noreferrer">Code ↗</a>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
