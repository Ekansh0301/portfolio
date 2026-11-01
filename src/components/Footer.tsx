import { profile, socials } from "../data/content";

export default function Footer() {
  return (
    <footer>
      <div className="wrap mono dim">
        <span>© {new Date().getFullYear()} {profile.first[0]}{profile.first.slice(1).toLowerCase()} {profile.last[0]}{profile.last.slice(1).toLowerCase()}</span>
        <span style={{ display: "flex", gap: "1.2rem" }}>
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer" style={{ color: "var(--ink-2)" }}>{s.label}</a>
          ))}
        </span>
      </div>
    </footer>
  );
}
