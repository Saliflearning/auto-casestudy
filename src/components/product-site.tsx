import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, FileText, GraduationCap, LayoutTemplate, Mail, Sparkles, Upload } from "lucide-react";
import { SiteNav } from "@/components/site-nav";

const portfolioSections = ["Home", "About", "Projects", "Case studies", "Experience", "Skills", "Contact"];

const projectCards = [
  ["UX research case study", "Interview notes, testing results, affinity maps"],
  ["Product design project", "Screens, flows, design rationale"],
  ["Technical project", "Architecture, GitHub proof, implementation story"]
];

export function ProductSite() {
  return (
    <main className="min-h-dvh overflow-x-hidden">
      <SiteNav />
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:py-16">
        <div className="animate-soft-in flex flex-col justify-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">AI portfolio website builder</p>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-ink sm:text-6xl">
            Build a full portfolio website from messy career evidence.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted">
            Upload projects, research, screenshots, resumes, and technical proof. Auto-CaseStudy turns them into a portfolio site with editable pages and evidence-backed stories.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/studio#ingest" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 font-semibold text-slateInk transition hover:bg-primary/90">
              Upload evidence <Upload className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/templates" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-5 font-semibold text-ink transition hover:bg-panelHigh">
              Explore portfolio systems <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        <PortfolioWebsitePreview />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ["Upload", "Bring in the raw evidence."],
            ["Organize", "Group artifacts into projects."],
            ["Generate", "Create pages and case studies."],
            ["Publish", "Share a complete portfolio site."]
          ].map(([title, detail]) => (
            <article key={title} className="workflow-card rounded-lg border border-line bg-surface p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/30 hover:bg-panel">
              <h2 className="text-lg font-semibold text-ink">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-3 lg:px-8">
        <FeatureCard icon={LayoutTemplate} title="Portfolio website, not one page" detail="Generate home, about, projects, case studies, resume, skills, and contact sections." />
        <FeatureCard icon={BriefcaseBusiness} title="Multiple project stories" detail="Turn school, work, and technical artifacts into a connected project library." />
        <FeatureCard icon={Sparkles} title="Studio editing flow" detail="Edit copy, reorder sections, review evidence, and prepare the site for publishing." />
      </section>
    </main>
  );
}

function PortfolioWebsitePreview() {
  return (
    <aside className="animate-soft-in-delay rounded-xl border border-line bg-surface p-4 shadow-soft">
      <div className="rounded-lg border border-line bg-paper p-4 text-slateInk">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Published portfolio</p>
            <h2 className="mt-1 text-2xl font-bold">Maya Chen</h2>
          </div>
          <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">UX Research + Design</span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_.85fr]">
          <div className="rounded-lg bg-slate-100 p-4">
            <p className="text-sm text-slate-600">Home</p>
            <h3 className="mt-2 text-xl font-bold">Evidence-backed product designer focused on onboarding and access.</h3>
          </div>
          <div className="rounded-lg bg-slate-900 p-4 text-white">
            <p className="text-sm text-slate-300">About + Skills</p>
            <p className="mt-2 text-sm leading-6">Research methods, Figma, accessibility, prototyping, cloud basics.</p>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {projectCards.map(([title, detail]) => (
            <article key={title} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Expanded case study</p>
          <h3 className="mt-2 font-bold">Redesigning first-time student onboarding</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Problem, role, research evidence, design decisions, outcomes, and reflection.</p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-100 p-3 text-sm">
            <FileText className="mb-2 h-4 w-4" aria-hidden />
            Resume and experience
          </div>
          <div className="rounded-lg bg-slate-100 p-3 text-sm">
            <Mail className="mb-2 h-4 w-4" aria-hidden />
            Contact block
          </div>
        </div>
      </div>
    </aside>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  detail
}: {
  icon: typeof GraduationCap;
  title: string;
  detail: string;
}) {
  return (
    <article className="rounded-lg border border-line bg-surface p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/30 hover:bg-panel">
      <Icon className="h-5 w-5 text-primary" aria-hidden />
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </article>
  );
}
