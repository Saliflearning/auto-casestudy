import { canonicalPersonaPacks, CanonicalArtifactSeed, CanonicalPersonaPack } from "@/lib/canonical-persona-packs";
import { buildSectionRevision } from "@/lib/case-study-revision-engine";
import { suggestedRevisionGoal } from "@/lib/revision-suggestion-engine";
import { evaluateCaseStudyQuality } from "@/lib/case-study-quality-engine";
import { generateConstrainedCaseStudy } from "@/lib/constrained-generation-engine";
import { validateGenerationReadiness } from "@/lib/generation-readiness";
import { classifyArtifact, detectGaps, generateSections } from "@/lib/intelligence";
import { composeCaseStudyLayout } from "@/lib/layout-composition-engine";
import { mapArtifactRelationships } from "@/lib/relationship-engine";
import { orchestratePortfolioExperience } from "@/lib/portfolio-experience-orchestrator";
import { portfolioBelievabilityFindings } from "@/lib/portfolio-believability-checklist";
import { buildPortfolioSiteDraftFromPlan } from "@/lib/portfolio-builder-engine";
import { buildPortfolioStrategyPlan } from "@/lib/portfolio-planning-engine";
import { buildConfirmedPortfolioBlueprint } from "@/lib/portfolio-review-engine";
import { buildUnderstandingBacklog } from "@/lib/understanding-backlog";
import { buildValidationScorecard } from "@/lib/validation-scorecard";
import { recruiterReviewObservations } from "@/lib/recruiter-review-checklist";
import { classifyArtifactRecord } from "@/lib/server/classifier";
import { PortfolioBlueprintRecord, PortfolioBlueprintReviewState, ReviewDecisionStatus } from "@/lib/portfolio-blueprint-types";
import { PortfolioStrategyPlan } from "@/lib/portfolio-strategy-types";
import { Artifact, Confidence, ProjectCluster } from "@/lib/types";
import { PersonaValidationReport, PersonaValidationRun, ValidationFinding } from "@/lib/persona-validation-types";

const completedStages = [
  "Home",
  "Profile setup",
  "Evidence upload",
  "Parsing",
  "Classification",
  "Evidence graph",
  "Understanding backlog",
  "Portfolio strategy",
  "Blueprint review",
  "Generation readiness",
  "Case study generation",
  "Quality evaluation",
  "Revision loop",
  "Layout composition",
  "Portfolio orchestration",
  "Builder shell",
  "Preview preparation"
];

function confidenceFromScore(score: number): Confidence {
  if (score >= 75) return "High";
  if (score >= 52) return "Medium";
  return "Low";
}

function artifactFromSeed(pack: CanonicalPersonaPack, seed: CanonicalArtifactSeed): Artifact {
  const base = classifyArtifact(seed.fileName);
  const classification = classifyArtifactRecord({
    artifactId: seed.id,
    fileName: seed.fileName,
    fileType: seed.kind,
    mimeType: seed.mimeType,
    extractedText: seed.extractedText
  });
  const confidenceScore = Math.min(94, Math.round((classification.confidenceScore + seed.evidenceStrength) / 2));

  return {
    ...base,
    id: seed.id,
    userId: `canonical_${pack.id}`,
    name: seed.fileName,
    fileName: seed.fileName,
    kind: seed.kind,
    fileType: seed.kind,
    mimeType: seed.mimeType,
    sizeBytes: seed.extractedText.length * 18,
    uploadedAt: new Date("2026-05-21T12:00:00.000Z").toISOString(),
    updatedAt: new Date("2026-05-21T12:00:00.000Z").toISOString(),
    storagePath: `persona-packs/${pack.id}/${seed.fileName}`,
    storageUrl: "",
    storageKey: `persona-packs/${pack.id}/${seed.fileName}`,
    storageVisibility: "local-dev",
    status: seed.kind === "Image" || seed.kind === "Photo" ? "Visual Parsing Pending" : "Parsed",
    extractedContent: {
      id: `extracted_${seed.id}`,
      artifactId: seed.id,
      text: seed.extractedText,
      parser: "canonical-persona-pack",
      parserVersion: "step-023.11",
      createdAt: new Date("2026-05-21T12:00:00.000Z").toISOString()
    },
    classification,
    phase: seed.phase,
    confidence: confidenceFromScore(confidenceScore),
    confidenceScore,
    evidenceStrength: seed.evidenceStrength,
    extractedSignals: [...classification.tags, seed.expectedUse].slice(0, 10),
    suggestedPlacement: seed.phase === "Technical Implementation" ? "Technical credibility" : seed.phase,
    risk: confidenceScore < 52 ? "Needs human review before becoming a portfolio claim." : "Usable as source evidence with review.",
    sourceLabel: seed.fileName.replace(/\.[^/.]+$/, "")
  };
}

function reviewedClusters(clusters: ProjectCluster[]) {
  return clusters.map((cluster) => ({
    ...cluster,
    status: cluster.confidenceScore >= 62 ? "Confirmed" as const : "Needs Review" as const
  }));
}

function homepageToneFor(pack: CanonicalPersonaPack): PortfolioBlueprintReviewState["homepageTone"] {
  if (pack.persona === "UX Researcher" || pack.persona === "HCI Master's Student") return "Research";
  if (pack.persona === "Cloud/IT Hybrid" || pack.persona === "Technical UX Hybrid") return "Technical";
  return "Recruiter";
}

function defaultReviewState(plan: PortfolioStrategyPlan): PortfolioBlueprintReviewState {
  const mediaDecisions = Object.fromEntries(plan.mediaPlacements.map((placement) => [placement.id, "approved" as ReviewDecisionStatus]));
  const blockerDecisions = Object.fromEntries(plan.generationBlockers.map((blocker) => [blocker.id, blocker.severity === "Blocker" ? "skipped" : "resolved" as ReviewDecisionStatus]));

  return {
    approvedHomepage: true,
    pinnedFeaturedProjectId: plan.homepage.featuredProjectId,
    projectOrder: plan.projectRanking.map((project) => project.id),
    rejectedProjectIds: [],
    selectedHeroProofId: plan.homepage.strongestProofIds[0],
    selectedHeroVisualId: plan.homepage.strongestVisualIds[0],
    homepageTone: homepageToneFor({ persona: plan.persona } as CanonicalPersonaPack),
    archetypeOverride: plan.archetype,
    mediaDecisions,
    blockerDecisions,
    missingEvidenceNotes: Object.fromEntries(plan.missingEvidence.map((item) => [item, "Canonical validation keeps this visible unless source evidence exists."])),
    sectionNotes: {},
    updatedAt: new Date().toISOString()
  };
}

function blueprintRecord(pack: CanonicalPersonaPack, plan: PortfolioStrategyPlan, reviewState: PortfolioBlueprintReviewState): PortfolioBlueprintRecord {
  const blueprint = buildConfirmedPortfolioBlueprint(plan, reviewState);
  const now = new Date().toISOString();
  return {
    id: `canonical_blueprint_${pack.id}`,
    workspaceId: `canonical_workspace_${pack.id}`,
    userId: `canonical_user_${pack.id}`,
    version: 1,
    status: blueprint.status,
    archetype: blueprint.archetype,
    readinessScore: blueprint.readinessScore,
    blueprint,
    reviewState,
    provenanceRefs: blueprint.provenance,
    createdAt: now,
    updatedAt: now
  };
}

function pipelineFindings(input: {
  pack: CanonicalPersonaPack;
  artifacts: Artifact[];
  clusters: ProjectCluster[];
  plan: PortfolioStrategyPlan;
  blueprint: PortfolioBlueprintRecord;
  readiness: ReturnType<typeof validateGenerationReadiness>;
  reportScore: number;
}): ValidationFinding[] {
  const unknownClassifications = input.artifacts.filter((artifact) => artifact.classification?.classification === "unknown");
  const needsReviewClusters = input.clusters.filter((cluster) => cluster.status === "Needs Review");
  const topProject = input.plan.projectRanking[0];

  return [
    {
      id: "classification-unknown",
      category: "classification",
      severity: unknownClassifications.length ? "warning" : "pass",
      message: unknownClassifications.length ? `${unknownClassifications.length} artifact(s) remained unknown.` : "All artifacts received a usable classification.",
      recommendation: unknownClassifications.length ? "Ask the user to confirm or rename unknown artifacts." : "Continue deterministic classification before agent generation."
    },
    {
      id: "evidence-graph-review",
      category: "evidence-graph",
      severity: needsReviewClusters.length ? "warning" : "pass",
      message: needsReviewClusters.length ? `${needsReviewClusters.length} project cluster(s) still need review.` : "Project clusters were stable enough for validation.",
      recommendation: needsReviewClusters.length ? "Keep the cluster review step visible before generation." : "Use confirmed clusters as the trusted project graph."
    },
    {
      id: "project-prioritization",
      category: "planning",
      severity: topProject && topProject.readinessScore >= 50 ? "pass" : "warning",
      message: topProject ? `Top project is ${topProject.title} at ${topProject.readinessScore}% planning readiness.` : "No top project was identified.",
      recommendation: topProject ? "Validate whether the featured project is also the strongest recruiter proof." : "Collect more project evidence before planning."
    },
    {
      id: "generation-override-count",
      category: "generation",
      severity: input.blueprint.blueprint.skippedBlockerIds.length > 2 ? "warning" : "pass",
      message: `${input.blueprint.blueprint.skippedBlockerIds.length} blocker(s) were intentionally skipped to test draft generation.`,
      recommendation: "Skipped blockers must remain visible and must not become polished claims."
    },
    {
      id: "readiness-gate-result",
      category: "generation",
      severity: input.readiness.canGenerate ? "pass" : input.readiness.blockerCount ? "fail" : "warning",
      message: input.readiness.canGenerate
        ? "Generation readiness gate passed for this canonical pack."
        : `${input.readiness.issueCount} readiness issue(s) remain before unconstrained generation.`,
      recommendation: input.readiness.canGenerate
        ? "Proceed with constrained draft validation."
        : "Keep generation constrained and keep readiness issues visible to the user."
    },
    {
      id: "quality-threshold",
      category: "quality",
      severity: input.reportScore >= 68 ? "pass" : "warning",
      message: `Case study quality overall score is ${input.reportScore}/100.`,
      recommendation: input.reportScore >= 68 ? "Proceed to visual preview validation." : "Use revision loop before investing in publish rendering."
    }
  ];
}

function uxObservations(siteDraftGuardrails: string[]) {
  return [
    siteDraftGuardrails.length
      ? "Builder remains honest: unresolved guardrails stay visible instead of pretending the portfolio is ready."
      : "Builder can assemble the portfolio draft without guardrail warnings.",
    "Preview preparation is structurally possible, but visual rendering still needs Step 024 work.",
    "Blocked states remain part of the product contract for weak evidence."
  ];
}

function recommendations(report: PersonaValidationReport) {
  const items = [
    ...report.findings.filter((finding) => finding.severity !== "pass").map((finding) => finding.recommendation),
    ...report.qualityReport.revisionSuggestions.slice(0, 3).map((issue) => issue.suggestion)
  ];
  return Array.from(new Set(items)).slice(0, 8);
}

export function validatePersonaPack(pack: CanonicalPersonaPack): PersonaValidationReport {
  const artifacts = pack.artifacts.map((artifact) => artifactFromSeed(pack, artifact));
  const sections = generateSections(artifacts, pack.persona);
  const gaps = detectGaps(artifacts, sections);
  const relationshipMap = mapArtifactRelationships(artifacts);
  const clusters = reviewedClusters(relationshipMap.clusters);
  const backlog = buildUnderstandingBacklog({ artifacts, sections, gaps, clusters });
  const plan = buildPortfolioStrategyPlan({ persona: pack.persona, artifacts, sections, clusters, gaps, backlog });
  const reviewState = defaultReviewState(plan);
  const blueprint = blueprintRecord(pack, plan, reviewState);
  const readiness = validateGenerationReadiness({ workspaceId: blueprint.workspaceId, blueprint });
  const draft = generateConstrainedCaseStudy({ workspaceId: blueprint.workspaceId, blueprint, artifacts });
  const qualityReport = evaluateCaseStudyQuality(draft);
  const revisionTarget = qualityReport.weakSections[0] ?? draft.sections.find((section) => section.editable)?.id ?? "overview";
  const revision = buildSectionRevision({
    workspaceId: blueprint.workspaceId,
    draft,
    qualityReport,
    sectionId: revisionTarget,
    goal: suggestedRevisionGoal(draft, qualityReport, revisionTarget),
    actorId: "canonical-validator"
  });
  const composition = composeCaseStudyLayout({ workspaceId: blueprint.workspaceId, draft, qualityReport });
  const experiencePlan = orchestratePortfolioExperience({ workspaceId: blueprint.workspaceId, blueprint, compositions: [composition], artifacts });
  const siteDraft = buildPortfolioSiteDraftFromPlan({
    workspaceId: blueprint.workspaceId,
    experiencePlan,
    compositions: [composition],
    caseStudyDraft: draft,
    blueprint
  });
  const findings = [
    ...pipelineFindings({ pack, artifacts, clusters, plan, blueprint, readiness, reportScore: qualityReport.scores.overall }),
    ...portfolioBelievabilityFindings({ draft, siteDraft }),
    {
      id: "revision-loop-created",
      category: "revision" as const,
      severity: revision.revisedContent !== revision.originalContent ? "pass" as const : "warning" as const,
      message: `Revision loop proposed a ${revision.goal} update for ${revision.sectionId}.`,
      recommendation: "Keep section-level review before full portfolio generation."
    }
  ];
  const reportWithoutScorecard = {
    personaId: pack.id,
    title: pack.title,
    completedStages,
    uploadedArtifacts: artifacts.map((artifact) => ({
      id: artifact.id,
      fileName: artifact.fileName ?? artifact.name,
      classification: artifact.classification?.classification ?? "unknown",
      confidenceScore: artifact.confidenceScore,
      expectedUse: pack.artifacts.find((seed) => seed.id === artifact.id)?.expectedUse ?? "portfolio evidence"
    })),
    artifacts,
    relationships: relationshipMap.relationships,
    clusters,
    gaps,
    backlog,
    plan,
    blueprint,
    readinessState: readiness.state,
    readinessGate: readiness,
    caseStudyDraft: draft,
    qualityReport,
    revision,
    composition,
    experiencePlan,
    siteDraft,
    findings,
    recruiterObservations: recruiterReviewObservations({ plan, qualityReport, experiencePlan }),
    uxObservations: uxObservations(siteDraft.guardrails),
    improvementRecommendations: [] as string[]
  };
  const scorecard = buildValidationScorecard(reportWithoutScorecard);
  const report = { ...reportWithoutScorecard, scorecard };
  return {
    ...report,
    improvementRecommendations: recommendations(report)
  };
}

export function runCanonicalPersonaValidation(): PersonaValidationRun {
  const reports = canonicalPersonaPacks.map(validatePersonaPack);
  const failedCount = reports.filter((report) => report.scorecard.status === "failed").length;
  const needsAttentionCount = reports.filter((report) => report.scorecard.status === "needs attention").length;
  const validatedCount = reports.filter((report) => report.scorecard.status === "validated").length;
  const criticalFindings = reports.flatMap((report) => report.findings).filter((finding) => finding.severity === "fail").length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      personaCount: reports.length,
      validatedCount,
      needsAttentionCount,
      failedCount,
      averageOverallScore: Math.round(reports.reduce((sum, report) => sum + report.scorecard.overall, 0) / reports.length),
      criticalFindings
    },
    reports
  };
}
