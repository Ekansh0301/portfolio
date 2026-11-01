import Nav from "./components/Nav";
import Rail from "./components/Rail";
import Hero from "./components/Hero";
import { WorkPage } from "./components/Pages";
import Research from "./components/Research";
import Closing from "./components/Closing";
import Contact from "./components/Contact";
import { projects, scenes } from "./data/content";

export default function App() {
  return (
    <>
      <Nav />
      <Rail scenes={scenes} />
      <main>
        <Hero id="opening" />
        <WorkPage id="systems" scene={2} title={<>Systems that <em>survive</em></>} items={[projects[0], projects[1]]} first={1} cols="minmax(0,0.8fr) minmax(0,1.2fr)" />
        <WorkPage id="intelligence" scene={3} title={<>Things that <em>listen</em> and <em>resist</em></>} items={[projects[2], projects[3]]} first={3} alt />
        <WorkPage id="applied" scene={4} title={<>Models in the <em>field</em></>} items={[projects[4], projects[5]]} first={5} />
        <Research id="research" scene={5} />
        <Closing id="career" scene={6} />
        <Contact id="contact" scene={7} />
      </main>
    </>
  );
}
