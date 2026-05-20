import { PortfolioBlueprintRecord } from "@/lib/portfolio-blueprint-types";

export type GenerationReadinessState = "blocked" | "needs-review" | "ready-for-generation";

export type GenerationReadinessIssue = {
  id: string;
  severity: "blocker" | "warning";
  message: string;
  source: "workspace" | "blueprint" | "provenance" | "media" | "evidence";
};

export type GenerationReadinessResult = {
  state: GenerationReadinessState;
  canGenerate: boolean;
  score: number;
  issueCount: number;
  blockerCount: number;
  warningCount: number;
  issues: GenerationReadinessIssue[];
  blueprintVersion?: number;
  workspaceId: string;
  validatedAt: string;
};

function issue(id: string, severity: GenerationReadinessIssue["severity"], source: GenerationReadinessIssue["source"], message: string): GenerationReadinessIssue {
  return { id, severity, source, message };
}

export function validateGenerationReadiness(input: { workspaceId: string; blueprint: PortfolioBlueprintRecord | null }): GenerationReadinessResult {
  const issues: GenerationReadinessIssue[] = [];
  const { blueprint } = input;

  if (!blueprint) {
    issues.push(issue("missing-persisted-blueprint", "blocker", "blueprint", "No persisted confirmed blueprint exists for this workspace."));
  } else {
    const approved = blueprint.blueprint;
    if (!approved.approvedHomepageStrategy.approved) {
      issues.push(issue("homepage-not-approved", "blocker", "blueprint", "Homepage strategy has not been approved."));
    }
    if (!approved.approvedHomepageStrategy.featuredProjectId) {
      issues.push(issue("missing-featured-project", "blocker", "blueprint", "No approved featured project is selected."));
    }
    if (!approved.approvedHomepageStrategy.heroProofId) {
      issues.push(issue("missing-hero-proof", "blocker", "evidence", "Homepage hero proof is missing."));
    }
    if (!approved.approvedProjectOrder.length) {
      issues.push(issue("missing-project-order", "blocker", "blueprint", "No approved project order exists."));
    }
    if (approved.unresolvedBlockerIds.length) {
      issues.push(issue("unresolved-blockers", "blocker", "evidence", `${approved.unresolvedBlockerIds.length} generation blocker(s) remain unresolved.`));
    }
    if (!approved.provenance.length) {
      issues.push(issue("missing-provenance", "blocker", "provenance", "No provenance references are attached to the blueprint."));
    }
    if (!approved.approvedVisualIds.length && !approved.approvedHomepageStrategy.heroVisualId) {
      issues.push(issue("missing-approved-visuals", "warning", "media", "No approved visuals are available for portfolio generation."));
    }
    if (approved.readinessScore < 68) {
      issues.push(issue("low-readiness-score", approved.readinessScore < 45 ? "blocker" : "warning", "blueprint", `Blueprint readiness is ${approved.readinessScore}%, below the generation threshold.`));
    }
  }

  const blockerCount = issues.filter((item) => item.severity === "blocker").length;
  const warningCount = issues.length - blockerCount;
  const score = blueprint?.readinessScore ?? 0;
  const state: GenerationReadinessState = blockerCount ? "blocked" : warningCount ? "needs-review" : "ready-for-generation";

  return {
    state,
    canGenerate: state === "ready-for-generation",
    score,
    issueCount: issues.length,
    blockerCount,
    warningCount,
    issues,
    blueprintVersion: blueprint?.version,
    workspaceId: input.workspaceId,
    validatedAt: new Date().toISOString()
  };
}
