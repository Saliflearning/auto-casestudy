"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, BadgeCheck, Eye, EyeOff, Image as ImageIcon, Lock, LockOpen, Monitor, RotateCcw, Save, Smartphone, Tablet, WandSparkles } from "lucide-react";
import { PortfolioBuilderDevice, PortfolioSiteDraft, PortfolioThemeSettings, ProjectPageDraft } from "@/lib/portfolio-site-draft-types";
import { cn } from "@/lib/utils";

function getClientWorkspaceId() {
  if (typeof window === "undefined") return "demo-workspace";
  const key = "auto-casestudy-workspace";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = `workspace_${crypto.randomUUID()}`;
  window.localStorage.setItem(key, created);
  return created;
}

type SaveState = "idle" | "loading" | "saving" | "saved" | "resetting" | "error";

const typographyOptions: PortfolioThemeSettings["typography"][] = ["clean sans", "editorial", "technical mono"];
const spacingOptions: PortfolioThemeSettings["spacing"][] = ["compact", "comfortable", "spacious"];
const colorOptions: PortfolioThemeSettings["colorMood"][] = ["instrument dark", "recruiter light", "warm editorial"];
const appearanceOptions: PortfolioThemeSettings["appearance"][] = ["dark", "light"];
const buttonOptions: PortfolioThemeSettings["buttonStyle"][] = ["solid", "outline", "soft"];

export function PortfolioBuilderWorkspace() {
  const [draft, setDraft] = useState<PortfolioSiteDraft | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [error, setError] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedPanel, setSelectedPanel] = useState<"home" | "project">("home");

  useEffect(() => {
    let cancelled = false;
    async function loadDraft() {
      setSaveState("loading");
      try {
        const response = await fetch("/api/portfolio-site-draft", {
          cache: "no-store",
          headers: { "x-autocasestudy-workspace": getClientWorkspaceId() }
        });
        const payload = await response.json();
        if (cancelled) return;
        setDraft(payload.draft ?? null);
        setSelectedProjectId(payload.draft?.projectPages?.[0]?.projectId ?? "");
        setSaveState("idle");
      } catch {
        if (!cancelled) {
          setError("Could not load portfolio builder draft.");
          setSaveState("error");
        }
      }
    }
    loadDraft();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProject = useMemo(
    () => draft?.projectPages.find((project) => project.projectId === selectedProjectId) ?? draft?.projectPages[0],
    [draft, selectedProjectId]
  );

  async function resetFromPlan() {
    setSaveState("resetting");
    setError("");
    try {
      const response = await fetch("/api/portfolio-site-draft/reset-from-plan", {
        method: "POST",
        headers: { "x-autocasestudy-workspace": getClientWorkspaceId() }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Could not reset builder draft from plan.");
      setDraft(payload.draft);
      setSelectedProjectId(payload.draft?.projectPages?.[0]?.projectId ?? "");
      setSaveState("saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reset builder draft from plan.");
      setSaveState("error");
    }
  }

  async function saveDraft() {
    if (!draft) return;
    setSaveState("saving");
    setError("");
    try {
      const response = await fetch("/api/portfolio-site-draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-autocasestudy-workspace": getClientWorkspaceId() },
        body: JSON.stringify({ draft })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Could not save portfolio draft.");
      setDraft(payload.draft);
      setSaveState("saved");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save portfolio draft.");
      setSaveState("error");
    }
  }

  function updateDraft(updater: (draft: PortfolioSiteDraft) => PortfolioSiteDraft) {
    setDraft((current) => current ? updater({ ...current, updatedAt: new Date().toISOString() }) : current);
    setSaveState("idle");
  }

  function updateHomepage(field: "headline" | "subtitle", value: string) {
    updateDraft((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        [field]: value
      }
    }));
  }

  function updateCta(kind: "primary" | "secondary", value: string) {
    updateDraft((current) => ({
      ...current,
      homepage: {
        ...current.homepage,
        ctaLabels: {
          ...current.homepage.ctaLabels,
          [kind]: value
        }
      }
    }));
  }

  function updateTheme<K extends keyof PortfolioThemeSettings>(field: K, value: PortfolioThemeSettings[K]) {
    updateDraft((current) => ({
      ...current,
      theme: {
        ...current.theme,
        [field]: value
      }
    }));
  }

  function setDevice(device: PortfolioBuilderDevice) {
    updateDraft((current) => ({
      ...current,
      responsivePreview: { device }
    }));
  }

  function updateProject(projectId: string, updater: (project: ProjectPageDraft) => ProjectPageDraft) {
    updateDraft((current) => ({
      ...current,
      projectPages: current.projectPages.map((project) => project.projectId === projectId ? updater(project) : project)
    }));
  }

  function moveSection(projectId: string, sectionId: string, direction: "up" | "down") {
    updateProject(projectId, (project) => {
      const blocks = [...project.sectionBlocks].sort((a, b) => a.order - b.order);
      const index = blocks.findIndex((block) => block.id === sectionId);
      const target = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || target < 0 || target >= blocks.length) return project;
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return {
        ...project,
        sectionBlocks: blocks.map((block, orderIndex) => ({ ...block, order: orderIndex + 1 }))
      };
    });
  }

  function updateSection(projectId: string, sectionId: string, patch: Partial<ProjectPageDraft["sectionBlocks"][number]>) {
    updateProject(projectId, (project) => ({
      ...project,
      sectionBlocks: project.sectionBlocks.map((section) => section.id === sectionId ? { ...section, ...patch } : section)
    }));
  }

  function updateMedia(projectId: string, mediaId: string, patch: Partial<ProjectPageDraft["mediaAssignments"][number]>) {
    updateProject(projectId, (project) => ({
      ...project,
      mediaAssignments: project.mediaAssignments.map((media) => media.id === mediaId ? { ...media, ...patch } : media)
    }));
  }

  return (
    <section className="rounded-lg border border-line bg-surface p-5" aria-label="Editable portfolio builder shell">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-primary">Builder shell</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">Edit the portfolio experience</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Framer-style editing, constrained by the persisted evidence plan, composed layouts, and provenance spine.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetFromPlan}
            disabled={saveState === "resetting"}
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line px-3 text-sm font-semibold text-muted transition hover:bg-panelHigh hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            {saveState === "resetting" ? "Resetting..." : "Reset from plan"}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={!draft || saveState === "saving"}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-slateInk transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden />
            {saveState === "saving" ? "Saving..." : "Save draft"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 rounded-md border border-danger/25 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}

      {draft ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[240px_1fr_320px]">
          <BuilderNavigator
            draft={draft}
            selectedPanel={selectedPanel}
            selectedProjectId={selectedProject?.projectId ?? ""}
            onHome={() => setSelectedPanel("home")}
            onProject={(projectId) => {
              setSelectedPanel("project");
              setSelectedProjectId(projectId);
            }}
          />

          <BuilderCanvas
            draft={draft}
            selectedPanel={selectedPanel}
            selectedProject={selectedProject}
            onHomepage={updateHomepage}
            onCta={updateCta}
            onSection={updateSection}
            onMoveSection={moveSection}
            onMedia={updateMedia}
          />

          <BuilderSettingsPanel
            draft={draft}
            saveState={saveState}
            onTheme={updateTheme}
            onDevice={setDevice}
          />
        </div>
      ) : (
        <div className="mt-5 rounded-md border border-line bg-panel p-5">
          <p className="text-sm font-semibold text-ink">No builder draft yet</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Reset from the persisted orchestration plan after layout composition and portfolio orchestration are complete.
          </p>
        </div>
      )}
    </section>
  );
}

function BuilderNavigator({
  draft,
  selectedPanel,
  selectedProjectId,
  onHome,
  onProject
}: {
  draft: PortfolioSiteDraft;
  selectedPanel: "home" | "project";
  selectedProjectId: string;
  onHome: () => void;
  onProject: (projectId: string) => void;
}) {
  return (
    <aside className="rounded-md border border-line bg-panel p-4" aria-label="Builder section navigator">
      <p className="text-xs uppercase tracking-[0.16em] text-primary">Pages</p>
      <div className="mt-3 space-y-2">
        <button
          type="button"
          onClick={onHome}
          className={cn("min-h-10 w-full rounded-md border px-3 text-left text-sm font-semibold", selectedPanel === "home" ? "border-primary/40 bg-primary/10 text-primary" : "border-line bg-background text-muted hover:text-ink")}
        >
          Home
        </button>
        {draft.projectPages.map((project) => (
          <button
            key={project.projectId}
            type="button"
            onClick={() => onProject(project.projectId)}
            className={cn("min-h-10 w-full rounded-md border px-3 text-left text-sm", selectedPanel === "project" && selectedProjectId === project.projectId ? "border-primary/40 bg-primary/10 text-primary" : "border-line bg-background text-muted hover:text-ink")}
          >
            <span className="block truncate font-semibold">{project.title}</span>
            <span className="text-xs">{project.role}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 border-t border-line pt-4">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Navigation</p>
        <div className="mt-2 space-y-1">
          {draft.navigation.filter((item) => item.visible).map((item) => (
            <p key={item.id} className="rounded-md border border-line bg-background px-2 py-1 text-xs text-muted">
              {item.order}. {item.label}
            </p>
          ))}
        </div>
      </div>
    </aside>
  );
}

function BuilderCanvas({
  draft,
  selectedPanel,
  selectedProject,
  onHomepage,
  onCta,
  onSection,
  onMoveSection,
  onMedia
}: {
  draft: PortfolioSiteDraft;
  selectedPanel: "home" | "project";
  selectedProject?: ProjectPageDraft;
  onHomepage: (field: "headline" | "subtitle", value: string) => void;
  onCta: (kind: "primary" | "secondary", value: string) => void;
  onSection: (projectId: string, sectionId: string, patch: Partial<ProjectPageDraft["sectionBlocks"][number]>) => void;
  onMoveSection: (projectId: string, sectionId: string, direction: "up" | "down") => void;
  onMedia: (projectId: string, mediaId: string, patch: Partial<ProjectPageDraft["mediaAssignments"][number]>) => void;
}) {
  const frameClass = draft.responsivePreview.device === "mobile" ? "max-w-[390px]" : draft.responsivePreview.device === "tablet" ? "max-w-[760px]" : "max-w-full";

  if (selectedPanel === "project" && selectedProject) {
    return (
      <main className={cn("mx-auto w-full rounded-md border border-line bg-background p-4 transition-all", frameClass)} aria-label="Project page builder canvas">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-primary">Project page</p>
            <h3 className="mt-1 text-xl font-semibold text-ink">{selectedProject.title}</h3>
          </div>
          <span className="rounded-full border border-line bg-panel px-2.5 py-1 text-xs text-muted">{selectedProject.role}</span>
        </div>

        <div className="mt-4 space-y-3">
          {[...selectedProject.sectionBlocks].sort((a, b) => a.order - b.order).map((section, index) => (
            <article key={section.id} className={cn("rounded-md border p-3", section.visible ? "border-line bg-panel" : "border-line bg-panel/40 opacity-70")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <input
                    value={section.title}
                    onChange={(event) => onSection(selectedProject.projectId, section.id, { title: event.target.value })}
                    className="w-full rounded-md border border-line bg-background px-3 py-2 text-sm font-semibold text-ink"
                    aria-label={`Section title ${section.title}`}
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ProvenanceBadges count={section.provenance.length} warnings={section.warnings.length} />
                    {section.needsRevision ? <span className="rounded-full border border-amber/25 bg-amber/10 px-2 py-1 text-xs text-amber">Needs revision</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <IconButton label="Move section up" disabled={index === 0} onClick={() => onMoveSection(selectedProject.projectId, section.id, "up")} icon={<ArrowUp className="h-3.5 w-3.5" aria-hidden />} />
                  <IconButton label="Move section down" disabled={index === selectedProject.sectionBlocks.length - 1} onClick={() => onMoveSection(selectedProject.projectId, section.id, "down")} icon={<ArrowDown className="h-3.5 w-3.5" aria-hidden />} />
                  <IconButton label={section.visible ? "Hide section" : "Show section"} onClick={() => onSection(selectedProject.projectId, section.id, { visible: !section.visible })} icon={section.visible ? <Eye className="h-3.5 w-3.5" aria-hidden /> : <EyeOff className="h-3.5 w-3.5" aria-hidden />} />
                  <IconButton label={section.locked ? "Unlock section" : "Lock section"} onClick={() => onSection(selectedProject.projectId, section.id, { locked: !section.locked })} icon={section.locked ? <Lock className="h-3.5 w-3.5" aria-hidden /> : <LockOpen className="h-3.5 w-3.5" aria-hidden />} />
                  <IconButton label="Mark needs revision" onClick={() => onSection(selectedProject.projectId, section.id, { needsRevision: !section.needsRevision })} icon={<WandSparkles className="h-3.5 w-3.5" aria-hidden />} />
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-4 rounded-md border border-line bg-panel p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-primary">Media assignments</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {selectedProject.mediaAssignments.length ? selectedProject.mediaAssignments.map((media) => (
              <article key={media.id} className={cn("rounded-md border border-line bg-background p-3", !media.visible && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <ImageIcon className="mt-1 h-4 w-4 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <select
                      value={media.placement}
                      onChange={(event) => onMedia(selectedProject.projectId, media.id, { placement: event.target.value as typeof media.placement })}
                      className="min-h-9 w-full rounded-md border border-line bg-panel px-2 text-xs text-ink"
                    >
                      {["hero", "inline", "gallery", "aside", "warning"].map((placement) => <option key={placement}>{placement}</option>)}
                    </select>
                    <textarea
                      value={media.caption}
                      onChange={(event) => onMedia(selectedProject.projectId, media.id, { caption: event.target.value })}
                      className="mt-2 min-h-20 w-full resize-y rounded-md border border-line bg-panel p-2 text-xs leading-5 text-ink"
                      aria-label="Media caption"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" onClick={() => onMedia(selectedProject.projectId, media.id, { visible: !media.visible })} className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-ink">
                        {media.visible ? "Remove visual" : "Restore visual"}
                      </button>
                      <button type="button" onClick={() => onMedia(selectedProject.projectId, media.id, { private: !media.private, visible: media.private })} className="rounded-md border border-line px-2 py-1 text-xs text-muted hover:text-ink">
                        {media.private ? "Mark public" : "Mark private"}
                      </button>
                      <ProvenanceBadges count={media.provenance.length} warnings={media.private ? 1 : 0} />
                    </div>
                  </div>
                </div>
              </article>
            )) : <p className="rounded-md border border-amber/25 bg-amber/10 p-3 text-sm text-amber">No approved visuals available for this project page yet.</p>}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={cn("mx-auto w-full rounded-md border border-line bg-background p-4 transition-all", frameClass)} aria-label="Homepage builder canvas">
      <div className="rounded-md border border-line bg-panel p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Homepage hero</p>
        <label className="mt-3 block text-xs uppercase tracking-[0.14em] text-faint" htmlFor="builder-home-headline">Headline</label>
        <input
          id="builder-home-headline"
          value={draft.homepage.headline}
          onChange={(event) => onHomepage("headline", event.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-background px-3 py-2 text-xl font-semibold text-ink"
        />
        <label className="mt-4 block text-xs uppercase tracking-[0.14em] text-faint" htmlFor="builder-home-subtitle">Subtitle</label>
        <textarea
          id="builder-home-subtitle"
          value={draft.homepage.subtitle}
          onChange={(event) => onHomepage("subtitle", event.target.value)}
          className="mt-1 min-h-24 w-full resize-y rounded-md border border-line bg-background p-3 text-sm leading-6 text-ink"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.14em] text-faint">
            Primary CTA
            <input value={draft.homepage.ctaLabels.primary} onChange={(event) => onCta("primary", event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-line bg-background px-3 text-sm text-ink" />
          </label>
          <label className="block text-xs uppercase tracking-[0.14em] text-faint">
            Secondary CTA
            <input value={draft.homepage.ctaLabels.secondary} onChange={(event) => onCta("secondary", event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-line bg-background px-3 text-sm text-ink" />
          </label>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {draft.homepage.proofBlocks.slice(0, 3).map((proof) => (
          <div key={proof} className="rounded-md border border-line bg-panel p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-primary">Proof</p>
            <p className="mt-1 text-sm font-semibold text-ink">{proof}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-md border border-line bg-panel p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Featured project order</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {draft.homepage.projectPreviewOrder.map((projectId, index) => (
            <span key={projectId} className="rounded-full border border-line bg-background px-2.5 py-1 text-xs text-muted">
              {index + 1}. {draft.projectPages.find((project) => project.projectId === projectId)?.title ?? projectId}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <ProvenanceBadges count={draft.homepage.provenance.length} warnings={draft.homepage.warnings.length} />
      </div>
    </main>
  );
}

function BuilderSettingsPanel({
  draft,
  saveState,
  onTheme,
  onDevice
}: {
  draft: PortfolioSiteDraft;
  saveState: SaveState;
  onTheme: <K extends keyof PortfolioThemeSettings>(field: K, value: PortfolioThemeSettings[K]) => void;
  onDevice: (device: PortfolioBuilderDevice) => void;
}) {
  return (
    <aside className="space-y-4 rounded-md border border-line bg-panel p-4" aria-label="Builder settings panel">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Save state</p>
        <p className="mt-1 text-sm font-semibold text-ink">{saveState === "saved" ? "Saved" : saveState === "loading" ? "Loading" : saveState === "error" ? "Needs attention" : "Draft changes"}</p>
        <p className="mt-1 text-xs leading-5 text-muted">Last updated {new Date(draft.updatedAt).toLocaleString()}</p>
      </div>

      <div className="border-t border-line pt-4">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Responsive preview</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["desktop", Monitor],
            ["tablet", Tablet],
            ["mobile", Smartphone]
          ].map(([device, Icon]) => (
            <button
              key={device as string}
              type="button"
              onClick={() => onDevice(device as PortfolioBuilderDevice)}
              className={cn("inline-flex min-h-10 items-center justify-center rounded-md border", draft.responsivePreview.device === device ? "border-primary/40 bg-primary/10 text-primary" : "border-line bg-background text-muted hover:text-ink")}
              aria-label={`${device} preview`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Theme</p>
        <div className="mt-3 space-y-3">
          <SettingsSelect label="Typography" value={draft.theme.typography} options={typographyOptions} onChange={(value) => onTheme("typography", value as PortfolioThemeSettings["typography"])} />
          <SettingsSelect label="Spacing" value={draft.theme.spacing} options={spacingOptions} onChange={(value) => onTheme("spacing", value as PortfolioThemeSettings["spacing"])} />
          <SettingsSelect label="Color mood" value={draft.theme.colorMood} options={colorOptions} onChange={(value) => onTheme("colorMood", value as PortfolioThemeSettings["colorMood"])} />
          <SettingsSelect label="Appearance" value={draft.theme.appearance} options={appearanceOptions} onChange={(value) => onTheme("appearance", value as PortfolioThemeSettings["appearance"])} />
          <SettingsSelect label="Buttons" value={draft.theme.buttonStyle} options={buttonOptions} onChange={(value) => onTheme("buttonStyle", value as PortfolioThemeSettings["buttonStyle"])} />
        </div>
      </div>

      <div className="rounded-md border border-line bg-background p-3">
        <p className="text-xs uppercase tracking-[0.16em] text-primary">Guardrails</p>
        <div className="mt-2 space-y-2">
          {draft.guardrails.length ? draft.guardrails.slice(0, 4).map((guardrail) => (
            <p key={guardrail} className="text-xs leading-5 text-amber">{guardrail}</p>
          )) : <p className="text-xs text-emerald">No active builder guardrails.</p>}
        </div>
      </div>
    </aside>
  );
}

function SettingsSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.14em] text-faint">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 min-h-10 w-full rounded-md border border-line bg-background px-3 text-sm text-ink">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function IconButton({ label, icon, onClick, disabled }: { label: string; icon: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 w-9 items-center justify-center rounded-md border border-line bg-background text-muted hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
    </button>
  );
}

function ProvenanceBadges({ count, warnings }: { count: number; warnings: number }) {
  return (
    <span className="inline-flex flex-wrap gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald/25 bg-emerald/10 px-2 py-1 text-xs text-emerald">
        <BadgeCheck className="h-3 w-3" aria-hidden />
        {count} source{count === 1 ? "" : "s"}
      </span>
      {warnings ? (
        <span className="rounded-full border border-amber/25 bg-amber/10 px-2 py-1 text-xs text-amber">{warnings} warning{warnings === 1 ? "" : "s"}</span>
      ) : null}
    </span>
  );
}
