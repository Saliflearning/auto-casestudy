import { GenerationBlocker, RankedProjectPlan } from "@/lib/portfolio-strategy-types";
import { UnderstandingBacklogItem } from "@/lib/types";

export function evaluatePortfolioReadiness(input: {
  projects: RankedProjectPlan[];
  blockers: GenerationBlocker[];
  backlog: UnderstandingBacklogItem[];
  missingEvidenceCount: number;
}) {
  const strongestProject = input.projects[0]?.readinessScore ?? 0;
  const averageProjectReadiness = input.projects.length
    ? Math.round(input.projects.reduce((sum, project) => sum + project.readinessScore, 0) / input.projects.length)
    : 0;
  const blockerPenalty = input.blockers.filter((blocker) => blocker.severity === "Blocker").length * 14;
  const warningPenalty = input.blockers.filter((blocker) => blocker.severity === "Warning").length * 6;
  const unresolvedBacklogPenalty = input.backlog.filter((item) => item.status === "Blocked" || item.status === "Needs evidence").length * 5;
  const missingPenalty = input.missingEvidenceCount * 4;
  const score = Math.max(0, Math.min(96, Math.round((strongestProject + averageProjectReadiness) / 2 - blockerPenalty - warningPenalty - unresolvedBacklogPenalty - missingPenalty)));

  return {
    score,
    label:
      score < 45
        ? "Blocked"
        : score < 68
          ? "Needs Evidence"
          : score < 84
            ? "Ready for Draft Planning"
            : "Ready for Generation"
  } as const;
}
