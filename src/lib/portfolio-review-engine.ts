import { ConfirmedPortfolioBlueprint, PortfolioBlueprintReviewState } from "@/lib/portfolio-blueprint-types";
import { PortfolioStrategyPlan } from "@/lib/portfolio-strategy-types";

function orderedProjects(plan: PortfolioStrategyPlan, review: PortfolioBlueprintReviewState) {
  const projectIds = plan.projectRanking.map((project) => project.id);
  const ordered = [
    ...review.projectOrder.filter((id) => projectIds.includes(id)),
    ...projectIds.filter((id) => !review.projectOrder.includes(id))
  ].filter((id) => !review.rejectedProjectIds.includes(id));

  if (review.pinnedFeaturedProjectId && ordered.includes(review.pinnedFeaturedProjectId)) {
    return [review.pinnedFeaturedProjectId, ...ordered.filter((id) => id !== review.pinnedFeaturedProjectId)];
  }

  return ordered;
}

function readinessFromReview(plan: PortfolioStrategyPlan, review: PortfolioBlueprintReviewState, unresolvedBlockerIds: string[]) {
  const rejectedPenalty = review.rejectedProjectIds.length * 5;
  const unresolvedPenalty = unresolvedBlockerIds.length * 12;
  const homepagePenalty = review.approvedHomepage ? 0 : 8;
  return Math.max(0, Math.min(96, plan.readinessScore - rejectedPenalty - unresolvedPenalty - homepagePenalty));
}

export function buildConfirmedPortfolioBlueprint(plan: PortfolioStrategyPlan, review: PortfolioBlueprintReviewState): ConfirmedPortfolioBlueprint {
  const resolvedBlockerIds = plan.generationBlockers
    .filter((blocker) => review.blockerDecisions[blocker.id] === "resolved")
    .map((blocker) => blocker.id);
  const skippedBlockerIds = plan.generationBlockers
    .filter((blocker) => review.blockerDecisions[blocker.id] === "skipped")
    .map((blocker) => blocker.id);
  const unresolvedBlockerIds = plan.generationBlockers
    .filter((blocker) => !resolvedBlockerIds.includes(blocker.id) && !skippedBlockerIds.includes(blocker.id))
    .map((blocker) => blocker.id);
  const readinessScore = readinessFromReview(plan, review, unresolvedBlockerIds);
  const approvedProjectOrder = orderedProjects(plan, review);
  const approvedVisualIds = plan.mediaPlacements
    .filter((placement) => review.mediaDecisions[placement.id] === "approved")
    .map((placement) => placement.artifactId);
  const privateVisualIds = plan.mediaPlacements
    .filter((placement) => review.mediaDecisions[placement.id] === "private")
    .map((placement) => placement.artifactId);
  const rejectedVisualIds = plan.mediaPlacements
    .filter((placement) => review.mediaDecisions[placement.id] === "rejected")
    .map((placement) => placement.artifactId);

  const canGenerate = review.approvedHomepage && approvedProjectOrder.length > 0 && unresolvedBlockerIds.length === 0;

  return {
    id: "confirmed_portfolio_blueprint",
    status: canGenerate ? "Approved For Generation" : review.approvedHomepage ? "Approved With Blockers" : "Draft Review",
    archetype: review.archetypeOverride ?? plan.archetype,
    approvedHomepageStrategy: {
      approved: review.approvedHomepage,
      featuredProjectId: review.pinnedFeaturedProjectId ?? plan.homepage.featuredProjectId,
      heroProofId: review.selectedHeroProofId ?? plan.homepage.strongestProofIds[0],
      heroVisualId: review.selectedHeroVisualId ?? plan.homepage.strongestVisualIds[0],
      tone: review.homepageTone,
      positioning: plan.homepage.positioning
    },
    approvedProjectOrder,
    rejectedProjectIds: review.rejectedProjectIds,
    approvedVisualIds,
    privateVisualIds,
    rejectedVisualIds,
    approvedCaseStudyStructures: plan.caseStudies.filter((caseStudy) => approvedProjectOrder.includes(caseStudy.projectId)),
    resolvedBlockerIds,
    unresolvedBlockerIds,
    skippedBlockerIds,
    recruiterStrategy: plan.recruiterValueReasoning,
    userOverrides: review,
    provenance: plan.provenance,
    readinessScore,
    readinessLabel:
      readinessScore < 45
        ? "Blocked"
        : readinessScore < 68
          ? "Needs Evidence"
          : readinessScore < 84
            ? "Ready for Draft Planning"
            : "Ready for Generation",
    generatedFromPlanAt: new Date().toISOString()
  };
}
