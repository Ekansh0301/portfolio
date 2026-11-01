import { useState } from "react";
import { Gh } from "./Hero";

export default function Nav() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? "light");
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* private mode */ }
    setTheme(next);
  };
  return (
    <nav className="nav">
      <a href="#opening" className="logo">Ekansh Goyal<i>.</i></a>
      <div className="r">
        <a className="navbtn hide-sm" href="#research">Research</a>
        <a className="navbtn" href="#contact">Contact</a>
        <a className="navbtn solid" href="https://github.com/Ekansh0301" target="_blank" rel="noreferrer"><Gh /> GitHub</a>
        <button className="iconbtn" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </nav>
  );
}
