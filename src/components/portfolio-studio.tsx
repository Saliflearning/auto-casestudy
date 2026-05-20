"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Accessibility,
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Cloud,
  Download,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  Link,
  Lock,
  LockOpen,
  MonitorUp,
  Network,
  PenLine,
  RefreshCw,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  Upload,
  UserRoundCheck,
  WandSparkles
} from "lucide-react";
import { ChangeEvent, DragEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Artifact, ArtifactRelationship, CaseStudySection, Persona, PortfolioTheme, ProjectCluster, UnderstandingBacklogItem } from "@/lib/types";
import { buildUnderstandingBacklog } from "@/lib/understanding-backlog";
import { useGaps, usePortfolioStore } from "@/store/use-portfolio-store";

const personas: Persona[] = [
  "Technical UX Hybrid",
  "UX Researcher",
  "Product Designer",
  "HCI Master's Student",
  "Cloud/IT Hybrid",
  "Product Manager",
  "Software Project Builder"
];

const themes: PortfolioTheme[] = ["Instrument Dark", "Editorial Light", "Recruiter Clean"];
const MAX_UPLOAD_FILES = 5;
const MAX_BROWSER_FILE_BYTES = 4 * 1024 * 1024;
const MAX_BROWSER_BATCH_BYTES = 4 * 1024 * 1024;
const ACCEPTED_UPLOAD_EXTENSIONS = new Set(["pdf", "docx", "pptx", "png", "jpg", "jpeg", "webp"]);

const workflow = [
  { id: "ingest", label: "Inbox", icon: Upload },
  { id: "intelligence", label: "Review", icon: BrainCircuit },
  { id: "strategy", label: "Strategy", icon: SearchCheck },
  { id: "editor", label: "Editor", icon: PenLine },
  { id: "preview", label: "Preview", icon: MonitorUp },
  { id: "export", label: "Publish", icon: Download }
] as const;

type StudioView = (typeof workflow)[number]["id"];

function getClientWorkspaceId() {
  if (typeof window === "undefined") return "demo-workspace";
  const key = "auto-casestudy-workspace";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = `workspace_${crypto.randomUUID()}`;
  window.localStorage.setItem(key, created);
  return created;
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 1024 * 1024 ? 1 : 2)} MB`;
}

function fileExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function validateBrowserUpload(files: File[]) {
  if (files.length > MAX_UPLOAD_FILES) {
    return `Upload ${MAX_UPLOAD_FILES} files or fewer at a time.`;
  }

  const unsupported = files.filter((file) => !ACCEPTED_UPLOAD_EXTENSIONS.has(fileExtension(file.name)));
  if (unsupported.length) {
    return `Unsupported file type: ${unsupported.map((file) => file.name).join(", ")}. Use PDF, DOCX, PPTX, PNG, JPG, or WebP.`;
  }

  const oversized = files.find((file) => file.size > MAX_BROWSER_FILE_BYTES);
  if (oversized) {
    return `${oversized.name} is ${formatBytes(oversized.size)}. Upload files up to ${formatBytes(MAX_BROWSER_FILE_BYTES)} each for this Vercel MVP.`;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_BROWSER_BATCH_BYTES) {
    return `This upload is ${formatBytes(totalBytes)}. Upload up to ${formatBytes(MAX_BROWSER_BATCH_BYTES)} per batch for this Vercel MVP.`;
  }

  return "";
}

async function readUploadResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    error:
      response.status === 413 || text.toLowerCase().includes("request entity")
        ? `Upload is too large for the hosted MVP. Try one smaller file, up to ${formatBytes(MAX_BROWSER_FILE_BYTES)}.`
        : text || `Upload failed with status ${response.status}.`
  };
}

const cognitionModes = [
  {
    agent: "UX Research Agent",
    reads: "notes, surveys, testing docs, transcripts",
    sees: "methods, findings, evidence quality, missing validation",
    question: "What user evidence supports this decision?"
  },
  {
    agent: "UX Designer Agent",
    reads: "Figma, screenshots, flows, sketches",
    sees: "hierarchy, interaction patterns, accessibility, component reuse",
    question: "Does the visual system explain the process?"
  },
  {
    agent: "Recruiter Agent",
    reads: "resume, case study drafts, outcomes",
    sees: "role clarity, collaboration, impact, scanability",
    question: "Can a recruiter understand the value in 3 minutes?"
  },
  {
    agent: "HCI Academic Agent",
    reads: "papers, course work, study artifacts",
    sees: "rigor, limitations, citations, traceable claims",
    question: "Which claims need provenance before publishing?"
  }
];

const provenanceLinks = [
  ["Interview notes", "Research insight", "supported by"],
  ["Affinity map photo", "Synthesis theme", "clusters"],
  ["Figma prototype", "Design iteration", "visualizes"],
  ["Testing findings", "Outcome claim", "validates"],
  ["Resume", "Professional profile", "cross-checks"]
];

export function PortfolioStudio() {
  const {
    persona,
    audienceMode,
    theme,
    artifacts,
    sections,
    clusters,
    relationships,
    lastAgentAction,
    setPersona,
    setAudienceMode,
    setTheme,
    addUploadedArtifacts,
    syncStoredArtifacts,
    setEvidenceMap,
    updateClusterStatus,
    updateCluster,
    regenerate,
    reorderSections,
    toggleLock,
    updateSection,
    runPrompt,
    resetDemo
  } = usePortfolioStore();
  const gaps = useGaps();
  const [prompt, setPrompt] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [activeView, setActiveView] = useState<StudioView>("ingest");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const evidenceScore = useMemo(() => {
    const sourceSignals = Math.round(artifacts.reduce((sum, item) => sum + item.confidenceScore, 0) / artifacts.length);
    const supported = sections.filter((section) => section.evidenceIds.length > 0).length;
    return {
      sourceSignals,
      supported,
      coverage: Math.max(42, Math.min(96, sourceSignals - gaps.length * 7 + supported * 3))
    };
  }, [artifacts, sections, gaps.length]);
  const understandingBacklog = useMemo(
    () => buildUnderstandingBacklog({ artifacts, sections, gaps, clusters }),
    [artifacts, sections, gaps, clusters]
  );

  useEffect(() => {
    let cancelled = false;
    const workspaceId = getClientWorkspaceId();
    fetch("/api/artifacts", {
      headers: { "x-autocasestudy-workspace": workspaceId }
    })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && Array.isArray(payload.artifacts)) {
          syncStoredArtifacts(payload.artifacts as Artifact[]);
          if (payload.evidenceMap) setEvidenceMap(payload.evidenceMap);
        }
      })
      .catch(() => {
        // Stored artifact sync is non-blocking. Upload errors are shown during upload.
      });
    return () => {
      cancelled = true;
    };
  }, [setEvidenceMap, syncStoredArtifacts]);

  async function uploadFiles(files: File[]) {
    if (!files.length) return;

    const validationError = validateBrowserUpload(files);
    if (validationError) {
      setUploadError(validationError);
      setUploadSuccess("");
      return;
    }

    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    setIsUploading(true);
    setUploadError("");
    setUploadSuccess("");

    try {
      const response = await fetch("/api/artifacts", {
        method: "POST",
        headers: { "x-autocasestudy-workspace": getClientWorkspaceId() },
        body: form
      });
      const payload = await readUploadResponse(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }
      addUploadedArtifacts(payload.artifacts as Artifact[]);
      if (payload.evidenceMap) setEvidenceMap(payload.evidenceMap);
      setUploadSuccess(`${files.length} artifact${files.length === 1 ? "" : "s"} added to the portfolio workspace.`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await uploadFiles(files);
  }

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;
    runPrompt(prompt.trim());
    setPrompt("");
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((section) => section.id === active.id);
    const newIndex = sections.findIndex((section) => section.id === over.id);
    reorderSections(arrayMove(sections, oldIndex, newIndex).map((section) => section.id));
  }

  const activeWorkflowItem = workflow.find((item) => item.id === activeView) ?? workflow[0];

  const workspaceView = {
    ingest: (
      <ViewShell
        eyebrow="Inbox"
        title="Upload evidence"
        detail="Add project files. The studio will sort them next."
      >
        <IngestionPanel onFiles={onFiles} onDropFiles={uploadFiles} isUploading={isUploading} uploadError={uploadError} uploadSuccess={uploadSuccess} />
      </ViewShell>
    ),
    intelligence: (
      <ViewShell
        eyebrow="Review"
        title="Evidence found"
        detail="Confirm files, gaps, and project groups."
      >
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <AgentIntelligence artifacts={artifacts} gaps={gaps} lastAgentAction={lastAgentAction} />
            <UnderstandingBacklogPanel backlog={understandingBacklog} artifacts={artifacts} />
            <EvidenceMapPanel
              artifacts={artifacts}
              clusters={clusters}
              relationships={relationships}
              onClusterStatus={updateClusterStatus}
              onClusterChange={updateCluster}
            />
          </div>
          <ProvenancePanel />
        </div>
      </ViewShell>
    ),
    strategy: (
      <ViewShell
        eyebrow="Strategy"
        title="Portfolio structure"
        detail="Choose the audience and pages."
      >
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <PortfolioPageTree artifacts={artifacts} sections={sections} />
            <CognitionPanel />
          </div>
          <StrategyPanel
            persona={persona}
            theme={theme}
            onPersona={setPersona}
            onTheme={setTheme}
            audienceMode={audienceMode}
            onAudienceMode={setAudienceMode}
            evidenceScore={evidenceScore.coverage}
          />
        </div>
      </ViewShell>
    ),
    editor: (
      <ViewShell
        eyebrow="Editor"
        title="Edit portfolio pages"
        detail="Tune page briefs, then refine the case study canvas."
      >
        <EditorPanel
          sections={sections}
          artifacts={artifacts}
          persona={persona}
          prompt={prompt}
          sensors={sensors}
          onPrompt={setPrompt}
          onPromptSubmit={submitPrompt}
          onDragEnd={onDragEnd}
          onToggleLock={toggleLock}
          onUpdateSection={updateSection}
          onRegenerate={regenerate}
        />
      </ViewShell>
    ),
    preview: (
      <ViewShell
        eyebrow="Live preview"
        title="Portfolio preview"
        detail="Check the public-facing site."
      >
        <PortfolioPreview persona={persona} mode={audienceMode} theme={theme} sections={sections} artifacts={artifacts} />
      </ViewShell>
    ),
    export: (
      <ViewShell
        eyebrow="Publish"
        title="Publish package"
        detail="Fix gaps before export."
      >
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <ExportPanel evidenceCoverage={evidenceScore.coverage} gaps={gaps.length} />
          <ProvenancePanel />
        </div>
      </ViewShell>
    )
  } satisfies Record<StudioView, JSX.Element>;

  return (
    <main className="min-h-dvh overflow-x-hidden">
      <a href="#workspace" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-slateInk">
        Skip to workspace
      </a>
      <div className="grid min-h-dvh lg:grid-cols-[272px_1fr]">
        <Sidebar activeView={activeView} onView={setActiveView} />
        <section id="workspace" className="min-w-0 overflow-x-hidden">
          <TopBar persona={persona} activeLabel={activeWorkflowItem.label} onReset={resetDemo} />
          <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <MobileViewTabs activeView={activeView} onView={setActiveView} />
            {workspaceView[activeView]}
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({ activeView, onView }: { activeView: StudioView; onView: (view: StudioView) => void }) {
  return (
    <aside className="hidden border-r border-line bg-surface/90 px-5 py-6 lg:block">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
            <Bot className="h-5 w-5 text-primary" aria-hidden />
          </div>
          <div>
            <p className="text-base font-bold">Auto-CaseStudy</p>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Agentic studio</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2" aria-label="Studio views">
        {workflow.map((item) => (
          <button
            type="button"
            onClick={() => onView(item.id)}
            key={item.id}
            aria-current={activeView === item.id ? "page" : undefined}
            className={cn(
              "flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition",
              activeView === item.id ? "bg-panelHigh text-ink shadow-soft" : "text-muted hover:bg-panel hover:text-ink"
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function TopBar({
  persona,
  activeLabel,
  onReset
}: {
  persona: Persona;
  activeLabel: string;
  onReset: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">AI portfolio agent</p>
          <h1 className="text-xl font-semibold tracking-tight">{activeLabel}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-11 items-center rounded-md border border-line bg-panel px-3 text-sm text-muted">
            {persona}
          </span>
          <button
            onClick={onReset}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted transition hover:bg-panel hover:text-ink"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Reset demo
          </button>
        </div>
      </div>
    </header>
  );
}

function MobileViewTabs({ activeView, onView }: { activeView: StudioView; onView: (view: StudioView) => void }) {
  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto border-b border-line px-4 pb-3 lg:hidden" aria-label="Studio views">
      {workflow.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onView(item.id)}
          aria-current={activeView === item.id ? "page" : undefined}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm transition",
            activeView === item.id
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-line bg-panel text-muted hover:text-ink"
          )}
        >
          <item.icon className="h-4 w-4" aria-hidden />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function ViewShell({
  eyebrow,
  title,
  detail,
  children
}: {
  eyebrow: string;
  title: string;
  detail: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="px-1">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">{detail}</p>
      </div>
      {children}
    </section>
  );
}

type PortfolioPageKey = "home" | "about" | "projects" | "case-study-detail" | "resume" | "skills" | "contact";

type PortfolioPageModel = {
  id: PortfolioPageKey;
  title: string;
  purpose: string;
  status: "Ready" | "Draft" | "Needs evidence" | "Needs source";
  editorGoal: string;
  evidenceIds: string[];
  parent?: PortfolioPageKey;
  mustHave: string[];
  mediaPlan: string[];
};

type PortfolioPageElement = {
  id: string;
  label: string;
  detail: string;
  kind: "content" | "media" | "proof" | "interaction";
  required: boolean;
};

function getPortfolioPages(artifacts: Artifact[], sections: CaseStudySection[]): PortfolioPageModel[] {
  const resumeArtifact = artifacts.find((artifact) => artifact.classification?.classification === "resume/profile");
  const researchEvidence = artifacts.filter((artifact) => ["Research", "Synthesis", "Validation"].includes(artifact.phase)).slice(0, 3);
  const technicalEvidence = artifacts.filter((artifact) => artifact.phase === "Technical Implementation").slice(0, 2);
  const sectionEvidenceIds = Array.from(new Set(sections.flatMap((section) => section.evidenceIds)));

  return [
    {
      id: "home",
      title: "Home",
      purpose: "Positioning",
      status: "Ready",
      editorGoal: "Shape the first impression, role promise, and featured proof.",
      evidenceIds: artifacts.slice(0, 3).map((artifact) => artifact.id),
      mustHave: ["Name and role headline", "Short value proposition", "Featured project", "Primary CTA", "Proof snapshot"],
      mediaPlan: ["Portrait or personal brand visual", "Featured project screenshot", "Optional motion preview"]
    },
    {
      id: "about",
      title: "About",
      purpose: "Profile",
      status: "Draft",
      editorGoal: "Explain the professional identity behind the work.",
      evidenceIds: resumeArtifact ? [resumeArtifact.id, ...technicalEvidence.map((artifact) => artifact.id)] : technicalEvidence.map((artifact) => artifact.id),
      mustHave: ["Professional bio", "Design/research philosophy", "Working style", "Credibility proof", "Current goal"],
      mediaPlan: ["Profile photo", "Workspace/process photo", "Optional intro video"]
    },
    {
      id: "projects",
      title: "Projects",
      purpose: `${Math.max(1, sections.length - 2)} projects + case studies`,
      status: "Draft",
      editorGoal: "Build the project index, featured cards, filters, and routes into case-study detail pages.",
      evidenceIds: artifacts.slice(0, 6).map((artifact) => artifact.id),
      mustHave: ["Project cards", "Role and timeline", "Methods/tools", "Outcome or learning", "Open case study action"],
      mediaPlan: ["Project thumbnail", "Prototype screenshot", "Optional hover animation/video"]
    },
    {
      id: "case-study-detail",
      title: "Case Study Detail",
      purpose: "Inside Projects",
      status: sections.some((section) => section.evidenceIds.length === 0) ? "Needs evidence" : "Ready",
      editorGoal: "Edit the long-form project story that opens from a project card.",
      evidenceIds: sectionEvidenceIds,
      parent: "projects",
      mustHave: ["Hero summary", "Problem and context", "Role", "Process timeline", "Research evidence", "Design/media", "Outcome", "Reflection"],
      mediaPlan: ["Hero image", "Research photos", "Wireframes", "Prototype embed", "Before/after visuals", "Testing clips if available"]
    },
    {
      id: "resume",
      title: "Resume",
      purpose: "Experience",
      status: resumeArtifact ? "Ready" : "Needs source",
      editorGoal: "Turn resume evidence into a concise experience block.",
      evidenceIds: resumeArtifact ? [resumeArtifact.id] : [],
      mustHave: ["Experience timeline", "Role bullets", "Education", "Certifications", "Download resume CTA"],
      mediaPlan: ["Resume PDF preview", "Certification badges", "Company/course logos if allowed"]
    },
    {
      id: "skills",
      title: "Skills",
      purpose: "Tools",
      status: "Draft",
      editorGoal: "Group tools, methods, and technical credibility by role.",
      evidenceIds: [...researchEvidence, ...technicalEvidence].map((artifact) => artifact.id),
      mustHave: ["Research methods", "Design tools", "Technical tools", "Soft skills", "Evidence-backed skill groups"],
      mediaPlan: ["Tool badges", "Method cards", "Small evidence links"]
    },
    {
      id: "contact",
      title: "Contact",
      purpose: "Handoff",
      status: "Draft",
      editorGoal: "Prepare the recruiter or reviewer handoff.",
      evidenceIds: resumeArtifact ? [resumeArtifact.id] : [],
      mustHave: ["Email/contact action", "LinkedIn/GitHub links", "Resume download", "Availability note", "Professional closing"],
      mediaPlan: ["Simple profile visual", "Social preview card"]
    }
  ];
}

function PortfolioPageTree({ artifacts, sections }: { artifacts: Artifact[]; sections: CaseStudySection[] }) {
  const pages = getPortfolioPages(artifacts, sections);

  return (
    <section className="rounded-lg border border-line bg-surface p-5" aria-label="Portfolio site structure">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Site map</p>
          <h2 className="mt-2 text-2xl font-semibold">Portfolio pages</h2>
        </div>
        <span className="rounded-full border border-line bg-panel px-3 py-1 text-sm text-muted">
          {artifacts.length} source artifacts
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {pages.map((page) => (
          <article
            key={page.id}
            className="rounded-md border border-line bg-panel p-4 transition duration-200 hover:-translate-y-1 hover:border-primary/30 hover:bg-panelHigh"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold text-ink">{page.title}</h3>
              <PageStatus status={page.status} />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{page.purpose}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PageStatus({ status }: { status: PortfolioPageModel["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-[11px] font-semibold",
        status === "Ready"
          ? "bg-emerald/15 text-emerald"
          : status === "Needs evidence" || status === "Needs source"
            ? "bg-amber/15 text-amber"
            : "bg-primary/10 text-primary"
      )}
    >
      {status}
    </span>
  );
}

function makePageDraft(page: PortfolioPageModel, persona: Persona, artifacts: Artifact[], sections: CaseStudySection[]) {
  const sourceCount = page.evidenceIds.length;
  const projectCount = Math.max(1, sections.length - 2);
  const role = persona.toLowerCase();
  const copy: Record<PortfolioPageKey, string> = {
    home: `A ${role} portfolio that turns research, design decisions, and technical proof into clear project stories. Feature the strongest project, role promise, and ${sourceCount} linked evidence sources.`,
    about: `Introduce the person behind the work: how they think, what methods they use, and why their evidence supports the professional identity shown on the site.`,
    projects: `Show ${projectCount} project candidates as scannable cards. Each card should include the problem, role, method, output, thumbnail, and a link into a case-study detail page.`,
    "case-study-detail": sections[0]?.content ?? "Build a long-form project narrative from confirmed evidence.",
    resume: sourceCount
      ? "Translate resume evidence into concise experience bullets, tools, certifications, and role credibility."
      : "Resume source is missing. Ask the user to upload a resume, experience notes, certification, or LinkedIn export before publishing this page.",
    skills: `Group tools and methods by credibility: research methods, design tools, technical systems, collaboration, and delivery. Avoid unsupported skill claims.`,
    contact: "Create a simple handoff page with contact, resume download, portfolio links, and a short invitation for recruiters, professors, or collaborators."
  };

  if (!artifacts.length) return copy[page.id];
  return copy[page.id];
}

function getPageElements(page: PortfolioPageModel): PortfolioPageElement[] {
  const shared: PortfolioPageElement[] = [
    {
      id: "seo",
      label: "SEO and social preview",
      detail: "Title, description, share image, and page slug generated from the portfolio strategy.",
      kind: "proof",
      required: true
    },
    {
      id: "accessibility",
      label: "Accessibility pass",
      detail: "Alt text, heading order, keyboard-safe interactions, and contrast checks.",
      kind: "proof",
      required: true
    }
  ];

  const byPage: Record<PortfolioPageKey, PortfolioPageElement[]> = {
    home: [
      { id: "hero", label: "Hero identity", detail: "Name, role, value promise, location/status, and primary action.", kind: "content", required: true },
      { id: "hero-media", label: "Hero visual", detail: "Portrait, featured project screenshot, short loop, or generated brand visual.", kind: "media", required: true },
      { id: "featured-work", label: "Featured work", detail: "Two to three strongest projects with evidence-backed hooks.", kind: "interaction", required: true },
      { id: "credibility", label: "Proof strip", detail: "Methods, tools, certifications, research scope, or technical stack.", kind: "proof", required: false }
    ],
    about: [
      { id: "bio", label: "Professional bio", detail: "Short story of the person, background, direction, and point of view.", kind: "content", required: true },
      { id: "portrait", label: "Portrait/process media", detail: "Profile photo, workspace image, sketch/process photo, or intro clip.", kind: "media", required: true },
      { id: "philosophy", label: "Working philosophy", detail: "How the person thinks as a researcher, designer, builder, or hybrid.", kind: "content", required: true },
      { id: "credibility-links", label: "Credibility links", detail: "Resume, certifications, GitHub, publications, or artifacts that support claims.", kind: "proof", required: true }
    ],
    projects: [
      { id: "project-grid", label: "Project grid", detail: "Cards with title, role, timeline, methods, thumbnail, and open case study action.", kind: "interaction", required: true },
      { id: "filters", label: "Filters", detail: "Filter by research, design, technical, academic, or professional work.", kind: "interaction", required: false },
      { id: "project-media", label: "Project thumbnails", detail: "Screenshots, prototype stills, diagrams, or generated visuals when artifacts lack media.", kind: "media", required: true },
      { id: "case-routing", label: "Case study routing", detail: "Each serious project opens a detail page with full process evidence.", kind: "proof", required: true }
    ],
    "case-study-detail": [
      { id: "case-hero", label: "Case study hero", detail: "Project title, problem, role, timeline, team, tools, and hero image/video.", kind: "content", required: true },
      { id: "process-timeline", label: "Process timeline", detail: "Research, synthesis, ideation, design, testing, iteration, outcome.", kind: "interaction", required: true },
      { id: "evidence-media", label: "Evidence media", detail: "Photos, wireframes, Figma embeds, screenshots, diagrams, clips, and captions.", kind: "media", required: true },
      { id: "claim-trace", label: "Claim traceability", detail: "Every major claim links back to source artifacts or is marked as unsupported.", kind: "proof", required: true },
      { id: "reflection", label: "Reflection", detail: "What changed, what was learned, limitations, and next iteration.", kind: "content", required: true }
    ],
    resume: [
      { id: "experience", label: "Experience timeline", detail: "Roles, organizations, dates, bullets, and evidence-backed outcomes.", kind: "content", required: true },
      { id: "education", label: "Education and certifications", detail: "Degrees, courses, certificates, and connected proof artifacts.", kind: "proof", required: true },
      { id: "resume-media", label: "Resume packet", detail: "PDF preview, downloadable resume, and recruiter-friendly summary.", kind: "media", required: false }
    ],
    skills: [
      { id: "skill-groups", label: "Skill groups", detail: "Methods, tools, systems, collaboration, and domain strengths.", kind: "content", required: true },
      { id: "proofed-skills", label: "Evidence-backed skills", detail: "Skills connected to projects, artifacts, certifications, or work history.", kind: "proof", required: true },
      { id: "tool-visuals", label: "Tool visuals", detail: "Tool badges, method cards, and technical stack chips.", kind: "media", required: false }
    ],
    contact: [
      { id: "contact-actions", label: "Contact actions", detail: "Email, LinkedIn, GitHub, resume download, and optional booking link later.", kind: "interaction", required: true },
      { id: "handoff-copy", label: "Handoff copy", detail: "Short closing message tailored to recruiter, academic, or technical audiences.", kind: "content", required: true },
      { id: "share-card", label: "Share card", detail: "Clean social preview for the published portfolio link.", kind: "media", required: false }
    ]
  };

  return [...byPage[page.id], ...shared];
}

function CognitionPanel() {
  return (
    <section className="rounded-lg border border-line bg-surface p-5" aria-label="Professional cognition modes">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Role lenses</p>
          <h2 className="mt-2 text-2xl font-semibold">How the studio reviews work</h2>
        </div>
        <span className="inline-flex min-h-11 items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 text-sm font-semibold text-primary">
          <Network className="h-4 w-4" aria-hidden />
          Project memory
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {cognitionModes.map((mode) => (
          <article key={mode.agent} className="rounded-md border border-line bg-panel p-4">
            <h3 className="font-semibold text-ink">{mode.agent}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{mode.question}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function IngestionPanel({
  onFiles,
  onDropFiles,
  isUploading,
  uploadError,
  uploadSuccess
}: {
  onFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  onDropFiles: (files: File[]) => void;
  isUploading: boolean;
  uploadError: string;
  uploadSuccess: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  function onDrag(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploading) setIsDragging(true);
  }

  function onDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;
    onDropFiles(Array.from(event.dataTransfer.files));
  }

  return (
    <section id="ingest" className="animate-soft-in-delay rounded-lg border border-primary/25 bg-surface p-5 shadow-glow sm:p-7">
      <div>
          <label
            onDragEnter={onDrag}
            onDragOver={onDrag}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={cn(
              "mt-5 flex min-h-[250px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition duration-200",
              isUploading
                ? "border-muted bg-panel"
                : isDragging
                  ? "scale-[1.01] border-primary bg-primary/10 shadow-glow"
                  : "border-primary/45 bg-background hover:-translate-y-1 hover:border-primary hover:bg-panel"
            )}
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Upload className="h-6 w-6" aria-hidden />
            </span>
            <span className="mt-4 text-xl font-semibold text-ink">{isUploading ? "Uploading..." : "Drag files here or click to upload"}</span>
            <span className="mt-2 max-w-md text-sm leading-6 text-muted">PDF, DOCX, PPTX, PNG, JPG, or WebP. Up to {formatBytes(MAX_BROWSER_FILE_BYTES)} per file.</span>
            <span className="mt-5 inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-slateInk">
              Choose artifacts
            </span>
            <input
              className="sr-only"
              type="file"
              multiple
              accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp"
              onChange={onFiles}
              disabled={isUploading}
            />
          </label>
          <p className="mt-3 text-xs leading-5 text-faint">Parser status appears in Review. Upload large files one at a time or compress them first.</p>
      </div>
      {uploadError ? (
        <p className="mt-4 rounded-md border border-danger/25 bg-danger/10 p-3 text-sm text-danger" role="alert">
          {uploadError}
        </p>
      ) : null}
      {uploadSuccess ? (
        <p className="mt-4 rounded-md border border-emerald/25 bg-emerald/10 p-3 text-sm text-emerald" role="status">
          {uploadSuccess}
        </p>
      ) : null}
    </section>
  );
}

function AgentIntelligence({
  artifacts,
  gaps,
  lastAgentAction
}: {
  artifacts: Artifact[];
  gaps: ReturnType<typeof useGaps>;
  lastAgentAction: string;
}) {
  return (
    <section id="intelligence" className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <div className="rounded-lg border border-line bg-surface p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Files</p>
            <h2 className="mt-2 text-2xl font-semibold">Artifact tray</h2>
          </div>
          <BadgeCheck className="h-6 w-6 text-emerald" aria-label="Evidence checked" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {artifacts.map((artifact) => (
            <article key={artifact.id} className="rounded-md border border-line bg-panel p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-ink">{artifact.name}</h3>
                  <p className="mt-1 text-xs text-muted">{artifact.classification?.classification ?? artifact.kind}</p>
                </div>
                <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs", artifact.status === "Parsed" ? "border-emerald/30 bg-emerald/10 text-emerald" : artifact.status === "Failed" ? "border-danger/30 bg-danger/10 text-danger" : "border-line bg-background text-muted")}>
                  {artifact.status ?? "Demo"}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-line bg-background px-2 py-1 text-xs text-muted">{artifact.phase}</span>
                <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", artifact.confidence === "High" ? "bg-emerald/15 text-emerald" : artifact.confidence === "Medium" ? "bg-amber/15 text-amber" : "bg-danger/15 text-danger")}>
                  {artifact.confidence}
                </span>
                {artifact.classification?.projectName ? (
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary">
                    {artifact.classification.projectName}
                  </span>
                ) : null}
              </div>
              {artifact.extractedContent ? (
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted">{artifact.extractedContent.text}</p>
              ) : null}
              {artifact.parserError ? (
                <p className="mt-3 rounded-md border border-danger/25 bg-danger/10 p-2 text-xs text-danger">{artifact.parserError}</p>
              ) : null}
            </article>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-line bg-surface p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Status</p>
        <p className="mt-3 rounded-md border border-primary/20 bg-primary/10 p-3 text-sm leading-6 text-primary">{lastAgentAction}</p>
        <div className="mt-5 space-y-3">
          {gaps.slice(0, 4).map((gap) => (
            <div key={gap.id} className="rounded-md border border-line bg-panel p-3">
              <div className="flex items-start gap-2">
                <ShieldAlert className={cn("mt-0.5 h-4 w-4", gap.severity === "Critical" ? "text-danger" : gap.severity === "Important" ? "text-amber" : "text-emerald")} aria-hidden />
                <div>
                  <p className="text-sm font-semibold">{gap.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{gap.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UnderstandingBacklogPanel({
  backlog,
  artifacts
}: {
  backlog: UnderstandingBacklogItem[];
  artifacts: Artifact[];
}) {
  const artifactMap = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
  const criticalCount = backlog.filter((item) => item.priority === "Critical" || item.priority === "High").length;

  return (
    <section className="rounded-lg border border-line bg-surface p-5" aria-label="Understanding backlog">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Understanding backlog</p>
          <h2 className="mt-2 text-2xl font-semibold">What the agent needs before generation</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Structured intelligence tasks that connect evidence, portfolio planning, recruiter readability, and guardrails before writing pages.
          </p>
        </div>
        <span className="rounded-full border border-line bg-panel px-3 py-1 text-sm text-muted">
          {criticalCount} priority item{criticalCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {backlog.slice(0, 8).map((item) => (
          <article key={item.id} className="rounded-md border border-line bg-panel p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.16em] text-primary">{item.category}</p>
                <h3 className="mt-1 text-base font-semibold text-ink">{item.title}</h3>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  item.priority === "Critical"
                    ? "bg-danger/15 text-danger"
                    : item.priority === "High"
                      ? "bg-amber/15 text-amber"
                      : "bg-emerald/15 text-emerald"
                )}
              >
                {item.priority}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">{item.rationale}</p>
            <div className="mt-3 rounded-md border border-line bg-background p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-faint">Next action</p>
              <p className="mt-1 text-sm leading-6 text-ink">{item.suggestedAction}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-line bg-background px-2 py-1 text-xs text-muted">{item.status}</span>
              <span className="rounded-full border border-line bg-background px-2 py-1 text-xs text-muted">{item.outputTarget}</span>
              {item.sourceArtifactIds.slice(0, 3).map((artifactId) => {
                const artifact = artifactMap.get(artifactId);
                return artifact ? (
                  <span key={artifactId} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-xs text-primary">
                    {artifact.sourceLabel}
                  </span>
                ) : null;
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceMapPanel({
  artifacts,
  clusters,
  relationships,
  onClusterStatus,
  onClusterChange
}: {
  artifacts: Artifact[];
  clusters: ProjectCluster[];
  relationships: ArtifactRelationship[];
  onClusterStatus: (id: string, status: ProjectCluster["status"]) => void;
  onClusterChange: (cluster: ProjectCluster) => void;
}) {
  const [draftLabels, setDraftLabels] = useState<Record<string, string>>({});
  const [artifactSelections, setArtifactSelections] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const artifactById = new Map(artifacts.map((artifact) => [artifact.id, artifact]));

  async function saveCluster(cluster: ProjectCluster) {
    onClusterChange(cluster);
    const response = await fetch("/api/evidence-map", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-autocasestudy-workspace": getClientWorkspaceId() },
      body: JSON.stringify({ cluster })
    });
    if (!response.ok) {
      setSaveError("Evidence graph save failed. Refresh before trusting this cluster decision.");
      return;
    }
    setSaveError("");
  }

  async function setStatus(cluster: ProjectCluster, status: ProjectCluster["status"]) {
    const next = { ...cluster, status };
    onClusterStatus(cluster.id, status);
    await saveCluster(next);
  }

  async function renameCluster(cluster: ProjectCluster) {
    const label = (draftLabels[cluster.id] ?? cluster.label).trim();
    await saveCluster({
      ...cluster,
      label: label || cluster.label,
      status: cluster.status === "Confirmed" ? "Needs Review" : cluster.status
    });
  }

  async function removeArtifact(cluster: ProjectCluster, artifactId: string) {
    await saveCluster({
      ...cluster,
      artifactIds: cluster.artifactIds.filter((id) => id !== artifactId),
      status: "Needs Review"
    });
  }

  async function addArtifact(cluster: ProjectCluster) {
    const artifactId = artifactSelections[cluster.id];
    if (!artifactId || cluster.artifactIds.includes(artifactId)) return;
    await saveCluster({
      ...cluster,
      artifactIds: [...cluster.artifactIds, artifactId],
      status: "Needs Review"
    });
    setArtifactSelections((current) => ({ ...current, [cluster.id]: "" }));
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-5" aria-label="Evidence map review">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Projects</p>
          <h2 className="mt-2 text-2xl font-semibold">Confirm groups</h2>
        </div>
        <span className="rounded-full border border-line bg-panel px-3 py-1 text-sm text-muted">
          {relationships.length} relationship edge{relationships.length === 1 ? "" : "s"}
        </span>
      </div>
      {saveError ? (
        <p className="mb-4 rounded-md border border-danger/25 bg-danger/10 p-3 text-sm text-danger" role="alert">
          {saveError}
        </p>
      ) : null}

      {clusters.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {clusters.slice(0, 6).map((cluster) => (
            <article key={cluster.id} className="rounded-lg border border-line bg-panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <label htmlFor={`cluster-name-${cluster.id}`} className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    Cluster name
                  </label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      id={`cluster-name-${cluster.id}`}
                      value={draftLabels[cluster.id] ?? cluster.label}
                      onChange={(event) =>
                        setDraftLabels((current) => ({ ...current, [cluster.id]: event.target.value }))
                      }
                      className="min-h-11 min-w-0 flex-1 rounded-md border border-line bg-background px-3 text-sm font-semibold text-ink"
                    />
                    <button
                      onClick={() => renameCluster(cluster)}
                      className="min-h-11 rounded-md border border-line px-3 text-sm font-semibold text-ink transition hover:bg-panelHigh"
                    >
                      Rename
                    </button>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">
                    Grouping signal: {cluster.confidenceScore}% - {cluster.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setStatus(cluster, "Confirmed")}
                    className="min-h-11 rounded-md border border-emerald/30 bg-emerald/10 px-3 text-sm text-emerald transition hover:bg-emerald/20"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setStatus(cluster, "Needs Review")}
                    className="min-h-11 rounded-md border border-primary/30 bg-primary/10 px-3 text-sm text-primary transition hover:bg-primary/20"
                  >
                    Review
                  </button>
                  <button
                    onClick={() => setStatus(cluster, "Rejected")}
                    className="min-h-11 rounded-md border border-danger/30 bg-danger/10 px-3 text-sm text-danger transition hover:bg-danger/20"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {cluster.artifactIds.map((id) => {
                  const artifact = artifactById.get(id);
                  if (!artifact) return null;
                  return (
                    <div key={id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-background p-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-medium text-ink">{artifact.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          {artifact.classification?.classification ?? "unclassified"}
                        </p>
                      </div>
                      <button
                        onClick={() => removeArtifact(cluster, id)}
                        className="min-h-11 rounded-md border border-line px-3 text-xs font-semibold text-muted transition hover:bg-panelHigh hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col gap-2 rounded-md border border-line bg-background p-3 sm:flex-row">
                <label className="sr-only" htmlFor={`add-artifact-${cluster.id}`}>Add artifact to cluster</label>
                <select
                  id={`add-artifact-${cluster.id}`}
                  value={artifactSelections[cluster.id] ?? ""}
                  onChange={(event) =>
                    setArtifactSelections((current) => ({ ...current, [cluster.id]: event.target.value }))
                  }
                  className="min-h-11 min-w-0 flex-1 rounded-md border border-line bg-panel px-3 text-sm text-ink"
                >
                  <option value="">Add an artifact manually</option>
                  {artifacts
                    .filter((artifact) => !cluster.artifactIds.includes(artifact.id))
                    .map((artifact) => (
                      <option key={artifact.id} value={artifact.id}>
                        {artifact.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => addArtifact(cluster)}
                  className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-slateInk transition hover:bg-primary/90"
                >
                  Add
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {cluster.reasons.slice(0, 3).map((reason) => (
                  <p key={reason} className="rounded-md border border-primary/20 bg-primary/10 p-2 text-xs leading-5 text-primary">
                    {reason}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-line bg-panel p-4 text-sm leading-6 text-muted">
          Upload files to create project candidates.
        </div>
      )}
    </section>
  );
}

function EditorPanel({
  sections,
  artifacts,
  persona,
  prompt,
  sensors,
  onPrompt,
  onPromptSubmit,
  onDragEnd,
  onToggleLock,
  onUpdateSection,
  onRegenerate
}: {
  sections: CaseStudySection[];
  artifacts: Artifact[];
  persona: Persona;
  prompt: string;
  sensors: ReturnType<typeof useSensors>;
  onPrompt: (value: string) => void;
  onPromptSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleLock: (id: string) => void;
  onUpdateSection: (id: string, content: string) => void;
  onRegenerate: () => void;
}) {
  const pages = useMemo(() => getPortfolioPages(artifacts, sections), [artifacts, sections]);
  const [selectedPageId, setSelectedPageId] = useState<PortfolioPageKey>("case-study-detail");
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id ?? "");
  const [pageDrafts, setPageDrafts] = useState<Record<string, string>>({});
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? pages[0];
  const selectedSection = sections.find((section) => section.id === selectedSectionId) ?? sections[0];
  const pageDraft = selectedPage ? pageDrafts[selectedPage.id] ?? makePageDraft(selectedPage, persona, artifacts, sections) : "";

  useEffect(() => {
    if (!sections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(sections[0]?.id ?? "");
    }
  }, [sections, selectedSectionId]);

  return (
    <section id="editor" className="space-y-4">
      <form onSubmit={onPromptSubmit} className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3 sm:flex-row">
        <label className="sr-only" htmlFor="ai-command">AI edit command</label>
        <input
          id="ai-command"
          value={prompt}
          onChange={(event) => onPrompt(event.target.value)}
          placeholder="Ask for recruiter, academic, or technical tone"
          className="min-h-11 flex-1 rounded-md border border-line bg-background px-3 text-sm text-ink placeholder:text-faint"
        />
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-slateInk transition hover:bg-primary/90">
          Apply prompt <Sparkles className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <div className="grid gap-4 xl:grid-cols-[240px_1fr_300px]">
        <aside className="space-y-4 rounded-lg border border-line bg-surface p-4" aria-label="Portfolio editor navigation">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Pages</p>
            <div className="mt-3 space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => setSelectedPageId(page.id)}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-md border px-3 text-left text-sm transition",
                    selectedPage?.id === page.id ? "border-primary/40 bg-primary/10 text-ink" : "border-line bg-panel text-muted hover:text-ink"
                  )}
                >
                  <span className="truncate">{page.title}</span>
                  <PageStatus status={page.status} />
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-primary">Project case sections</p>
              <span className="rounded-full border border-line bg-panel px-2 py-1 text-[11px] text-muted">{sections.length}</span>
            </div>
            <div className="space-y-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => {
                    setSelectedPageId("case-study-detail");
                    setSelectedSectionId(section.id);
                  }}
                  className={cn(
                    "flex min-h-11 w-full items-center justify-between gap-3 rounded-md border px-3 text-left text-sm transition",
                    selectedPageId === "case-study-detail" && selectedSection?.id === section.id ? "border-primary/40 bg-primary/10 text-ink" : "border-line bg-panel text-muted hover:text-ink"
                  )}
                >
                  <span className="truncate">{index + 1}. {section.title}</span>
                  {section.locked ? <Lock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden /> : null}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {selectedPageId === "case-study-detail" ? (
          <div className="rounded-lg border border-line bg-surface p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Case study canvas</p>
                <h3 className="mt-1 text-xl font-semibold">Portfolio story draft</h3>
              </div>
            <button onClick={onRegenerate} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-line px-2 text-xs font-semibold text-muted transition hover:bg-panelHigh hover:text-ink">
              <WandSparkles className="h-3.5 w-3.5" aria-hidden />
              Regenerate
            </button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {sections.map((section) => (
                    <SortableSection
                      key={section.id}
                      section={section}
                      artifacts={artifacts}
                      active={selectedSection?.id === section.id}
                      onSelect={() => setSelectedSectionId(section.id)}
                      onToggleLock={onToggleLock}
                      onUpdateSection={onUpdateSection}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        ) : (
          <PageEditorCanvas
            page={selectedPage}
            persona={persona}
            artifacts={artifacts}
            draft={pageDraft}
            onDraft={(value) => setPageDrafts((current) => ({ ...current, [selectedPage.id]: value }))}
          />
        )}

        <PortfolioEvidenceInspector
          page={selectedPage}
          section={selectedPageId === "case-study-detail" ? selectedSection : undefined}
          artifacts={artifacts}
        />
      </div>
    </section>
  );
}

function PageEditorCanvas({
  page,
  persona,
  artifacts,
  draft,
  onDraft
}: {
  page: PortfolioPageModel;
  persona: Persona;
  artifacts: Artifact[];
  draft: string;
  onDraft: (value: string) => void;
}) {
  const evidence = artifacts.filter((artifact) => page.evidenceIds.includes(artifact.id));
  const templateElements = getPageElements(page);
  const requiredCount = templateElements.filter((element) => element.required).length;
  const mediaElements = templateElements.filter((element) => element.kind === "media");

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Page canvas</p>
          <h3 className="mt-1 text-xl font-semibold">{page.title} page</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{page.editorGoal}</p>
          {page.parent ? (
            <p className="mt-2 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              Nested under {page.parent === "projects" ? "Projects" : page.parent}
            </p>
          ) : null}
        </div>
        <PageStatus status={page.status} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          ["Audience", persona],
          ["Page role", page.purpose],
          ["Sources", `${evidence.length} linked`],
          ["Required blocks", `${requiredCount} required`]
        ].map(([label, value]) => (
          <div key={label} className="rounded-md border border-line bg-panel p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
            <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-md border border-line bg-panel p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-primary">Template structure</p>
            <h4 className="mt-1 font-semibold text-ink">What this page must contain</h4>
          </div>
          <span className="rounded-full border border-line bg-background px-2.5 py-1 text-xs text-muted">
            Agent-fill targets
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {templateElements.map((element) => (
            <article key={element.id} className="rounded-md border border-line bg-background/70 p-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex min-h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-surface text-primary">
                  <PageElementIcon kind={element.kind} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-sm font-semibold text-ink">{element.label}</h5>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", element.required ? "bg-emerald/15 text-emerald" : "bg-primary/10 text-primary")}>
                      {element.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{element.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-md border border-line bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">Media slots</p>
          <h4 className="mt-1 font-semibold text-ink">Photos, video, embeds, and motion</h4>
          <div className="mt-4 space-y-2">
            {page.mediaPlan.map((slot) => (
              <div key={slot} className="flex items-start gap-3 rounded-md border border-line bg-background/70 p-3">
                <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-ink">{slot}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">Agent can attach uploaded media, suggest generated visuals, or request missing assets.</p>
                </div>
              </div>
            ))}
            {!mediaElements.length ? (
              <p className="rounded-md border border-line bg-background/70 p-3 text-sm text-muted">No dedicated media slot for this page yet.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-md border border-line bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">Agent recommendations</p>
          <h4 className="mt-1 font-semibold text-ink">What the agent should do</h4>
          <div className="mt-4 space-y-2">
            {page.mustHave.slice(0, 5).map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-md border border-line bg-background/70 p-3 text-sm text-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <label className="mt-4 block text-xs uppercase tracking-[0.16em] text-primary" htmlFor={`${page.id}-draft`}>
        Editable page draft
      </label>
      <textarea
        id={`${page.id}-draft`}
        value={draft}
        onChange={(event) => onDraft(event.target.value)}
        className="mt-2 min-h-[220px] w-full resize-y rounded-md border border-line bg-background/80 p-4 text-sm leading-7 text-ink"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-muted transition hover:bg-panelHigh hover:text-ink">
          <Layers3 className="h-4 w-4" aria-hidden />
          Add section block
        </button>
        <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-muted transition hover:bg-panelHigh hover:text-ink">
          <Link className="h-4 w-4" aria-hidden />
          Attach evidence
        </button>
      </div>
    </div>
  );
}

function PageElementIcon({ kind }: { kind: PortfolioPageElement["kind"] }) {
  if (kind === "media") return <ImageIcon className="h-4 w-4" aria-hidden />;
  if (kind === "proof") return <BadgeCheck className="h-4 w-4" aria-hidden />;
  if (kind === "interaction") return <MonitorUp className="h-4 w-4" aria-hidden />;
  return <FileText className="h-4 w-4" aria-hidden />;
}

function SortableSection({
  section,
  artifacts,
  active,
  onSelect,
  onToggleLock,
  onUpdateSection
}: {
  section: CaseStudySection;
  artifacts: Artifact[];
  active: boolean;
  onSelect: () => void;
  onToggleLock: (id: string) => void;
  onUpdateSection: (id: string, content: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const evidence = artifacts.filter((artifact) => section.evidenceIds.includes(artifact.id));

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={cn(
        "rounded-lg border bg-panel p-4 transition",
        active ? "border-primary/50 shadow-glow" : "border-line",
        isDragging && "border-primary shadow-glow"
      )}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex min-h-11 w-11 items-center justify-center rounded-md border border-line text-muted transition hover:bg-panelHigh hover:text-ink"
            aria-label={`Drag ${section.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
          <div>
            <h3 className="font-semibold">{section.title}</h3>
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{section.type}</p>
          </div>
        </div>
        <button
          onClick={() => onToggleLock(section.id)}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-3 text-sm text-muted transition hover:bg-panelHigh hover:text-ink"
        >
          {section.locked ? <Lock className="h-4 w-4" aria-hidden /> : <LockOpen className="h-4 w-4" aria-hidden />}
          {section.locked ? "Locked" : "Editable"}
        </button>
      </div>
      <label className="sr-only" htmlFor={`${section.id}-content`}>{section.title} content</label>
      <textarea
        id={`${section.id}-content`}
        value={section.content}
        onChange={(event) => onUpdateSection(section.id, event.target.value)}
        disabled={section.locked}
        className={cn(
          "min-h-[108px] w-full resize-y rounded-md border border-line bg-background/80 p-4 text-sm leading-7 text-ink",
          section.locked && "cursor-not-allowed opacity-70"
        )}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {evidence.length ? (
          evidence.map((artifact) => (
            <span key={artifact.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted">
              <Link className="h-3 w-3 text-primary" aria-hidden />
              {artifact.sourceLabel}
            </span>
          ))
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-danger/25 bg-danger/10 px-2.5 py-1 text-xs text-danger">
            <ShieldAlert className="h-3 w-3" aria-hidden />
            No evidence found for this claim
          </span>
        )}
      </div>
    </article>
  );
}

function PortfolioEvidenceInspector({
  page,
  section,
  artifacts
}: {
  page?: PortfolioPageModel;
  section?: CaseStudySection;
  artifacts: Artifact[];
}) {
  const evidenceIds = section?.evidenceIds ?? page?.evidenceIds ?? [];
  const evidence = artifacts.filter((artifact) => evidenceIds.includes(artifact.id));
  const title = section?.title ?? page?.title ?? "Select a page";

  return (
    <aside className="rounded-lg border border-line bg-surface p-4" aria-label="Evidence inspector">
      <p className="text-xs uppercase tracking-[0.18em] text-primary">Evidence</p>
      <h3 className="mt-1 text-lg font-semibold">{title}</h3>
      {evidence.length ? (
        <div className="mt-4 space-y-3">
          {evidence.map((artifact) => (
            <article key={artifact.id} className="rounded-md border border-line bg-panel p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{artifact.sourceLabel}</p>
                  <p className="mt-1 text-xs text-muted">{artifact.classification?.classification ?? artifact.kind}</p>
                </div>
                <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", artifact.confidence === "High" ? "bg-emerald/15 text-emerald" : artifact.confidence === "Medium" ? "bg-amber/15 text-amber" : "bg-danger/15 text-danger")}>
                  {artifact.confidence}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {artifact.extractedSignals.slice(0, 3).map((signal) => (
                  <span key={signal} className="rounded-full border border-line bg-background px-2 py-1 text-xs text-muted">
                    {signal}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-danger/25 bg-danger/10 p-3 text-sm text-danger">
          No evidence linked.
        </div>
      )}
    </aside>
  );
}

function StrategyPanel({
  persona,
  theme,
  audienceMode,
  evidenceScore,
  onPersona,
  onTheme,
  onAudienceMode
}: {
  persona: Persona;
  theme: PortfolioTheme;
  audienceMode: string;
  evidenceScore: number;
  onPersona: (persona: Persona) => void;
  onTheme: (theme: PortfolioTheme) => void;
  onAudienceMode: (mode: "Portfolio" | "Research" | "Technical") => void;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-primary">Portfolio settings</p>
      <h2 className="mt-2 text-xl font-semibold">Shape the output</h2>
      <div className="mt-4 space-y-4">
        <Field label="Persona">
          <select value={persona} onChange={(event) => onPersona(event.target.value as Persona)} className="min-h-11 w-full rounded-md border border-line bg-panel px-3 text-sm">
            {personas.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
        <Field label="Audience mode">
          <div className="grid grid-cols-3 gap-2">
            {(["Portfolio", "Research", "Technical"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onAudienceMode(mode)}
                className={cn("min-h-11 rounded-md border border-line px-2 text-sm transition", audienceMode === mode ? "bg-primary text-slateInk" : "bg-panel text-muted hover:text-ink")}
              >
                {mode}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Portfolio theme">
          <select value={theme} onChange={(event) => onTheme(event.target.value as PortfolioTheme)} className="min-h-11 w-full rounded-md border border-line bg-panel px-3 text-sm">
            {themes.map((item) => <option key={item}>{item}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-5 rounded-md border border-line bg-panel p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted">Evidence coverage</span>
          <span className="font-bold text-primary">{evidenceScore}%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-background">
          <div className="h-full rounded-full bg-emerald" style={{ width: `${evidenceScore}%` }} />
        </div>
      </div>
    </section>
  );
}

function ProvenancePanel() {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-primary">Trust</p>
      <h2 className="mt-2 text-xl font-semibold">Source links</h2>
      <div className="mt-4 space-y-3">
        {provenanceLinks.map(([source, target, relation]) => (
          <div key={`${source}-${target}`} className="rounded-md border border-line bg-panel p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="rounded bg-primary/10 px-2 py-1 text-primary">{source}</span>
              <ArrowRight className="h-4 w-4 text-muted" aria-hidden />
              <span className="rounded bg-surface px-2 py-1 text-muted">{target}</span>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-faint">{relation}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
      {children}
    </label>
  );
}

function PortfolioPreview({
  persona,
  mode,
  theme,
  sections,
  artifacts
}: {
  persona: Persona;
  mode: string;
  theme: PortfolioTheme;
  sections: CaseStudySection[];
  artifacts: Artifact[];
}) {
  const light = theme !== "Instrument Dark";
  const pages = getPortfolioPages(artifacts, sections);
  const featuredArtifacts = artifacts.slice(0, 3);
  const projectPage = pages.find((page) => page.id === "projects") ?? pages[0];
  const casePage = pages.find((page) => page.id === "case-study-detail") ?? pages[0];
  const resumePage = pages.find((page) => page.id === "resume") ?? pages[0];
  const skillsPage = pages.find((page) => page.id === "skills") ?? pages[0];
  const contactPage = pages.find((page) => page.id === "contact") ?? pages[0];
  const previewTone =
    mode === "Research"
      ? "A methods-forward portfolio with evidence, limitations, and source traceability."
      : mode === "Technical"
        ? "A hybrid portfolio translating implementation depth into product credibility."
        : "A recruiter-readable portfolio focused on role clarity, decisions, visuals, and impact.";

  return (
    <section id="preview" className={cn("rounded-lg border p-5", light ? "border-slate-200 bg-paper text-slateInk" : "border-line bg-surface text-ink")}>
      <div className={cn("rounded-md border p-4", light ? "border-slate-200 bg-white" : "border-line bg-panel")}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 pb-4">
          <div>
            <p className={cn("text-xs uppercase tracking-[0.18em]", light ? "text-slate-500" : "text-primary")}>Published portfolio site</p>
            <h2 className="mt-1 text-2xl font-semibold">{persona}</h2>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs" aria-label="Preview site navigation">
            {pages.filter((page) => !page.parent).map((page) => (
              <span key={page.id} className={cn("rounded-full border px-2.5 py-1", light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-line bg-surface text-muted")}>
                {page.title}
              </span>
            ))}
          </nav>
        </div>

        <div className="grid gap-5 py-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", light ? "bg-slate-900 text-white" : "bg-primary text-slateInk")}>{mode}</span>
            <h3 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight">
              Evidence-backed portfolio for a {persona.toLowerCase()}.
            </h3>
            <p className={cn("mt-3 max-w-2xl text-sm leading-6", light ? "text-slate-600" : "text-muted")}>{previewTone}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={cn("rounded-md border px-3 py-2 text-xs font-semibold", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
                {artifacts.length} artifacts linked
              </span>
              <span className={cn("rounded-md border px-3 py-2 text-xs font-semibold", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
                {sections.length} case sections
              </span>
              <span className={cn("rounded-md border px-3 py-2 text-xs font-semibold", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
                {pages.length} site pages
              </span>
            </div>
          </div>

          <div className={cn("rounded-md border p-4", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
            <p className={cn("text-xs uppercase tracking-[0.16em]", light ? "text-slate-500" : "text-primary")}>Hero media slot</p>
            <div className={cn("mt-3 aspect-[16/10] rounded-md border border-dashed p-4", light ? "border-slate-300 bg-white" : "border-primary/30 bg-surface")}>
              <div className="flex h-full flex-col justify-between">
                <ImageIcon className={cn("h-8 w-8", light ? "text-slate-400" : "text-primary")} aria-hidden />
                <div>
                  <p className="text-sm font-semibold">Agent-selected hero visual</p>
                  <p className={cn("mt-1 text-xs leading-5", light ? "text-slate-500" : "text-muted")}>
                    Uploaded screenshot, portrait, prototype still, generated visual, or short motion preview.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <section className={cn("rounded-md border p-4", light ? "border-slate-200 bg-white" : "border-line bg-panel")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={cn("text-xs uppercase tracking-[0.16em]", light ? "text-slate-500" : "text-primary")}>Projects page</p>
              <h3 className="mt-1 text-xl font-semibold">Project index and case-study routes</h3>
            </div>
            <PageStatus status={projectPage.status} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {featuredArtifacts.map((artifact, index) => (
              <article key={artifact.id} className={cn("rounded-md border p-3", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
                <div className={cn("mb-3 flex aspect-video items-center justify-center rounded border border-dashed", light ? "border-slate-300 bg-white" : "border-primary/25 bg-surface")}>
                  <ImageIcon className={cn("h-5 w-5", light ? "text-slate-400" : "text-primary")} aria-hidden />
                </div>
                <p className="truncate text-sm font-semibold">Project {index + 1}</p>
                <p className={cn("mt-1 text-xs", light ? "text-slate-500" : "text-muted")}>{artifact.phase}</p>
                <p className="mt-3 text-xs font-semibold text-primary">Open case study</p>
              </article>
            ))}
          </div>
        </section>

        <section className={cn("rounded-md border p-4", light ? "border-slate-200 bg-white" : "border-line bg-panel")}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={cn("text-xs uppercase tracking-[0.16em]", light ? "text-slate-500" : "text-primary")}>Nested under Projects</p>
              <h3 className="mt-1 text-xl font-semibold">{casePage.title}</h3>
            </div>
            <PageStatus status={casePage.status} />
          </div>
          <div className="mt-4 space-y-3">
            {sections.slice(0, 3).map((section) => (
              <article key={section.id} className={cn("rounded-md border p-3", light ? "border-slate-200 bg-slate-50" : "border-line bg-background")}>
                <h4 className="text-sm font-semibold">{section.title}</h4>
                <p className={cn("mt-1 line-clamp-2 text-xs leading-5", light ? "text-slate-600" : "text-muted")}>{section.content}</p>
                <p className={cn("mt-2 text-xs", section.evidenceIds.length ? "text-emerald" : "text-danger")}>
                  {section.evidenceIds.length ? `${section.evidenceIds.length} evidence source${section.evidenceIds.length === 1 ? "" : "s"}` : "No evidence found"}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          [resumePage, "Experience, education, certifications, and resume download."],
          [skillsPage, "Evidence-backed methods, tools, and technical credibility."],
          [contactPage, "Contact actions, professional handoff, and share preview."]
        ].map(([page, detail]) => (
          <article key={(page as PortfolioPageModel).id} className={cn("rounded-md border p-4", light ? "border-slate-200 bg-white" : "border-line bg-panel")}>
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-semibold">{(page as PortfolioPageModel).title}</h3>
              <PageStatus status={(page as PortfolioPageModel).status} />
            </div>
            <p className={cn("mt-3 text-sm leading-6", light ? "text-slate-600" : "text-muted")}>{detail as string}</p>
          </article>
        ))}
      </div>

      <div className={cn("mt-5 rounded-md border p-3 text-xs", light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-line bg-background text-muted")}>
        <p>{artifacts.length} source artifacts linked across the portfolio site. Preview reflects the page model from Strategy and Editor.</p>
      </div>
    </section>
  );
}

function ExportPanel({ evidenceCoverage, gaps }: { evidenceCoverage: number; gaps: number }) {
  const ready = evidenceCoverage >= 80 && gaps <= 2;
  return (
    <section id="export" className="rounded-lg border border-line bg-surface p-5">
      <div className="mt-4 space-y-3">
        {[
          ["Static web export", "Generate deployable portfolio pages", MonitorUp],
          ["PDF portfolio packet", "Recruiter and academic share format", FileText],
          ["Markdown handoff", "Portable content for GitHub, Notion, Webflow", ClipboardList],
          ["Accessibility queue", "Alt text, contrast, semantic review", Accessibility]
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
      <button className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-slateInk transition hover:bg-primary/90">
        {ready ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <BriefcaseBusiness className="h-4 w-4" aria-hidden />}
        {ready ? "Package portfolio" : "Fix gaps"}
      </button>
    </section>
  );
}

