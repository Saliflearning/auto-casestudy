import { PortfolioArchetype, PortfolioStrategyPlan, ProvenanceReference } from "@/lib/portfolio-strategy-types";

export type ReviewDecisionStatus = "approved" | "rejected" | "private" | "resolved" | "skipped";

export type PortfolioBlueprintReviewState = {
  approvedHomepage: boolean;
  pinnedFeaturedProjectId?: string;
  projectOrder: string[];
  rejectedProjectIds: string[];
  selectedHeroProofId?: string;
  selectedHeroVisualId?: string;
  homepageTone: "Recruiter" | "Research" | "Technical" | "Academic";
  archetypeOverride?: PortfolioArchetype;
  mediaDecisions: Record<string, ReviewDecisionStatus>;
  blockerDecisions: Record<string, ReviewDecisionStatus>;
  missingEvidenceNotes: Record<string, string>;
  sectionNotes: Record<string, string>;
  updatedAt?: string;
};

export type ConfirmedPortfolioBlueprint = {
  id: string;
  status: "Draft Review" | "Approved With Blockers" | "Approved For Generation";
  archetype: PortfolioArchetype;
  approvedHomepageStrategy: {
    approved: boolean;
    featuredProjectId?: string;
    heroProofId?: string;
    heroVisualId?: string;
    tone: PortfolioBlueprintReviewState["homepageTone"];
    positioning: string;
  };
  approvedProjectOrder: string[];
  rejectedProjectIds: string[];
  approvedVisualIds: string[];
  privateVisualIds: string[];
  rejectedVisualIds: string[];
  approvedCaseStudyStructures: PortfolioStrategyPlan["caseStudies"];
  resolvedBlockerIds: string[];
  unresolvedBlockerIds: string[];
  skippedBlockerIds: string[];
  recruiterStrategy: string[];
  userOverrides: PortfolioBlueprintReviewState;
  provenance: ProvenanceReference[];
  readinessScore: number;
  readinessLabel: PortfolioStrategyPlan["readinessLabel"];
  generatedFromPlanAt: string;
};
