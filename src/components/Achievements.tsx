import { achievements } from "../data/content";
import { Slate } from "./Pages";

/** What has been recognised, each in one line. */
export default function Achievements({ id, scene }: { id: string; scene: number }) {
  return (
    <section id={id} className="page">
      <div className="wrap">
        <Slate scene={scene} title={<>What's been <em>recognised</em></>} note="prizes, papers, teaching" />
        <div className="ach-grid">
          {achievements.map((a) => (
            <div className="ach" key={a.title}>
              <div className="big">{a.big}</div>
              <h3>{a.title}</h3>
              <p>{a.line}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
