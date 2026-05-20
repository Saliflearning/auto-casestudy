import { PortfolioArchetype } from "@/lib/portfolio-strategy-types";

export type CaseStudyQualityCategory =
  | "structure"
  | "evidence"
  | "recruiter"
  | "archetype"
  | "writing"
  | "media";

export type CaseStudyReadinessState = "weak" | "needs revision" | "strong draft" | "publish-ready";

export type CaseStudyQualityIssue = {
  id: string;
  category: CaseStudyQualityCategory;
  severity: "blocker" | "major" | "minor";
  message: string;
  sectionId?: string;
  suggestion: string;
};

export type CaseStudyQualityReport = {
  id: string;
  workspaceId: string;
  caseStudyDraftId: string;
  projectId: string;
  archetype: PortfolioArchetype;
  scores: {
    structural: number;
    evidence: number;
    recruiter: number;
    archetype: number;
    writing: number;
    media: number;
    overall: number;
  };
  readiness: CaseStudyReadinessState;
  publishRisk: "high" | "medium" | "low";
  confidenceScore: number;
  blockers: CaseStudyQualityIssue[];
  revisionSuggestions: CaseStudyQualityIssue[];
  weakSections: string[];
  unsupportedClaims: string[];
  provenanceGaps: string[];
  evaluatedAt: string;
};

export type QualityCategoryResult = {
  score: number;
  issues: CaseStudyQualityIssue[];
};
