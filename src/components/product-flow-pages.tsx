"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ArrowRight, BadgeCheck, FileText, LayoutTemplate, Link as LinkIcon, Lock, MonitorUp, Save, ShieldAlert, Sparkles, Upload, UserRoundCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { PortfolioDraftPreview } from "@/components/portfolio-draft-preview";
import { flowDependencies, studioFlowSteps } from "@/lib/product-flow";
import { GenerationReadinessResult } from "@/lib/generation-readiness";
import { PortfolioSiteDraft } from "@/lib/portfolio-site-draft-types";
import { AudienceMode, Persona, PortfolioTheme } from "@/lib/types";
import { workspaceRequestHeaders } from "@/lib/client-workspace";
import { cn } from "@/lib/utils";
import { usePortfolioStore } from "@/store/use-portfolio-store";

type LoadState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
};

const profileKey = "auto-casestudy-profile-context";

const personaOptions: Persona[] = [
  "Technical UX Hybrid",
  "UX Researcher",
  "Product Designer",
  "HCI Master's Student",
  "Cloud/IT Hybrid",
  "Product Manager",
  "Software Project Builder"
];

const templateCards = [
  {
    title: "UX Research",
    detail: "Methods, findings, evidence quality, limitations, and research impact.",
    bestFor: "HCI students, UX researchers, research-heavy case studies."
  },
  {
    title: "Product Design",
    detail: "Visual flow, iterations, prototype evidence, decisions, and final design.",
    bestFor: "Product designers and visual portfolio reviews."
  },
  {
    title: "Technical UX Hybrid",
    detail: "Design reasoning plus architecture, implementation constraints, and systems credibility.",
    bestFor: "Hybrid UX, cloud, IT, and software project builders."
  },
  {
    title: "Recruiter Clean",
    detail: "Fast scan path, strongest proof first, concise sections, and clear role ownership.",
    bestFor: "Early-career professionals applying now."
  }
];

function usePortfolioSiteDraft(): LoadState<PortfolioSiteDraft> {
  const [state, setState] = useState<LoadState<PortfolioSiteDraft>>({ data: null, loading: true, error: "" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/portfolio-site-draft", {
      cache: "no-store",
      headers: workspaceRequestHeaders()
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) setState({ data: payload.draft ?? null, loading: false, error: "" });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, error: "Could not load the saved portfolio site draft." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

function useReadiness(): LoadState<GenerationReadinessResult> {
  const [state, setState] = useState<LoadState<GenerationReadinessResult>>({ data: null, loading: true, error: "" });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/generation/readiness", {
      cache: "no-store",
      headers: workspaceRequestHeaders()
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) setState({ data: payload.readiness ?? null, loading: false, error: "" });
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, error: "Could not load generation readiness." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function ProfileSetupPage() {
  const persona = usePortfolioStore((state) => state.persona);
  const audienceMode = usePortfolioStore((state) => state.audienceMode);
  const theme = usePortfolioStore((state) => state.theme);
  const setPersona = usePortfolioStore((state) => state.setPersona);
  const setAudienceMode = usePortfolioStore((state) => state.setAudienceMode);
  const setTheme = usePortfolioStore((state) => state.setTheme);
  const [profile, setProfile] = useState({
    name: "",
    headline: "",
    bio: "",
    skills: "",
    links: "",
    resumeContext: ""
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(profileKey);
      if (stored) setProfile((current) => ({ ...current, ...JSON.parse(stored) }));
    } catch {
      // Local profile context is optional in the MVP.
    }
  }, []);

  function updateProfile(field: keyof typeof profile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function saveProfile() {
    window.localStorage.setItem(profileKey, JSON.stringify({ ...profile, persona, audienceMode, theme }));
    setSaved(true);
  }

  return (
    <main className="min-h-dvh">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Profile setup"
          title="Tell the agent who this portfolio is for."
          detail="Profile context feeds portfolio strategy, homepage positioning, and recruiter-facing copy. It does not replace evidence."
        />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-line bg-surface p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Name" value={profile.name} onChange={(event) => updateProfile("name", event.target.value)} placeholder="Your name" />
              <label className="text-sm font-semibold text-ink">
                Target persona
                <select value={persona} onChange={(event) => setPersona(event.target.value as Persona)} className="mt-2 min-h-11 w-full rounded-md border border-line bg-background px-3 text-sm text-ink">
                  {personaOptions.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <TextField label="Headline" value={profile.headline} onChange={(event) => updateProfile("headline", event.target.value)} placeholder="UX researcher focused on evidence-backed product decisions" />
              <TextField label="Links" value={profile.links} onChange={(event) => updateProfile("links", event.target.value)} placeholder="LinkedIn, GitHub, website, email" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <TextArea label="Short bio" value={profile.bio} onChange={(event) => updateProfile("bio", event.target.value)} placeholder="A concise professional summary the agent can use for About and Home." />
              <TextArea label="Skills and tools" value={profile.skills} onChange={(event) => updateProfile("skills", event.target.value)} placeholder="Methods, tools, certifications, and technical skills." />
              <TextArea label="Resume context" value={profile.resumeContext} onChange={(event) => updateProfile("resumeContext", event.target.value)} placeholder="Roles, courses, work experience, awards, certifications, and resume facts." />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={saveProfile} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-slateInk transition hover:bg-primary/90">
                <Save className="h-4 w-4" aria-hidden />
                Save profile context
              </button>
              <Link href="/studio#ingest" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 font-semibold text-ink transition hover:bg-panelHigh">
                Upload evidence <Upload className="h-4 w-4" aria-hidden />
              </Link>
              {saved ? <span className="inline-flex min-h-11 items-center rounded-md border border-emerald/25 bg-emerald/10 px-3 text-sm font-semibold text-emerald">Profile saved locally</span> : null}
            </div>
          </section>

          <aside className="space-y-4">
            <FlowDependencyCard title="Profile feeds Strategy" detail="The persona selector updates the same studio store used by portfolio planning." />
            <div className="rounded-lg border border-line bg-surface p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Current output lens</p>
              <div className="mt-4 grid gap-3">
                {["Portfolio", "Research", "Technical"].map((mode) => (
                  <button key={mode} type="button" onClick={() => setAudienceMode(mode as AudienceMode)} className={cn("min-h-10 rounded-md border px-3 text-sm font-semibold", audienceMode === mode ? "border-primary/40 bg-primary/15 text-primary" : "border-line bg-panel text-muted hover:text-ink")}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-line bg-surface p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Theme signal</p>
              <select value={theme} onChange={(event) => setTheme(event.target.value as PortfolioTheme)} className="mt-4 min-h-11 w-full rounded-md border border-line bg-background px-3 text-sm text-ink">
                {["Instrument Dark", "Editorial Light", "Recruiter Clean"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

export function ProjectsWorkspacePage() {
  const { data: draft, loading, error } = usePortfolioSiteDraft();
  const artifacts = usePortfolioStore((state) => state.artifacts);
  const generatedProjects = draft?.projectPages ?? [];

  return (
    <main className="min-h-dvh">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Projects"
          title="Project library and case-study routes."
          detail="Projects are where case studies live. The page reflects saved builder draft state when available, with clear next actions when upstream work is missing."
        />

        {loading ? (
          <div className="mt-8 h-40 animate-pulse rounded-lg border border-line bg-surface" />
        ) : generatedProjects.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {generatedProjects.map((project) => (
              <article key={project.projectId} className="rounded-lg border border-line bg-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-primary">{project.role}</p>
                    <h2 className="mt-2 text-xl font-semibold text-ink">{project.title}</h2>
                  </div>
                  <BadgeCheck className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <p className="mt-4 text-sm leading-6 text-muted">{project.sectionBlocks.filter((section) => section.visible).length} visible sections</p>
                <p className="mt-2 text-sm leading-6 text-muted">{project.provenance.length} provenance references attached</p>
                <Link href="/studio#editor" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink transition hover:bg-panelHigh">
                  Edit project page <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <MissingState
            title="No saved project pages yet"
            detail={error || `${artifacts.length} artifacts are available in the workspace, but the project library waits for a saved portfolio site draft.`}
            actionHref="/studio#editor"
            actionLabel="Create site draft in Builder"
          />
        )}
      </section>
    </main>
  );
}

export function TemplatesWorkspacePage() {
  return (
    <main className="min-h-dvh">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Templates"
          title="Choose a portfolio archetype, not a random skin."
          detail="Templates shape structure, hierarchy, media rhythm, and recruiter scanning after evidence is understood."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {templateCards.map((template) => (
            <article key={template.title} className="rounded-lg border border-line bg-surface p-5 transition hover:-translate-y-1 hover:border-primary/30 hover:bg-panel">
              <LayoutTemplate className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="mt-4 text-xl font-semibold text-ink">{template.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{template.detail}</p>
              <p className="mt-4 rounded-md border border-line bg-background p-3 text-xs leading-5 text-muted">{template.bestFor}</p>
              <Link href="/studio#strategy" className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-ink transition hover:bg-panelHigh">
                Use in Strategy <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function PreviewWorkspacePage() {
  const { data: draft, loading, error } = usePortfolioSiteDraft();

  return (
    <main className="min-h-dvh">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Preview"
          title="Recruiter-facing portfolio preview."
          detail="This route intentionally hides editor controls and renders only the saved site draft."
        />
        <div className="mt-8">
          <PortfolioDraftPreview draft={draft} isLoading={loading} error={error} />
        </div>
      </section>
    </main>
  );
}

export function PublishWorkspacePage() {
  return (
    <main className="min-h-dvh">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Publish"
          title="Publishing setup is gated by readiness."
          detail="Publish controls unlock only after a saved draft exists and the evidence-backed readiness gate is acceptable."
        />
        <div className="mt-8">
          <PublishReadinessPanel />
        </div>
      </section>
    </main>
  );
}

export function StudioPreviewPanel() {
  const { data: draft, loading, error } = usePortfolioSiteDraft();
  return <PortfolioDraftPreview draft={draft} isLoading={loading} error={error} />;
}

export function EditorDependencyGate() {
  const { data: readiness, loading, error } = useReadiness();

  if (loading) {
    return <div className="rounded-lg border border-line bg-surface p-4 text-sm text-muted">Checking persisted blueprint and generation readiness...</div>;
  }

  if (!readiness || readiness.state === "blocked") {
    return (
      <section className="rounded-lg border border-amber/25 bg-amber/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-amber">Upstream gate</p>
            <h2 className="mt-2 text-xl font-semibold text-ink">Confirm the blueprint before generation or builder reset.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{error || "The editor can show saved work, but new generation must wait for a persisted, reviewed blueprint."}</p>
          </div>
          <Link href="/studio#strategy" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-slateInk transition hover:bg-primary/90">
            Open Strategy <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {readiness?.issues.length ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {readiness.issues.slice(0, 4).map((issue) => (
              <p key={issue.id} className="rounded-md border border-line bg-background p-3 text-xs leading-5 text-muted">{issue.message}</p>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-emerald/25 bg-emerald/10 p-4">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald">
        <BadgeCheck className="h-4 w-4" aria-hidden />
        Blueprint gate ready. Builder actions can use persisted approved state.
      </p>
    </section>
  );
}

export function PublishReadinessPanel({ evidenceCoverage, gaps }: { evidenceCoverage?: number; gaps?: number } = {}) {
  const { data: draft, loading: draftLoading } = usePortfolioSiteDraft();
  const { data: readiness, loading: readinessLoading, error } = useReadiness();
  const isLoading = draftLoading || readinessLoading;
  const ready = Boolean(draft && readiness?.state !== "blocked");
  const issues = readiness?.issues ?? [];

  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Publish gate</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">{ready ? "Portfolio can enter publish setup" : "Publishing is blocked"}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Publish depends on a saved PortfolioSiteDraft plus the generation readiness gate. No hosted output is created from incomplete state.
          </p>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", ready ? "bg-emerald/15 text-emerald" : "bg-amber/15 text-amber")}>
          {isLoading ? "Checking" : ready ? "Ready for setup" : "Needs work"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        {[
          ["Site draft", draft ? "Saved" : "Missing"],
          ["Readiness", readiness?.state ?? "Unknown"],
          ["Evidence coverage", typeof evidenceCoverage === "number" ? `${evidenceCoverage}%` : "From gate"],
          ["Open gaps", typeof gaps === "number" ? `${gaps}` : `${readiness?.issueCount ?? 0}`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-line bg-panel p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-faint">{label}</p>
            <p className="mt-1 font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>

      {issues.length || error || !draft ? (
        <div className="mt-5 space-y-2">
          {!draft ? <p className="rounded-md border border-amber/25 bg-amber/10 p-3 text-sm text-amber">Create and save a site draft in Builder before publishing.</p> : null}
          {error ? <p className="rounded-md border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
          {issues.slice(0, 5).map((issue) => (
            <p key={issue.id} className={cn("rounded-md border p-3 text-sm", issue.severity === "blocker" ? "border-danger/25 bg-danger/10 text-danger" : "border-amber/25 bg-amber/10 text-amber")}>
              {issue.message}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Static web setup", "Prepare hosted portfolio pages", MonitorUp],
          ["PDF packet", "Recruiter and academic share format", FileText],
          ["Domain settings", "Custom domain and canonical URL later", LinkIcon],
          ["Accessibility queue", "Alt text, contrast, semantic review", ShieldAlert]
        ].map(([title, detail, Icon]) => (
          <div key={title as string} className="flex items-start gap-3 rounded-md border border-line bg-panel p-3">
            <Icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold">{title as string}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{detail as string}</p>
            </div>
          </div>
        ))}
      </div>

      <button type="button" disabled={!ready} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-slateInk transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
        {ready ? <Sparkles className="h-4 w-4" aria-hidden /> : <Lock className="h-4 w-4" aria-hidden />}
        {ready ? "Prepare publish setup" : "Resolve blockers first"}
      </button>
    </section>
  );
}

export function FlowAuditMap() {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-primary">Product flow</p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {studioFlowSteps.map((step) => (
          <Link key={step.id} href={step.route} className="rounded-md border border-line bg-panel p-3 transition hover:border-primary/30 hover:bg-panelHigh">
            <p className="text-sm font-semibold text-ink">{step.label}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{step.responsibility}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PageHeader({ eyebrow, title, detail }: { eyebrow: string; title: string; detail: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">{title}</h1>
      <p className="mt-4 text-base leading-8 text-muted">{detail}</p>
    </div>
  );
}

function TextField({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="text-sm font-semibold text-ink">
      {label}
      <input {...props} className="mt-2 min-h-11 w-full rounded-md border border-line bg-background px-3 text-sm text-ink placeholder:text-faint" />
    </label>
  );
}

function TextArea({ label, ...props }: { label: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="text-sm font-semibold text-ink">
      {label}
      <textarea {...props} rows={6} className="mt-2 w-full rounded-md border border-line bg-background p-3 text-sm leading-6 text-ink placeholder:text-faint" />
    </label>
  );
}

function MissingState({ title, detail, actionHref, actionLabel }: { title: string; detail: string; actionHref: string; actionLabel: string }) {
  return (
    <section className="mt-8 rounded-lg border border-amber/25 bg-amber/10 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-amber">Needs upstream state</p>
      <h2 className="mt-2 text-2xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{detail}</p>
      <Link href={actionHref} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-slateInk transition hover:bg-primary/90">
        {actionLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}

function FlowDependencyCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <UserRoundCheck className="h-5 w-5 text-primary" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
      <div className="mt-4 space-y-2">
        {flowDependencies.slice(0, 3).map((item) => (
          <p key={item.page} className="rounded-md border border-line bg-panel p-2 text-xs leading-5 text-muted">
            <strong className="text-ink">{item.page}:</strong> {item.feeds}
          </p>
        ))}
      </div>
    </div>
  );
}
