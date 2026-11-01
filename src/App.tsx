import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Projects from "./components/Projects";
import Research from "./components/Research";
import Experience from "./components/Experience";
import Skills from "./components/Skills";
import Repos from "./components/Repos";
import Philosophy from "./components/Philosophy";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Projects />
        <Research />
        <Experience />
        <Skills />
        <Repos />
        <Philosophy />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
