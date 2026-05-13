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
  Image,
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
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Artifact, ArtifactRelationship, CaseStudySection, Persona, PortfolioTheme, ProjectCluster } from "@/lib/types";
import { useGaps, usePortfolioStore } from "@/store/use-portfolio-store";

const personas: Persona[] = [
  "Technical UX Hybrid",
  "UX Researcher",
  "Product Designer",
  "HCI Master’s Student",
  "Cloud/IT Hybrid",
  "Product Manager",
  "Software Project Builder"
];

const themes: PortfolioTheme[] = ["Instrument Dark", "Editorial Light", "Recruiter Clean"];

const workflow = [
  { id: "ingest", label: "Ingest", icon: Upload },
  { id: "intelligence", label: "Agent analysis", icon: BrainCircuit },
  { id: "strategy", label: "Strategy", icon: SearchCheck },
  { id: "editor", label: "Editor", icon: PenLine },
  { id: "preview", label: "Preview", icon: MonitorUp },
  { id: "export", label: "Publish", icon: Download }
];

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
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const score = useMemo(() => {
    const confidence = Math.round(artifacts.reduce((sum, item) => sum + item.confidenceScore, 0) / artifacts.length);
    const supported = sections.filter((section) => section.evidenceIds.length > 0).length;
    return {
      confidence,
      supported,
      readiness: Math.max(42, Math.min(96, confidence - gaps.length * 7 + supported * 3))
    };
  }, [artifacts, sections, gaps.length]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/artifacts")
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

  async function onFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!files.length) return;

    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    setIsUploading(true);
    setUploadError("");

    try {
      const response = await fetch("/api/artifacts", {
        method: "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }
      addUploadedArtifacts(payload.artifacts as Artifact[]);
      if (payload.evidenceMap) setEvidenceMap(payload.evidenceMap);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
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

  return (
    <main className="min-h-dvh overflow-x-hidden">
      <a href="#workspace" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-slateInk">
        Skip to workspace
      </a>
      <div className="grid min-h-dvh lg:grid-cols-[272px_1fr]">
        <Sidebar score={score.readiness} />
        <section id="workspace" className="min-w-0 overflow-x-hidden">
          <TopBar persona={persona} onPersona={setPersona} onReset={resetDemo} />
          <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
            <Hero score={score} artifacts={artifacts} />

            <section className="grid gap-5 xl:grid-cols-[1fr_380px]" aria-label="Founder demo workflow">
              <div className="space-y-5">
                <WorkflowRail />
                <CognitionPanel />
                <IngestionPanel onFiles={onFiles} isUploading={isUploading} uploadError={uploadError} />
                <AgentIntelligence artifacts={artifacts} gaps={gaps} lastAgentAction={lastAgentAction} />
                <EvidenceMapPanel
                  artifacts={artifacts}
                  clusters={clusters}
                  relationships={relationships}
                  onClusterStatus={updateClusterStatus}
                  onClusterChange={updateCluster}
                />
                <EditorPanel
                  sections={sections}
                  artifacts={artifacts}
                  prompt={prompt}
                  sensors={sensors}
                  onPrompt={setPrompt}
                  onPromptSubmit={submitPrompt}
                  onDragEnd={onDragEnd}
                  onToggleLock={toggleLock}
                  onUpdateSection={updateSection}
                  onRegenerate={regenerate}
                />
              </div>

              <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start" aria-label="Portfolio strategy and preview">
                <StrategyPanel
                  persona={persona}
                  theme={theme}
                  onPersona={setPersona}
                  onTheme={setTheme}
                  audienceMode={audienceMode}
                  onAudienceMode={setAudienceMode}
                  score={score.readiness}
                />
                <ProvenancePanel />
                <PortfolioPreview
                  persona={persona}
                  mode={audienceMode}
                  theme={theme}
                  sections={sections}
                  artifacts={artifacts}
                />
                <ExportPanel readiness={score.readiness} gaps={gaps.length} />
              </aside>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({ score }: { score: number }) {
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

      <nav className="space-y-2" aria-label="Workflow">
        {workflow.map((item) => (
          <a
            href={`#${item.id}`}
            key={item.id}
            className="flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-sm text-muted transition hover:bg-panel hover:text-ink"
          >
            <item.icon className="h-4 w-4" aria-hidden />
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-8 rounded-lg border border-line bg-panel p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Publish readiness</p>
        <p className="mt-3 text-3xl font-bold text-primary">{score}%</p>
        <div className="mt-3 h-2 rounded-full bg-panelHigh">
          <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">Evidence, persona fit, section coverage, and export hygiene.</p>
      </div>
    </aside>
  );
}

function TopBar({
  persona,
  onPersona,
  onReset
}: {
  persona: Persona;
  onPersona: (persona: Persona) => void;
  onReset: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-primary">AI portfolio agent</p>
          <h1 className="text-xl font-semibold tracking-tight">Evidence-backed portfolio generation workspace</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="persona-select">Persona</label>
          <select
            id="persona-select"
            value={persona}
            onChange={(event) => onPersona(event.target.value as Persona)}
            className="min-h-11 rounded-md border border-line bg-panel px-3 text-sm text-ink"
          >
            {personas.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
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

function Hero({
  score,
  artifacts
}: {
  score: { confidence: number; supported: number; readiness: number };
  artifacts: Artifact[];
}) {
  return (
    <section className="grid gap-5 rounded-lg border border-line bg-panel/70 p-5 shadow-soft xl:grid-cols-[1.35fr_.65fr]">
      <div className="flex flex-col justify-between gap-8">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Bring messy artifacts. Publish a portfolio.
          </p>
          <h2 className="max-w-4xl break-words text-4xl font-bold tracking-tight text-ink sm:text-5xl">
            An agent that understands career evidence and turns it into a persona-aware portfolio.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted">
            Auto-CaseStudy starts with evidence, not templates. It reads messy school and work artifacts, maps relationships, detects gaps, and helps users publish one strong case study without inventing unsupported claims.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href="#ingest" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-slateInk transition hover:bg-primary/90">
            Start with artifacts <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
          <a href="#preview" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 font-semibold text-ink transition hover:bg-panelHigh">
            View generated portfolio
          </a>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <Metric label="Artifacts understood" value={artifacts.length.toString()} detail="Images, docs, Figma, resume, technical proof" />
        <Metric label="Agent confidence" value={`${score.confidence}%`} detail="Average classification confidence" />
        <Metric label="Publish readiness" value={`${score.readiness}%`} detail={`${score.supported} evidence-backed sections`} />
      </div>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 text-3xl font-bold text-primary">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
    </div>
  );
}

function WorkflowRail() {
  return (
    <section id="strategy" className="grid gap-3 md:grid-cols-3">
      {[
        ["1", "Understand artifacts", "Classify files, links, images, resumes, and technical proof."],
        ["2", "Infer persona", "Choose the strongest portfolio strategy for the user."],
        ["3", "Generate and publish", "Draft pages, preserve evidence, and export hostable content."]
      ].map(([number, title, detail]) => (
        <div key={number} className="rounded-lg border border-line bg-surface p-4">
          <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-sm font-bold text-primary">{number}</div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted">{detail}</p>
        </div>
      ))}
    </section>
  );
}

function CognitionPanel() {
  return (
    <section className="rounded-lg border border-line bg-surface p-5" aria-label="Professional cognition modes">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Professional cognition layer</p>
          <h2 className="mt-2 text-2xl font-semibold">Same artifact, different expert interpretation</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            The wedge is HCI, UX, and early-career design portfolios. The agent should reason like the role the user wants to become, then preserve provenance for every strong claim.
          </p>
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
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">Reads</p>
            <p className="mt-1 text-sm leading-6 text-muted">{mode.reads}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted">Understands</p>
            <p className="mt-1 text-sm leading-6 text-muted">{mode.sees}</p>
            <p className="mt-3 rounded-md border border-primary/20 bg-primary/10 p-3 text-sm leading-6 text-primary">{mode.question}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function IngestionPanel({
  onFiles,
  isUploading,
  uploadError
}: {
  onFiles: (event: ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  uploadError: string;
}) {
  return (
    <section id="ingest" className="rounded-lg border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Artifact ingestion</p>
          <h2 className="mt-2 text-2xl font-semibold">Drop in the messy proof</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Step 002 stores real PDF, DOCX, image, and slide files locally and creates metadata records. It does not parse document content yet.
          </p>
        </div>
        <label className={cn("inline-flex min-h-11 items-center gap-2 rounded-md px-4 font-semibold text-slateInk transition", isUploading ? "bg-muted" : "bg-primary hover:bg-primary/90")}>
          <Upload className="h-4 w-4" aria-hidden />
          {isUploading ? "Uploading..." : "Add files"}
          <input
            className="sr-only"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif"
            onChange={onFiles}
            disabled={isUploading}
          />
        </label>
      </div>
      {uploadError ? (
        <p className="mt-4 rounded-md border border-danger/25 bg-danger/10 p-3 text-sm text-danger" role="alert">
          {uploadError}
        </p>
      ) : null}
      <div className="mt-5 rounded-md border border-line bg-background p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Current ingestion pipe</p>
        <div className="mt-3 grid gap-2 text-sm text-muted sm:grid-cols-5">
          {["Upload UI", "API file handler", "Local storage", "Metadata record", "Artifact library"].map((step, index) => (
            <div key={step} className="rounded-md border border-line bg-panel p-3">
              <span className="text-primary">0{index + 1}</span>
              <p className="mt-1">{step}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Visuals", "Screenshots, photos, wireframes", Image],
          ["Documents", "PDF, DOCX, notes, slides", FileText],
          ["Prototypes", "Figma links and flows", Link],
          ["Technical proof", "Cloud diagrams, code, systems", Cloud]
        ].map(([title, detail, Icon]) => (
          <div key={title as string} className="rounded-md border border-line bg-panel p-4">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
            <h3 className="mt-3 font-semibold">{title as string}</h3>
            <p className="mt-1 text-sm text-muted">{detail as string}</p>
          </div>
        ))}
      </div>
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
            <p className="text-xs uppercase tracking-[0.18em] text-primary">Agent analysis</p>
            <h2 className="mt-2 text-2xl font-semibold">Artifact intelligence graph</h2>
          </div>
          <BadgeCheck className="h-6 w-6 text-emerald" aria-label="Evidence checked" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr className="border-b border-line">
                <th className="py-3 pr-4 font-semibold">Artifact</th>
                <th className="py-3 pr-4 font-semibold">Type</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Phase</th>
                <th className="py-3 pr-4 font-semibold">Confidence</th>
                <th className="py-3 pr-4 font-semibold">Placement</th>
              </tr>
            </thead>
            <tbody>
              {artifacts.map((artifact) => (
                <tr key={artifact.id} className="border-b border-line/70">
                  <td className="py-3 pr-4">
                    <p className="font-medium text-ink">{artifact.name}</p>
                    <p className="mt-1 text-xs text-muted">{artifact.extractedSignals.join(" • ")}</p>
                    {artifact.sizeBytes ? (
                      <p className="mt-1 text-xs text-faint">
                        {(artifact.sizeBytes / 1024).toFixed(1)} KB · {artifact.mimeType}
                      </p>
                    ) : null}
                    {artifact.extractedContent ? (
                      <div className="mt-3 max-w-2xl rounded-md border border-line bg-background p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                          Extracted preview · {artifact.extractedContent.parser}
                        </p>
                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">
                          {artifact.extractedContent.text}
                        </p>
                      </div>
                    ) : null}
                    {artifact.classification ? (
                      <div className="mt-3 max-w-2xl rounded-md border border-primary/20 bg-primary/10 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-slateInk">
                            {artifact.classification.classification}
                          </span>
                          <span className="text-xs text-primary">
                            {artifact.classification.confidenceScore}% classification confidence
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-2">
                          <p><span className="text-faint">Project:</span> {artifact.classification.projectName ?? "Unknown"}</p>
                          <p><span className="text-faint">Course/job:</span> {artifact.classification.courseOrJob ?? "Unknown"}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {artifact.classification.tags.slice(0, 8).map((tag) => (
                            <span key={tag} className="rounded-full border border-line bg-background px-2 py-1 text-xs text-muted">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {artifact.parserError ? (
                      <p className="mt-2 rounded-md border border-danger/25 bg-danger/10 p-2 text-xs text-danger">
                        Parser failed: {artifact.parserError}
                      </p>
                    ) : null}
                  </td>
                  <td className="py-3 pr-4 text-muted">{artifact.kind}</td>
                  <td className="py-3 pr-4">
                    <span className={cn("rounded-full border px-2.5 py-1 text-xs", artifact.status === "Parsed" ? "border-emerald/30 bg-emerald/10 text-emerald" : artifact.status === "Failed" ? "border-danger/30 bg-danger/10 text-danger" : "border-line bg-background text-muted")}>
                      {artifact.status ?? "Demo"}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted">{artifact.phase}</td>
                  <td className="py-3 pr-4">
                    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", artifact.confidence === "High" ? "bg-emerald/15 text-emerald" : artifact.confidence === "Medium" ? "bg-amber/15 text-amber" : "bg-danger/15 text-danger")}>
                      {artifact.confidence} · {artifact.confidenceScore}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-muted">{artifact.suggestedPlacement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-surface p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-primary">Agent log</p>
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
  const artifactById = new Map(artifacts.map((artifact) => [artifact.id, artifact]));

  async function saveCluster(cluster: ProjectCluster) {
    onClusterChange(cluster);
    await fetch("/api/evidence-map", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cluster })
    }).catch(() => undefined);
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
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Structured relationship mapping</p>
          <h2 className="mt-2 text-2xl font-semibold">Project cluster review</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Deterministic matching groups artifacts by shared project clues, course/job, tools, dates, and support relationships. This is still structured mapping, not agent reasoning.
          </p>
        </div>
        <span className="rounded-full border border-line bg-panel px-3 py-1 text-sm text-muted">
          {relationships.length} relationship edge{relationships.length === 1 ? "" : "s"}
        </span>
      </div>

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
                    {cluster.confidenceScore}% grouping confidence · {cluster.status}
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
          Upload and classify artifacts to create project cluster candidates. Stronger relationship edges appear when two or more artifacts share clues.
        </div>
      )}
    </section>
  );
}

function EditorPanel({
  sections,
  artifacts,
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
  prompt: string;
  sensors: ReturnType<typeof useSensors>;
  onPrompt: (value: string) => void;
  onPromptSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onToggleLock: (id: string) => void;
  onUpdateSection: (id: string, content: string) => void;
  onRegenerate: () => void;
}) {
  return (
    <section id="editor" className="rounded-lg border border-line bg-surface p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Editable case study builder</p>
          <h2 className="mt-2 text-2xl font-semibold">Drag sections, lock edits, command the agent</h2>
        </div>
        <button onClick={onRegenerate} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-line px-4 font-semibold text-ink transition hover:bg-panelHigh">
          <WandSparkles className="h-4 w-4" aria-hidden />
          Regenerate draft
        </button>
      </div>

      <form onSubmit={onPromptSubmit} className="mb-5 flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3 sm:flex-row">
        <label className="sr-only" htmlFor="ai-command">AI edit command</label>
        <input
          id="ai-command"
          value={prompt}
          onChange={(event) => onPrompt(event.target.value)}
          placeholder="Try: make this recruiter-friendly, more academic, or more technical"
          className="min-h-11 flex-1 rounded-md border border-line bg-background px-3 text-sm text-ink placeholder:text-faint"
        />
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-semibold text-slateInk transition hover:bg-primary/90">
          Apply prompt <Sparkles className="h-4 w-4" aria-hidden />
        </button>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                artifacts={artifacts}
                onToggleLock={onToggleLock}
                onUpdateSection={onUpdateSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableSection({
  section,
  artifacts,
  onToggleLock,
  onUpdateSection
}: {
  section: CaseStudySection;
  artifacts: Artifact[];
  onToggleLock: (id: string) => void;
  onUpdateSection: (id: string, content: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const evidence = artifacts.filter((artifact) => section.evidenceIds.includes(artifact.id));

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-lg border border-line bg-panel p-4", isDragging && "border-primary shadow-glow")}
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
        className="min-h-[116px] w-full resize-y rounded-md border border-line bg-background p-3 text-sm leading-6 text-ink"
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

function StrategyPanel({
  persona,
  theme,
  audienceMode,
  score,
  onPersona,
  onTheme,
  onAudienceMode
}: {
  persona: Persona;
  theme: PortfolioTheme;
  audienceMode: string;
  score: number;
  onPersona: (persona: Persona) => void;
  onTheme: (theme: PortfolioTheme) => void;
  onAudienceMode: (mode: "Portfolio" | "Research" | "Technical") => void;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-primary">Portfolio strategy</p>
      <h2 className="mt-2 text-xl font-semibold">Persona-aware generation</h2>
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
          <span className="text-sm text-muted">Founder demo strength</span>
          <span className="font-bold text-primary">{score}%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-background">
          <div className="h-full rounded-full bg-emerald" style={{ width: `${score}%` }} />
        </div>
      </div>
    </section>
  );
}

function ProvenancePanel() {
  return (
    <section className="rounded-lg border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-primary">Provenance graph</p>
      <h2 className="mt-2 text-xl font-semibold">No claim without source memory</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        The early MVP simulates this graph. Phase 2 replaces filenames with real parsing, extraction, and artifact relationships.
      </p>
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
  return (
    <section id="preview" className={cn("rounded-lg border p-5", light ? "border-slate-200 bg-paper text-slateInk" : "border-line bg-surface text-ink")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={cn("text-xs uppercase tracking-[0.18em]", light ? "text-slate-500" : "text-primary")}>Live portfolio preview</p>
          <h2 className="mt-2 text-xl font-semibold">{persona}</h2>
        </div>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", light ? "bg-slate-900 text-white" : "bg-primary text-slateInk")}>{mode}</span>
      </div>
      <p className={cn("mt-4 text-sm leading-6", light ? "text-slate-600" : "text-muted")}>
        {mode === "Research"
          ? "A methods-forward portfolio with evidence, limitations, and source traceability."
          : mode === "Technical"
            ? "A hybrid portfolio translating implementation depth into product credibility."
            : "A recruiter-readable portfolio focused on role clarity, decisions, visuals, and impact."}
      </p>
      <div className="mt-5 space-y-4">
        {sections.slice(0, 4).map((section) => (
          <article key={section.id} className={cn("rounded-md border p-4", light ? "border-slate-200 bg-white" : "border-line bg-panel")}>
            <h3 className="font-semibold">{section.title}</h3>
            <p className={cn("mt-2 text-sm leading-6", light ? "text-slate-600" : "text-muted")}>{section.content}</p>
            <p className={cn("mt-3 text-xs", section.evidenceIds.length ? "text-emerald" : "text-danger")}>
              {section.evidenceIds.length ? `${section.evidenceIds.length} evidence source${section.evidenceIds.length === 1 ? "" : "s"}` : "No evidence found"}
            </p>
          </article>
        ))}
      </div>
      <div className={cn("mt-5 grid gap-2 rounded-md border p-3 text-xs", light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-line bg-background text-muted")}>
        <p className="font-semibold">Ready-to-host package</p>
        <p>Home, about, case studies, skills, technical projects, resume summary, SEO/social fields, and alt-text queue.</p>
        <p>{artifacts.length} artifacts remain linked as proof sources.</p>
      </div>
    </section>
  );
}

function ExportPanel({ readiness, gaps }: { readiness: number; gaps: number }) {
  const ready = readiness >= 80 && gaps <= 2;
  return (
    <section id="export" className="rounded-lg border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-primary">Publish/export hub</p>
      <h2 className="mt-2 text-xl font-semibold">Hostable portfolio output</h2>
      <div className="mt-4 space-y-3">
        {[
          ["Static web export", "Generate deployable portfolio pages", MonitorUp],
          ["PDF case study packet", "Recruiter and academic share format", FileText],
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
        {ready ? "Package portfolio" : "Resolve evidence gaps first"}
      </button>
      <p className="mt-3 text-xs leading-5 text-muted">
        Export is a placeholder in this MVP foundation, but the UI models the production publishing surface.
      </p>
    </section>
  );
}
