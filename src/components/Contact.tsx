import { useEffect, useRef, useState } from "react";
import { contactForm, profile } from "../data/content";
import { Slate } from "./Pages";

type Repo = { name: string; html_url: string; description: string | null; language: string | null };

export default function Contact({ id, scene }: { id: string; scene: number }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const trap = useRef(""); // bots fill hidden fields; humans never see this one

  const configured = Boolean(contactForm.web3formsKey || contactForm.endpoint);

  useEffect(() => {
    const ac = new AbortController();
    fetch("https://api.github.com/users/Ekansh0301/repos?sort=pushed&per_page=3", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : []))
      .then((d: Repo[]) => setRepos(Array.isArray(d) ? d : []))
      .catch(() => setRepos([]));
    return () => ac.abort();
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked; the address is on screen anyway */ }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending" || trap.current) return;
    if (!configured) {
      const subject = encodeURIComponent(`Portfolio enquiry from ${form.name || "someone"}`);
      const body = encodeURIComponent(`${form.message}\n\n- ${form.name}\n${form.email}`);
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      return;
    }
    setStatus("sending");
    try {
      const url = contactForm.web3formsKey ? "https://api.web3forms.com/submit" : contactForm.endpoint;
      const payload: Record<string, string> = { ...form, subject: `Portfolio enquiry from ${form.name}` };
      if (contactForm.web3formsKey) payload.access_key = contactForm.web3formsKey;
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json().catch(() => null); // Web3Forms can answer 200 with success:false
      if (data && data.success === false) throw new Error(data.message ?? "rejected");
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch { setStatus("error"); }
  };

  return (
    <section id={id} className="page">
      <div className="wrap">
        <Slate scene={scene} title={<>Got a hard problem? <em>Tell me.</em></>} note="final scene" />
        <div className="pair" style={{ gap: "3rem", alignItems: "start" }}>
          <div>
            <p style={{ color: "var(--ink-2)", maxWidth: "30rem", margin: "0 0 1.4rem" }}>
              Research collaborations, systems work, or something that does not have a name yet.
            </p>
            <a className="mail" href={`mailto:${profile.email}`}>{profile.email}</a>
            <div className="row" style={{ marginTop: "0.9rem" }}>
              <button className="sm" onClick={copyEmail}>{copied ? "copied ✓" : "copy address"}</button>
              <span className="mono dim">{profile.location}</span>
            </div>
            {repos.length > 0 && (
              <div style={{ marginTop: "2.2rem" }}>
                <div className="mono dim" style={{ textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Latest pushes · live from GitHub</div>
                <div className="repos">
                  {repos.map((r) => (
                    <a key={r.name} className="repo" href={r.html_url} target="_blank" rel="noreferrer">
                      <b>{r.name}</b><span>{r.description ?? r.language ?? "—"}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          <form className="contact" onSubmit={onSubmit}>
            <input type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0 }} onChange={(e) => (trap.current = e.target.value)} />
            <div><label htmlFor="name">Name</label><input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label htmlFor="email">Email</label><input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label htmlFor="message">Message</label><textarea id="message" rows={4} required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            <div className="row" style={{ marginTop: "0.4rem" }}>
              <button className="btn solid" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : status === "sent" ? "Sent ✓" : "Send message →"}</button>
              <span aria-live="polite" className="mono" style={{ color: status === "error" ? "var(--bad)" : "var(--ink-3)" }}>
                {status === "sent" && "That reached me. I'll reply shortly."}
                {status === "error" && "That didn't send. Use the address on the left."}
                {status === "idle" && !configured && "Opens a draft in your mail app."}
              </span>
            </div>
          </form>
        </div>
        <footer className="foot mono dim">
          <span>© {new Date().getFullYear()} Ekansh Goyal · Anemia demo photo: J. Trobe, MD, Univ. of Michigan Kellogg Eye Center, CC BY 3.0 (Wikimedia Commons), cropped and colour-softened</span>
          <span style={{ display: "flex", gap: "1rem" }}>
            <a className="navbtn solid" href="https://github.com/Ekansh0301" target="_blank" rel="noreferrer">GitHub ↗</a>
            <a className="navbtn" href="https://linkedin.com/in/ekanshgoyal-cs" target="_blank" rel="noreferrer">LinkedIn ↗</a>
          </span>
        </footer>
      </div>
    </section>
  );
}
