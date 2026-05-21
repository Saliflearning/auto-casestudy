import { randomUUID } from "node:crypto";
import { GeneratedCaseStudyDraft, GeneratedCaseStudySection } from "@/lib/case-study-generation-types";
import { CaseStudyQualityReport } from "@/lib/case-study-quality-types";
import { getArchetypeLayoutStrategy, regionKindForSection } from "@/lib/archetype-layout-strategies";
import { composeMediaPlacements } from "@/lib/media-composition-engine";
import { planResponsiveLayouts } from "@/lib/responsive-layout-planner";
import { LayoutRegion, LayoutVariant, PortfolioPageComposition, SectionHierarchyItem } from "@/lib/layout-composition-types";

function textSummary(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= 180) return compact;
  return `${compact.slice(0, 177).trim()}...`;
}

function buildHeroRegion(draft: GeneratedCaseStudyDraft): LayoutRegion {
  const overview = draft.sections.find((section) => section.type === "overview") ?? draft.sections[0];
  const warnings = draft.unresolvedIssues.slice(0, 2);
  return {
    id: "region_hero",
    kind: "hero",
    title: draft.title,
    variant: getArchetypeLayoutStrategy(draft.archetype).heroVariant,
    density: "immersive",
    sourceSectionIds: overview ? [overview.id] : [],
    contentSummary: overview ? textSummary(overview.content) : "Case study hero prepared from the approved draft.",
    evidenceCount: overview?.evidenceIds.length ?? draft.provenance.length,
    warnings,
    provenance: overview?.provenance.length ? overview.provenance : draft.provenance,
    mediaIds: [],
    rationale: "The hero introduces the approved project story before the detailed evidence flow.",
    editable: true
  };
}

function buildRegion(section: GeneratedCaseStudySection): LayoutRegion {
  const strategy = getArchetypeLayoutStrategy("Recruiter-Optimized");
  const warnings = [...section.missingEvidence, ...section.unsupportedClaims];
  const regionKind = regionKindForSection(section);
  return {
    id: `region_${section.id}`,
    kind: regionKind,
    title: section.title,
    variant: strategy.sectionVariant(section),
    density: regionKind === "evidence-warning" ? "compact" : "balanced",
    sourceSectionIds: [section.id],
    contentSummary: textSummary(section.content),
    evidenceCount: section.evidenceIds.length,
    warnings,
    provenance: section.provenance,
    mediaIds: [],
    rationale:
      regionKind === "evidence-warning"
        ? "Warning region keeps weak evidence visible instead of hiding it inside polished layout."
        : "Region follows the approved case study section order and preserves its evidence links.",
    editable: section.editable
  };
}

function sortRegions(regions: LayoutRegion[], order: ReturnType<typeof getArchetypeLayoutStrategy>["preferredRegionOrder"]) {
  const indexFor = (kind: LayoutRegion["kind"]) => {
    const index = order.indexOf(kind);
    return index === -1 ? order.length : index;
  };
  return [...regions].sort((a, b) => indexFor(a.kind) - indexFor(b.kind));
}

function buildHierarchy(regions: LayoutRegion[], draft: GeneratedCaseStudyDraft): SectionHierarchyItem[] {
  const sectionById = new Map(draft.sections.map((section) => [section.id, section]));
  return regions.flatMap((region, regionIndex) =>
    region.sourceSectionIds.map((sectionId, sectionIndex) => {
      const section = sectionById.get(sectionId);
      return {
        id: `${region.id}_${sectionId}`,
        title: section?.title ?? region.title,
        type: section?.type ?? "overview",
        regionKind: region.kind,
        level: region.kind === "hero" ? 1 : sectionIndex === 0 ? 2 : 3,
        order: regionIndex + sectionIndex + 1,
        evidenceCount: section?.evidenceIds.length ?? region.evidenceCount,
        warningCount: (section?.missingEvidence.length ?? 0) + (section?.unsupportedClaims.length ?? 0)
      };
    })
  );
}

function rhythmScore(regions: LayoutRegion[], mediaCount: number) {
  const warningCount = regions.filter((region) => region.kind === "evidence-warning" || region.warnings.length).length;
  const processCount = regions.filter((region) => region.kind === "process" || region.kind === "decision").length;
  const base = 62 + Math.min(18, mediaCount * 6) + Math.min(12, processCount * 4) - Math.min(24, warningCount * 8);
  return Math.max(30, Math.min(92, base));
}

export function composeCaseStudyLayout(input: {
  workspaceId: string;
  draft: GeneratedCaseStudyDraft;
  qualityReport?: CaseStudyQualityReport | null;
}): PortfolioPageComposition {
  const { draft, qualityReport } = input;
  const strategy = getArchetypeLayoutStrategy(draft.archetype);
  const bodyRegions = draft.sections
    .filter((section) => section.type !== "overview")
    .map((section) => {
      const region = buildRegion(section);
      const archetypeStrategy = getArchetypeLayoutStrategy(draft.archetype);
      return { ...region, variant: archetypeStrategy.sectionVariant(section) };
    });
  const regions = sortRegions([buildHeroRegion(draft), ...bodyRegions], strategy.preferredRegionOrder);
  const mediaPlacements = composeMediaPlacements(draft, regions);
  const regionsWithMedia = regions.map((region) => ({
    ...region,
    mediaIds: mediaPlacements.filter((media) => media.regionId === region.id).map((media) => media.id)
  }));
  const unresolvedWarnings = [
    ...draft.unresolvedIssues,
    ...(qualityReport?.blockers.map((blocker) => blocker.message) ?? []),
    ...draft.sections.flatMap((section) => [...section.missingEvidence, ...section.unsupportedClaims])
  ];
  const now = new Date().toISOString();

  return {
    id: `portfolio_page_composition_${draft.id}_${randomUUID()}`,
    workspaceId: input.workspaceId,
    draftId: draft.id,
    projectId: draft.projectId,
    title: draft.title,
    archetype: draft.archetype,
    status: unresolvedWarnings.length ? "Needs Evidence" : "Composed",
    readiness: qualityReport?.readiness ?? "not evaluated",
    regions: regionsWithMedia,
    responsivePlan: planResponsiveLayouts(regionsWithMedia, draft.archetype),
    mediaPlacements,
    hierarchy: buildHierarchy(regionsWithMedia, draft),
    rationale: [
      "Composition uses the persisted case study draft as source of truth.",
      "Unresolved evidence warnings remain visible in layout regions.",
      "Responsive structure preserves recruiter scanning before decorative polish."
    ],
    archetypeStrategy: strategy.strategyNotes,
    visualRhythm: {
      score: rhythmScore(regionsWithMedia, mediaPlacements.length),
      density: strategy.density,
      notes: [
        mediaPlacements.length
          ? "Approved media is placed near the sections it supports."
          : "No approved media is available yet, so the layout remains text-led.",
        "Evidence warnings reduce visual readiness until resolved."
      ]
    },
    provenance: draft.provenance,
    unresolvedWarnings: Array.from(new Set(unresolvedWarnings)),
    createdAt: now,
    updatedAt: now
  };
}

export function regenerateCompositionRegion(input: {
  composition: PortfolioPageComposition;
  regionId: string;
}) {
  const region = input.composition.regions.find((item) => item.id === input.regionId);
  if (!region) return input.composition;
  const nextVariant: LayoutVariant =
    region.variant === "narrative-stack"
      ? "split-proof"
      : region.variant === "split-proof"
        ? "narrative-stack"
        : region.variant;
  const now = new Date().toISOString();

  return {
    ...input.composition,
    regions: input.composition.regions.map((item) =>
      item.id === input.regionId
        ? {
            ...item,
            variant: nextVariant,
            rationale: `${item.rationale} Region layout was refreshed without changing approved content or source links.`
          }
        : item
    ),
    updatedAt: now
  };
}
