import Link from "next/link";
import { ArrowRight, ExternalLink, Image as ImageIcon, Lock, ShieldCheck } from "lucide-react";
import { PortfolioSiteDraft, ProjectPageDraft } from "@/lib/portfolio-site-draft-types";
import { cn } from "@/lib/utils";

type PortfolioDraftPreviewProps = {
  draft: PortfolioSiteDraft | null;
  isLoading?: boolean;
  error?: string;
  emptyTitle?: string;
  emptyDetail?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function PortfolioDraftPreview({
  draft,
  isLoading,
  error,
  emptyTitle = "Create a site draft first",
  emptyDetail = "The preview only renders saved portfolio drafts from the builder. Create or reset a draft from the approved plan before previewing.",
  actionHref = "/builder",
  actionLabel = "Open Builder"
}: PortfolioDraftPreviewProps) {
  if (isLoading) {
    return (
      <section className="rounded-lg border border-line bg-surface p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Loading preview</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-md border border-line bg-panel" />
          ))}
        </div>
      </section>
    );
  }

  if (!draft) {
    return (
      <section className="rounded-lg border border-amber/25 bg-amber/10 p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-amber">Preview blocked</p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">{emptyTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{error || emptyDetail}</p>
        <Link href={actionHref} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-slateInk transition hover:bg-primary/90">
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>
    );
  }

  const light = draft.theme.appearance === "light";
  const visibleNav = draft.navigation.filter((item) => item.visible).sort((a, b) => a.order - b.order);
  const featuredProject =
    draft.projectPages.find((project) => project.projectId === draft.homepage.featuredProjectId) ?? draft.projectPages[0];

  return (
    <article className={cn("rounded-lg border p-5", light ? "border-slate-200 bg-paper text-slateInk" : "border-line bg-surface text-ink")}>
      <div className={cn("rounded-md border p-4", light ? "border-slate-200 bg-white" : "border-line bg-panel")}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 pb-4">
          <div>
            <p className={cn("text-xs uppercase tracking-[0.18em]", light ? "text-slate-500" : "text-primary")}>Published portfolio draft</p>
            <h2 className="mt-1 text-2xl font-semibold">{draft.homepage.headline}</h2>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs" aria-label="Preview site navigation">
            {visibleNav.map((item) => (
              <span key={item.id} className={cn("rounded-full border px-2.5 py-1", light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-line bg-surface text-muted")}>
                {item.label}
              </span>
            ))}
          </nav>
        </div>

        <section className="grid gap-5 py-6 lg:grid-cols-[1.1fr_0.9fr]" aria-label="Portfolio home preview">
          <div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", light ? "bg-slate-900 text-white" : "bg-primary text-slateInk")}>
              {draft.status}
            </span>
            <h3 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight">{draft.homepage.headline}</h3>
            <p className={cn("mt-3 max-w-2xl text-sm leading-6", light ? "text-slate-600" : "text-muted")}>{draft.homepage.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={cn("rounded-md border px-3 py-2 text-xs font-semibold", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
                {draft.projectPages.length} project page{draft.projectPages.length === 1 ? "" : "s"}
              </span>
              <span className={cn("rounded-md border px-3 py-2 text-xs font-semibold", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
                {draft.provenance.length} provenance reference{draft.provenance.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          <div className={cn("rounded-md border p-4", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
            <p className={cn("text-xs uppercase tracking-[0.16em]", light ? "text-slate-500" : "text-primary")}>Featured project</p>
            <div className={cn("mt-3 aspect-[16/10] rounded-md border border-dashed p-4", light ? "border-slate-300 bg-white" : "border-primary/30 bg-surface")}>
              <div className="flex h-full flex-col justify-between">
                <ImageIcon className={cn("h-8 w-8", light ? "text-slate-400" : "text-primary")} aria-hidden />
                <div>
                  <p className="text-sm font-semibold">{featuredProject?.title ?? "Featured project pending"}</p>
                  <p className={cn("mt-1 text-xs leading-5", light ? "text-slate-500" : "text-muted")}>
                    Hero visual slot uses approved media only.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <ProjectIndexPreview draft={draft} light={light} />
        <CaseStudyPreview project={featuredProject} light={light} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {["About/Profile", "Skills and proof", "Contact handoff"].map((title) => (
          <div key={title} className={cn("rounded-md border p-4", light ? "border-slate-200 bg-white" : "border-line bg-panel")}>
            <h3 className="font-semibold">{title}</h3>
            <p className={cn("mt-3 text-sm leading-6", light ? "text-slate-600" : "text-muted")}>
              Drawn from the approved portfolio strategy and saved draft navigation.
            </p>
          </div>
        ))}
      </div>

      <div className={cn("mt-5 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-xs", light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-line bg-background text-muted")}>
        <span>{draft.guardrails.length ? draft.guardrails[0] : "Evidence and provenance remain attached to the draft."}</span>
        <span className="inline-flex items-center gap-2 font-semibold text-primary">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          No hidden publish action
        </span>
      </div>
    </article>
  );
}

function ProjectIndexPreview({ draft, light }: { draft: PortfolioSiteDraft; light: boolean }) {
  const projectsById = new Map(draft.projectPages.map((project) => [project.projectId, project]));
  const orderedProjects = draft.homepage.projectPreviewOrder
    .map((id) => projectsById.get(id))
    .filter(Boolean) as ProjectPageDraft[];
  const projects = orderedProjects.length ? orderedProjects : draft.projectPages;

  return (
    <section className={cn("rounded-md border p-4", light ? "border-slate-200 bg-white" : "border-line bg-panel")}>
      <p className={cn("text-xs uppercase tracking-[0.16em]", light ? "text-slate-500" : "text-primary")}>Projects page</p>
      <h3 className="mt-1 text-xl font-semibold">Project index and case-study routes</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {projects.slice(0, 3).map((project) => (
          <article key={project.projectId} className={cn("rounded-md border p-3", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
            <div className={cn("mb-3 flex aspect-video items-center justify-center rounded border border-dashed", light ? "border-slate-300 bg-white" : "border-primary/25 bg-surface")}>
              <ImageIcon className={cn("h-5 w-5", light ? "text-slate-400" : "text-primary")} aria-hidden />
            </div>
            <p className="truncate text-sm font-semibold">{project.title}</p>
            <p className={cn("mt-1 text-xs capitalize", light ? "text-slate-500" : "text-muted")}>{project.role}</p>
            <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Open case study <ExternalLink className="h-3 w-3" aria-hidden />
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CaseStudyPreview({ project, light }: { project?: ProjectPageDraft; light: boolean }) {
  const sections = project?.sectionBlocks.filter((section) => section.visible).sort((a, b) => a.order - b.order) ?? [];

  return (
    <section className={cn("rounded-md border p-4", light ? "border-slate-200 bg-white" : "border-line bg-panel")}>
      <p className={cn("text-xs uppercase tracking-[0.16em]", light ? "text-slate-500" : "text-primary")}>Nested under Projects</p>
      <h3 className="mt-1 text-xl font-semibold">{project?.title ?? "Case study pending"}</h3>
      <div className="mt-4 space-y-3">
        {sections.slice(0, 4).map((section) => (
          <article key={section.id} className={cn("rounded-md border p-3", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-semibold">{section.title}</h4>
              {section.locked ? <Lock className="h-4 w-4 text-primary" aria-label="Locked section" /> : null}
            </div>
            <p className={cn("mt-2 text-xs", section.provenance.length ? "text-emerald" : "text-danger")}>
              {section.provenance.length ? `${section.provenance.length} evidence source${section.provenance.length === 1 ? "" : "s"}` : "No evidence found"}
            </p>
          </article>
        ))}
        {!sections.length ? (
          <p className={cn("rounded-md border p-3 text-sm", light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-line bg-background text-muted")}>
            Compose and save a project page before previewing case-study sections.
          </p>
        ) : null}
      </div>
    </section>
  );
}
