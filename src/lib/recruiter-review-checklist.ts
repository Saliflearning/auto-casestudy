import { CaseStudyQualityReport } from "@/lib/case-study-quality-types";
import { PortfolioExperiencePlan } from "@/lib/portfolio-experience-types";
import { PortfolioStrategyPlan } from "@/lib/portfolio-strategy-types";

export function recruiterReviewObservations(input: {
  plan: PortfolioStrategyPlan;
  qualityReport: CaseStudyQualityReport;
  experiencePlan: PortfolioExperiencePlan;
}) {
  const observations: string[] = [];
  const topProject = input.plan.projectRanking[0];

  if (topProject) {
    observations.push(`Strongest project opens first: ${topProject.title} is ranked #${topProject.rank} with ${topProject.recruiterValue.toLowerCase()} recruiter value.`);
  } else {
    observations.push("No clear featured project was available for recruiter scanning.");
  }

  observations.push(`Case study recruiter readability scored ${input.qualityReport.scores.recruiter}/100.`);
  observations.push(`Portfolio journey role: ${input.experiencePlan.projectSequence[0]?.role ?? "missing featured project"}.`);

  if (input.qualityReport.unsupportedClaims.length) {
    observations.push("Unsupported claims remain visible instead of being polished into fake impact.");
  }

  if (input.qualityReport.readiness === "weak" || input.qualityReport.readiness === "needs revision") {
    observations.push("Recruiter-facing output needs revision before it can be considered portfolio-ready.");
  }

  return observations;
}
