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

export type PortfolioBlueprintRecord = {
  id: string;
  workspaceId: string;
  userId: string;
  version: number;
  status: ConfirmedPortfolioBlueprint["status"];
  archetype: ConfirmedPortfolioBlueprint["archetype"];
  readinessScore: number;
  blueprint: ConfirmedPortfolioBlueprint;
  reviewState: PortfolioBlueprintReviewState;
  provenanceRefs: ProvenanceReference[];
  createdAt: string;
  updatedAt: string;
};

export type PortfolioBlueprintRevisionRecord = {
  id: string;
  blueprintId: string;
  workspaceId: string;
  version: number;
  snapshot: ConfirmedPortfolioBlueprint;
  reviewState: PortfolioBlueprintReviewState;
  changeSummary: string;
  createdAt: string;
  createdBy?: string;
};

export type BlueprintAuditEventRecord = {
  id: string;
  workspaceId: string;
  blueprintId?: string;
  revisionId?: string;
  actorId?: string;
  action:
    | "BLUEPRINT_SAVED"
    | "BLUEPRINT_ROLLED_BACK"
    | "GENERATION_READINESS_CHECKED"
    | "GENERATION_BLOCKED"
    | "CASE_STUDY_GENERATED"
    | "CASE_STUDY_EVALUATED";
  before?: unknown;
  after?: unknown;
  createdAt: string;
  source: "portfolio-review-workspace" | "api";
};
