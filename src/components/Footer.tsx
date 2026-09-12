import { profile } from "../data/content";

export default function Footer() {
  return (
    <footer className="relative border-t border-white/8 py-10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-4 px-[clamp(20px,5vw,80px)] text-center md:flex-row md:text-left">
        <p className="font-soft text-xs text-ash">
          © {new Date().getFullYear()} {profile.first.charAt(0) + profile.first.slice(1).toLowerCase()}{" "}
          {profile.last.charAt(0) + profile.last.slice(1).toLowerCase()}. Built with intent.
        </p>
        <a
          href="#hero"
          className="font-display text-[10px] uppercase tracking-[0.28em] text-ash transition-colors duration-300 hover:text-ember-bright"
        >
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
