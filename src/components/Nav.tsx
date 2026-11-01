import { useState } from "react";

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
        <a className="l" href="#research">Research</a>
        <a className="l" href="#contact">Contact</a>
        <button className="iconbtn" onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>
          {theme === "dark" ? "☀" : "☾"}
        </button>
      </div>
    </nav>
  );
}
