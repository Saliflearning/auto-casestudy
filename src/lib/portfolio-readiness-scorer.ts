import { CaseStudyQualityIssue, CaseStudyReadinessState } from "@/lib/case-study-quality-types";

export function readinessFromScore(score: number, issues: CaseStudyQualityIssue[]): CaseStudyReadinessState {
  if (issues.some((issue) => issue.severity === "blocker") || score < 45) return "weak";
  if (score < 70 || issues.some((issue) => issue.severity === "major")) return "needs revision";
  if (score < 88) return "strong draft";
  return "publish-ready";
}

export function publishRiskFromReadiness(readiness: CaseStudyReadinessState) {
  if (readiness === "weak") return "high";
  if (readiness === "needs revision") return "medium";
  return "low";
}
