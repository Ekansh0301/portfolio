import { publications } from "../data/content";
import { Card, Slate } from "./Pages";
import Lgsm from "./demos/Lgsm";
import Density from "./demos/Density";

export default function Research({ id, scene }: { id: string; scene: number }) {
  const demos = [<Lgsm key="g" />, <Density key="d" />];
  return (
    <section id={id} className="page alt">
      <div className="wrap">
        <Slate scene={scene} title={<>Papers &amp; <em>findings</em></>} note="two publications" />
        <div className="pair">
          {publications.map((p, i) => (
            <Card key={p.title} n={p.venue} title={i === 0 ? "Scene saliency in screenplays" : "Truth Gradient"} metric={p.status} txt={p.detail} href={"href" in p ? p.href : undefined}>
              {demos[i]}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
