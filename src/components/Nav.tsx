import { useEffect, useState } from "react";

const links = [
  { label: "Work", href: "#work" },
  { label: "Research", href: "#research" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme ?? "light",
  );

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode: the toggle still works for this visit */
    }
    setTheme(next);
  };

  return (
    <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
      <a href="#top" className="logo">
        Ekansh<i>.</i>
      </a>
      <ul>
        {links.map((l, i) => (
          <li key={l.href} className={i === 1 || i === 2 ? "hide-sm" : ""}>
            <a className="l" href={l.href}>{l.label}</a>
          </li>
        ))}
        <li>
          <button
            className="iconbtn"
            onClick={toggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </li>
      </ul>
    </nav>
  );
}
