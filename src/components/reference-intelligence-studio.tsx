"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Camera, Database, Link as LinkIcon, SearchCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { PortfolioReference } from "@/lib/portfolio-reference-types";
import { createReferenceFromUrl } from "@/lib/portfolio-reference-intelligence";

const LOCAL_REFERENCE_KEY = "auto-casestudy-reference-backlog";

function readLocalReferences() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_REFERENCE_KEY) ?? "[]") as PortfolioReference[];
  } catch {
    return [];
  }
}

function writeLocalReferences(references: PortfolioReference[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_REFERENCE_KEY, JSON.stringify(references));
}

function makeLocalReference(url: string): PortfolioReference {
  const now = new Date().toISOString();
  return {
    ...createReferenceFromUrl(url),
    id: `local_reference_${crypto.randomUUID()}`,
    createdAt: now,
    updatedAt: now
  };
}

export function ReferenceIntelligenceStudio() {
  const [url, setUrl] = useState("");
  const [references, setReferences] = useState<PortfolioReference[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const localReferences = readLocalReferences();
    if (localReferences.length) setReferences(localReferences);

    fetch("/api/portfolio-references")
      .then((response) => response.json())
      .then((payload) => {
        if (Array.isArray(payload.references) && payload.references.length) {
          const merged = [
            ...payload.references,
            ...localReferences.filter((local) => !payload.references.some((remote: PortfolioReference) => remote.normalizedUrl === local.normalizedUrl))
          ];
          setReferences(merged);
          writeLocalReferences(merged);
        }
      })
      .catch(() => {
        if (!localReferences.length) setError("Could not load server references. You can still queue references in this browser.");
      });
  }, []);

  async function submitReference(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim()) return;
    setIsSubmitting(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/portfolio-references", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not ingest reference.");
      setReferences((current) => {
        const next = [payload.reference as PortfolioReference, ...current.filter((item) => item.normalizedUrl !== payload.reference.normalizedUrl)];
        writeLocalReferences(next);
        return next;
      });
      setUrl("");
      setStatus("Reference queued for screenshot capture and human review.");
    } catch (caught) {
      try {
        const localReference = makeLocalReference(url);
        setReferences((current) => {
          const next = [localReference, ...current.filter((item) => item.normalizedUrl !== localReference.normalizedUrl)];
          writeLocalReferences(next);
          return next;
        });
        setUrl("");
        setStatus("Reference saved in this browser. Durable server storage will be added with the screenshot pipeline.");
      } catch {
        setError(caught instanceof Error ? caught.message : "Could not ingest reference.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-xl border border-line bg-surface p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Internal intelligence</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-ink">Portfolio Reference Intelligence</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
              Build a structured reference dataset that guides portfolio planning, layout choices, storytelling patterns, and recruiter-readable strategy. References guide agents; they are not copied.
            </p>

            <form onSubmit={submitReference} className="mt-6 rounded-lg border border-line bg-panel p-4">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-muted" htmlFor="reference-url">
                Portfolio URL
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  id="reference-url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com/portfolio"
                  className="min-h-11 flex-1 rounded-md border border-line bg-background px-3 text-sm text-ink placeholder:text-faint"
                />
                <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-slateInk transition hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? "Queuing..." : "Queue reference"}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
              {error ? <p className="mt-3 rounded-md border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
              {status ? <p className="mt-3 rounded-md border border-emerald/25 bg-emerald/10 p-3 text-sm text-emerald">{status}</p> : null}
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["Evidence-first", "References guide planning only after evidence is understood.", Database],
                ["Capture backlog", "Screenshot automation will fill page and visual data next.", Camera],
                ["Human review", "Admins tag storytelling, hierarchy, and recruiter quality.", BadgeCheck],
                ["No copying", "Patterns are summarized into strategy, not duplicated.", SearchCheck]
              ].map(([title, detail, Icon]) => (
                <article key={title as string} className="rounded-lg border border-line bg-panel p-4">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <h2 className="mt-3 font-semibold text-ink">{title as string}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">{detail as string}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-surface p-6 shadow-soft">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Dataset</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Reference backlog</h2>
              </div>
              <span className="rounded-full border border-line bg-panel px-3 py-1 text-sm text-muted">{references.length} references</span>
            </div>

            <div className="mt-5 space-y-3">
              {references.length ? (
                references.map((reference) => (
                  <article key={reference.id} className="rounded-lg border border-line bg-panel p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <a href={reference.normalizedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-semibold text-ink hover:text-primary">
                          <LinkIcon className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="truncate">{reference.title}</span>
                        </a>
                        <p className="mt-2 text-xs leading-5 text-muted">{reference.normalizedUrl}</p>
                      </div>
                      <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {reference.captureStatus}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 md:grid-cols-3">
                      {[
                        ["Archetype", reference.archetype],
                        ["Style", reference.portfolioStyle],
                        ["Recruiter", reference.recruiterReadability]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-md border border-line bg-background p-3">
                          <p className="text-xs uppercase tracking-[0.14em] text-faint">{label}</p>
                          <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {reference.reviewTags.map((tag) => (
                        <span key={tag} className="rounded-full border border-line bg-background px-2 py-1 text-xs text-muted">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-line bg-panel p-6 text-sm leading-6 text-muted">
                  No references yet. Add portfolio URLs to start building the internal intelligence dataset.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
