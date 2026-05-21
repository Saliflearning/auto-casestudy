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
    issues.push(issue("missing-persisted-blueprint", "blocker", "blueprint", "Complete and save your portfolio plan before generating pages."));
  } else {
    const approved = blueprint.blueprint;
    if (!approved.approvedHomepageStrategy.approved) {
      issues.push(issue("homepage-not-approved", "blocker", "blueprint", "Approve the homepage direction before generating pages."));
    }
    if (!approved.approvedHomepageStrategy.featuredProjectId) {
      issues.push(issue("missing-featured-project", "blocker", "blueprint", "Choose a featured project for the homepage."));
    }
    if (!approved.approvedHomepageStrategy.heroProofId) {
      issues.push(issue("missing-hero-proof", "blocker", "evidence", "Choose the strongest proof to support the homepage headline."));
    }
    if (!approved.approvedProjectOrder.length) {
      issues.push(issue("missing-project-order", "blocker", "blueprint", "Approve the project order before generating pages."));
    }
    if (approved.unresolvedBlockerIds.length) {
      issues.push(issue("unresolved-blockers", "blocker", "evidence", `${approved.unresolvedBlockerIds.length} portfolio issue(s) still need attention.`));
    }
    if (!approved.provenance.length) {
      issues.push(issue("missing-provenance", "blocker", "provenance", "No source links are attached to the portfolio plan."));
    }
    if (!approved.approvedVisualIds.length && !approved.approvedHomepageStrategy.heroVisualId) {
      issues.push(issue("missing-approved-visuals", "warning", "media", "No approved visuals are available for the portfolio."));
    }
    if (approved.readinessScore < 68) {
      issues.push(issue("low-readiness-score", approved.readinessScore < 45 ? "blocker" : "warning", "blueprint", `Portfolio readiness is ${approved.readinessScore}%, below the quality target.`));
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
