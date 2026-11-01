import { useRef, useState } from "react";
import { contactForm, profile } from "../data/content";
import Reveal from "./Reveal";

export default function Contact() {
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending" || trap.current) return;

    // No backend configured: hand over a pre-filled draft instead of pretending it was sent.
    if (!configured) {
      const subject = encodeURIComponent(`Portfolio enquiry from ${form.name || "someone"}`);
      const body = encodeURIComponent(`${form.message}\n\n- ${form.name}\n${form.email}`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      return;
    }

    setStatus("sending");
    try {
      const url = contactForm.web3formsKey ? "https://api.web3forms.com/submit" : contactForm.endpoint;
      const payload: Record<string, string> = {
        ...form,
        subject: `Portfolio enquiry from ${form.name}`,
      };
      if (contactForm.web3formsKey) payload.access_key = contactForm.web3formsKey;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      // Web3Forms can answer 200 with { success: false } (bad key, spam flag).
      const data = await res.json().catch(() => null);
      if (data && data.success === false) throw new Error(data.message ?? "rejected");

      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" style={{ borderTop: "1px solid var(--rule)" }}>
      <div className="wrap">
        <Reveal>
          <div className="eyebrow"><b>05</b> / Contact</div>
          <h2 className="h2">Got a hard problem? <em>Tell me.</em></h2>
          <p style={{ color: "var(--ink-2)", maxWidth: "34rem", margin: "1.2rem 0 2.5rem" }}>
            Research collaborations, systems work, or something that does not have a name yet.
          </p>
          <a className="mail" href={`mailto:${profile.email}`}>{profile.email}</a>
          <div className="row-c" style={{ marginTop: "1rem" }}>
            <button className="sm" onClick={copyEmail}>{copied ? "Copied ✓" : "Copy address"}</button>
            <span className="mono dim">{profile.location}</span>
          </div>

          <form className="contact" onSubmit={onSubmit}>
            <input
              type="text" tabIndex={-1} autoComplete="off" aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", opacity: 0 }}
              onChange={(e) => (trap.current = e.target.value)}
            />
            <div>
              <label htmlFor="name">Name</label>
              <input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label htmlFor="message">Message</label>
              <textarea id="message" rows={4} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div className="row-c">
              <button className="btn solid" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : status === "sent" ? "Sent ✓" : "Send message →"}
              </button>
              <span aria-live="polite" className="mono" style={{ color: status === "error" ? "var(--bad)" : "var(--ink-3)" }}>
                {status === "sent" && "That reached me. I'll reply shortly."}
                {status === "error" && "That didn't send. Use the address above."}
                {status === "idle" && !configured && "Opens a draft in your mail app."}
              </span>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
