import { useEffect, useState } from "react";
import Reveal from "./Reveal";

type Repo = { name: string; html_url: string; description: string | null; language: string | null; pushed_at: string };

const USER = "Ekansh0301";

function ago(iso: string) {
  const d = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 864e5));
  if (d < 14) return `${d}d ago`;
  if (d < 60) return `${Math.round(d / 7)}w ago`;
  return `${Math.round(d / 30)}mo ago`;
}

/** Most recently pushed public repos, fetched when the page loads. */
export default function Repos() {
  const [repos, setRepos] = useState<Repo[] | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    fetch(`https://api.github.com/users/${USER}/repos?sort=pushed&per_page=6`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Repo[]) => setRepos(d))
      .catch(() => setRepos([]));
    return () => ac.abort();
  }, []);

  // If GitHub is unreachable or rate-limited, the section stays out of the way.
  if (repos && repos.length === 0) return null;

  return (
    <section>
      <div className="wrap">
        <Reveal>
          <div className="eyebrow"><b>·</b> / Live from GitHub</div>
          <h2 className="h2">Recently <em>pushed</em></h2>
          <div className="repos">
            {(repos ?? Array.from({ length: 3 })).map((r, i) =>
              r ? (
                <a key={(r as Repo).name} className="repo" href={(r as Repo).html_url} target="_blank" rel="noreferrer">
                  <b>{(r as Repo).name}</b>
                  <span>{(r as Repo).description ?? "No description"}</span>
                  <div className="mono dim" style={{ marginTop: "0.6rem" }}>
                    {(r as Repo).language ?? "—"} · pushed {ago((r as Repo).pushed_at)}
                  </div>
                </a>
              ) : (
                <div key={i} className="repo" style={{ minHeight: "7rem", opacity: 0.4 }} />
              ),
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
