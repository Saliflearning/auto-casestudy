import { randomUUID } from "node:crypto";
import { ConfirmedPortfolioBlueprint, PortfolioBlueprintRecord } from "@/lib/portfolio-blueprint-types";
import { PortfolioPageComposition } from "@/lib/layout-composition-types";
import { Artifact } from "@/lib/types";
import { archetypeExperienceStrategy } from "@/lib/archetype-experience-strategy";
import { buildNavigationArchitecture } from "@/lib/navigation-architecture-engine";
import { buildPortfolioRhythm } from "@/lib/portfolio-rhythm-engine";
import { buildRecruiterJourney } from "@/lib/recruiter-journey-engine";
import { PortfolioExperiencePlan, ProjectSequenceItem } from "@/lib/portfolio-experience-types";

function projectTitle(projectId: string, compositions: PortfolioPageComposition[]) {
  return compositions.find((composition) => composition.projectId === projectId)?.title ?? projectId.replace(/[_-]/g, " ");
}

function evidenceCount(projectId: string, compositions: PortfolioPageComposition[]) {
  const composition = compositions.find((item) => item.projectId === projectId);
  return composition?.provenance.length ?? 0;
}

function projectWarnings(projectId: string, compositions: PortfolioPageComposition[]) {
  return compositions.find((item) => item.projectId === projectId)?.unresolvedWarnings ?? [];
}

function buildProjectSequence(blueprint: ConfirmedPortfolioBlueprint, compositions: PortfolioPageComposition[]): ProjectSequenceItem[] {
  const projectIds = blueprint.approvedProjectOrder.length
    ? blueprint.approvedProjectOrder
    : compositions.map((composition) => composition.projectId);

  return projectIds.map((projectId, index) => {
    const warnings = projectWarnings(projectId, compositions);
    const sources = evidenceCount(projectId, compositions);
    const recruiterValue = sources >= 3 && warnings.length === 0 ? "high" : sources >= 1 ? "medium" : "low";
    return {
      projectId,
      title: projectTitle(projectId, compositions),
      role: index === 0 ? "featured" : warnings.length > 2 ? "hold" : "supporting",
      order: index + 1,
      recruiterValue,
      rhythmRole: index === 0 ? "anchor" : recruiterValue === "high" ? "contrast" : warnings.length ? "defer" : "proof",
      rationale:
        index === 0
          ? "Starts the portfolio because it is the approved featured project path."
          : warnings.length
            ? "Kept lower in the sequence until missing evidence is resolved."
            : "Supports the main narrative without repeating the opening proof.",
      evidenceCount: sources,
      warnings
    };
  });
}

function buildHomepageStrategy(blueprint: ConfirmedPortfolioBlueprint, compositions: PortfolioPageComposition[], artifacts: Artifact[]) {
  const featuredProjectId = blueprint.approvedHomepageStrategy.featuredProjectId ?? blueprint.approvedProjectOrder[0];
  const featuredComposition = compositions.find((composition) => composition.projectId === featuredProjectId) ?? compositions[0];
  const approvedVisual = artifacts.find((artifact) => artifact.id === blueprint.approvedHomepageStrategy.heroVisualId);
  const warnings = [
    ...(!featuredProjectId ? ["No approved featured project selected for the homepage."] : []),
    ...(!blueprint.approvedHomepageStrategy.heroProofId ? ["Homepage hero proof is not confirmed yet."] : []),
    ...(!approvedVisual ? ["Homepage hero visual is not approved yet."] : [])
  ];

  return {
    headline: blueprint.approvedHomepageStrategy.positioning || `Evidence-backed ${blueprint.archetype} portfolio`,
    subheadline: featuredComposition
      ? `Lead recruiters toward ${featuredComposition.title}, then support the story with traceable project evidence.`
      : "Add a composed project page so the homepage can feature the strongest proof first.",
    featuredProjectId,
    featuredProof: [
      blueprint.approvedHomepageStrategy.heroProofId ?? "Hero proof missing",
      `${blueprint.provenance.length} source links`,
      `${blueprint.readinessScore}% portfolio readiness`
    ],
    heroVisualId: approvedVisual?.id,
    credibilityHierarchy: [
      "Professional identity",
      "Featured project proof",
      "Evidence-backed skills",
      "Resume/contact handoff"
    ],
    ctaStrategy: ["View featured project", "Review evidence-backed skills", "Download resume"],
    provenance: blueprint.provenance,
    warnings
  };
}

export function orchestratePortfolioExperience(input: {
  workspaceId: string;
  blueprint: PortfolioBlueprintRecord | null;
  compositions: PortfolioPageComposition[];
  artifacts: Artifact[];
}): PortfolioExperiencePlan {
  const approved = input.blueprint?.blueprint;
  const archetype = approved?.archetype ?? input.compositions[0]?.archetype ?? "Recruiter-Optimized";
  const strategy = archetypeExperienceStrategy(archetype);
  const fallbackBlueprint: ConfirmedPortfolioBlueprint = approved ?? {
    id: "missing_blueprint",
    status: "Draft Review",
    archetype,
    approvedHomepageStrategy: {
      approved: false,
      tone: "Recruiter",
      positioning: `Evidence-backed ${archetype} portfolio`
    },
    approvedProjectOrder: input.compositions.map((composition) => composition.projectId),
    rejectedProjectIds: [],
    approvedVisualIds: [],
    privateVisualIds: [],
    rejectedVisualIds: [],
    approvedCaseStudyStructures: [],
    resolvedBlockerIds: [],
    unresolvedBlockerIds: ["portfolio-blueprint-missing"],
    skippedBlockerIds: [],
    recruiterStrategy: [],
    userOverrides: {
      approvedHomepage: false,
      projectOrder: [],
      rejectedProjectIds: [],
      homepageTone: "Recruiter",
      mediaDecisions: {},
      blockerDecisions: {},
      missingEvidenceNotes: {},
      sectionNotes: {}
    },
    provenance: [],
    readinessScore: 0,
    readinessLabel: "Blocked",
    generatedFromPlanAt: new Date().toISOString()
  };
  const projectSequence = buildProjectSequence(fallbackBlueprint, input.compositions);
  const visualRhythm = buildPortfolioRhythm(input.compositions);
  const unresolvedWarnings = [
    ...fallbackBlueprint.unresolvedBlockerIds.map((id) => `Blueprint blocker remains: ${id}`),
    ...input.compositions.flatMap((composition) => composition.unresolvedWarnings),
    ...projectSequence.filter((project) => project.recruiterValue === "low").map((project) => `${project.title} has weak recruiter proof.`)
  ];
  const now = new Date().toISOString();

  return {
    id: `portfolio_experience_${randomUUID()}`,
    workspaceId: input.workspaceId,
    blueprintId: input.blueprint?.id,
    sourceCompositionIds: input.compositions.map((composition) => composition.id),
    archetype,
    status: unresolvedWarnings.length ? "Needs Evidence" : "Ready for Assembly",
    homepage: buildHomepageStrategy(fallbackBlueprint, input.compositions, input.artifacts),
    projectSequence,
    navigation: buildNavigationArchitecture(projectSequence.length),
    recruiterJourney: buildRecruiterJourney(archetype, projectSequence.length > 0),
    visualRhythm,
    archetypeStrategy: strategy.notes,
    consistency: {
      tone: strategy.tone,
      sectionLogic: [
        `Homepage emphasizes ${strategy.homepageEmphasis}.`,
        "Projects open from a clear index into evidence-backed case studies.",
        "Skills and resume support the projects instead of competing with them."
      ],
      ctaPattern: "Primary CTA opens featured work; secondary CTAs support resume and contact handoff.",
      identityWarnings: fallbackBlueprint.approvedHomepageStrategy.approved ? [] : ["Homepage strategy has not been explicitly approved."]
    },
    responsive: {
      desktop: ["Use shallow top navigation.", "Feature project proof above long biography.", "Keep evidence and media rhythm visible."],
      tablet: ["Collapse project proof into stacked highlights.", "Keep contact and resume reachable."],
      mobile: ["Use Home, Projects, Contact as top-level actions.", "Stack proof before long narrative sections."]
    },
    unresolvedWarnings: Array.from(new Set(unresolvedWarnings)),
    createdAt: now,
    updatedAt: now
  };
}

export function resequencePortfolioExperience(input: {
  plan: PortfolioExperiencePlan;
  projectIds: string[];
}) {
  const order = new Map(input.projectIds.map((id, index) => [id, index + 1]));
  const knownProjects = input.plan.projectSequence.filter((item) => order.has(item.projectId));
  const unknownProjects = input.plan.projectSequence.filter((item) => !order.has(item.projectId));
  const now = new Date().toISOString();

  return {
    ...input.plan,
    projectSequence: [...knownProjects, ...unknownProjects]
      .sort((a, b) => (order.get(a.projectId) ?? 999) - (order.get(b.projectId) ?? 999))
      .map((item, index) => ({
        ...item,
        order: index + 1,
        role: index === 0 ? "featured" : item.role === "featured" ? "supporting" : item.role,
        rhythmRole: index === 0 ? "anchor" : item.rhythmRole
      })),
    updatedAt: now
  } satisfies PortfolioExperiencePlan;
}
