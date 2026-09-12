import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { contactForm, profile, socials } from "../data/content";

gsap.registerPlugin(ScrollTrigger);

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [copied, setCopied] = useState(false);
  // Bots fill hidden fields; humans never see this one.
  const trap = useRef("");

  const configured = Boolean(contactForm.web3formsKey || contactForm.endpoint);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked; the address is on screen anyway */
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-c]",
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: "expo.out",
          scrollTrigger: { trigger: root.current, start: "top 78%" },
        },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (trap.current) return; // honeypot tripped

    // Nothing configured means there is no backend to POST to, so hand over a
    // pre-filled draft rather than pretending the message was sent.
    if (!configured) {
      const subject = encodeURIComponent(`Portfolio enquiry from ${form.name || "someone"}`);
      const body = encodeURIComponent(`${form.message}\n\n- ${form.name}\n${form.email}`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      return;
    }

    setStatus("sending");
    try {
      const url = contactForm.web3formsKey
        ? "https://api.web3forms.com/submit"
        : contactForm.endpoint;

      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        message: form.message,
        subject: `Portfolio enquiry from ${form.name}`,
      };
      if (contactForm.web3formsKey) payload.access_key = contactForm.web3formsKey;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Web3Forms can answer 200 with { success: false } (bad key, spam flag),
      // so the HTTP status alone is not proof the message went out.
      const data = await res.json().catch(() => null);
      if (data && data.success === false) throw new Error(data.message ?? "rejected");

      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const field =
    "w-full rounded-lg border border-white/10 bg-white/4 px-4 py-3 font-soft text-sm text-white placeholder:text-ash/70 outline-none transition-colors duration-300 focus:border-ember/60 focus:bg-white/6";
  const label =
    "mb-2 block font-display text-[10px] uppercase tracking-[0.22em] text-ash";

  return (
    <section id="contact" ref={root} className="relative overflow-hidden py-20 md:py-28">
      {/* Ember floor glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-[420px] w-[820px] -translate-x-1/2 blur-[90px]"
        style={{
          background:
            "radial-gradient(circle, rgba(160,42,34,0.22) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1400px] px-[clamp(20px,5vw,80px)]">
        <div className="text-center">
          <span
            data-c
            className="font-display text-[11px] font-semibold uppercase tracking-[0.32em] text-ember"
          >
            Get In Touch
          </span>
          <h2
            data-c
            className="mx-auto mt-5 max-w-4xl font-display text-[clamp(2.1rem,6vw,4rem)] font-bold leading-[1.05] tracking-tight text-white"
          >
            Let&apos;s Build Something Rigorous
          </h2>
          <p
            data-c
            className="mx-auto mt-5 max-w-md font-soft text-[14px] leading-[1.8] text-silver"
          >
            Research collaborations, systems work, or just a good problem.
            I&apos;d like to hear about it.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:mt-14 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          {/* Details */}
          <div
            data-c
            className="rounded-2xl border border-white/10 bg-obsidian/80 p-7 backdrop-blur-sm transition-colors duration-500 hover:border-ember/40 md:p-8"
          >
            <h3 className="font-display text-lg font-bold tracking-tight text-white">
              Contact Details
            </h3>

            <dl className="mt-7 flex flex-col gap-6">
              <Detail
                k="Email"
                v={profile.email}
                href={`mailto:${profile.email}`}
                tone="ember"
                action={
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="mt-1.5 font-display text-[10px] uppercase tracking-[0.16em] text-ash transition-colors duration-300 hover:text-ember-bright"
                  >
                    {copied ? "Copied" : "Copy address"}
                  </button>
                }
              />
              <Detail k="Location" v={profile.location} tone="ember" />
              <Detail k="Availability" v={profile.availability} tone="green" />
            </dl>

            <div className="mt-9 border-t border-white/8 pt-6">
              <div className="mb-4 font-display text-[10px] uppercase tracking-[0.24em] text-ash">
                Socials
              </div>
              <div className="flex gap-3">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-silver transition-all duration-300 hover:-translate-y-0.5 hover:border-ember/60 hover:text-white"
                  >
                    <Icon name={s.icon} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <form
            data-c
            onSubmit={onSubmit}
            className="rounded-2xl border border-white/10 bg-obsidian/80 p-7 backdrop-blur-sm md:p-8"
          >
            {/* Honeypot: off-screen and hidden from assistive tech. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="pointer-events-none absolute h-0 w-0 opacity-0"
              onChange={(e) => (trap.current = e.target.value)}
            />

            <div className="mb-5">
              <label className={label} htmlFor="name">Name</label>
              <input
                id="name" className={field} placeholder="Your name" required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="mb-5">
              <label className={label} htmlFor="email">Email</label>
              <input
                id="email" type="email" className={field} placeholder="you@domain.com" required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="mb-6">
              <label className={label} htmlFor="message">Message</label>
              <textarea
                id="message" rows={5} className={`${field} resize-none`}
                placeholder="Tell me about your project…" required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="group flex w-full items-center justify-center gap-2.5 rounded-lg bg-linear-to-r from-ember-dim to-ember-bright py-3.5 font-display text-sm font-semibold text-white shadow-[0_0_28px_-8px_rgba(252,107,47,0.6)] transition-all duration-400 hover:shadow-[0_0_40px_-6px_rgba(252,107,47,0.8)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? "Sending" : status === "sent" ? "Sent" : "Send Message"}
              <span className="transition-transform duration-400 group-hover:translate-x-1">
                {status === "sent" ? "✓" : "➤"}
              </span>
            </button>

            <p
              aria-live="polite"
              className={`mt-3 min-h-[18px] text-center font-soft text-[12px] ${
                status === "error" ? "text-ember-bright" : "text-ash"
              }`}
            >
              {status === "sent" && "Thanks, that reached me. I'll reply shortly."}
              {status === "error" && "That didn't send. Use the address on the left instead."}
              {status === "idle" && !configured && "Opens a draft in your mail app."}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

function Detail({
  k, v, href, tone, action,
}: {
  k: string;
  v: string;
  href?: string;
  tone: "ember" | "green";
  action?: React.ReactNode;
}) {
  const dot = tone === "green" ? "bg-emerald-400" : "bg-ember";
  return (
    <div className="flex items-start gap-3.5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot} ${tone === "green" ? "animate-pulse" : ""}`} />
      <div>
        <dt className="font-display text-[10px] uppercase tracking-[0.22em] text-ash">{k}</dt>
        <dd className={`mt-1 font-soft text-sm ${tone === "green" ? "text-emerald-400" : "text-cloud"}`}>
          {href ? (
            <a href={href} className="transition-colors hover:text-ember-bright">{v}</a>
          ) : v}
        </dd>
        {action}
      </div>
    </div>
  );
}

function Icon({ name }: { name: string }) {
  const common = { width: 17, height: 17, fill: "currentColor" };
  if (name === "github")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.5 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
      </svg>
    );
  if (name === "linkedin")
    return (
      <svg viewBox="0 0 24 24" {...common}>
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.37-1.85c3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" {...common}>
      <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5-8-5V6l8 5 8-5v2Z" />
    </svg>
  );
}
