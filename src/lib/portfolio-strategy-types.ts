import { Persona } from "@/lib/types";

export type PortfolioArchetype =
  | "UX Research"
  | "Product Design"
  | "Technical UX Hybrid"
  | "Academic Research"
  | "Cloud/Technical"
  | "Recruiter-Optimized";

export type ProvenanceReference = {
  artifactId?: string;
  clusterId?: string;
  label: string;
  reason: string;
};

export type HomepageStrategy = {
  positioning: string;
  featuredProjectId?: string;
  featuredProjectTitle: string;
  heroCandidates: string[];
  strongestProofIds: string[];
  strongestVisualIds: string[];
  reasoning: string;
  evidence: ProvenanceReference[];
};

export type RankedProjectPlan = {
  id: string;
  title: string;
  rank: number;
  readinessScore: number;
  recruiterValue: "High" | "Medium" | "Low";
  evidenceQuality: number;
  visualStrength: number;
  researchDepth: number;
  technicalDepth: number;
  completeness: number;
  reasoning: string;
  artifactIds: string[];
  blockers: string[];
};

export type CaseStudyPlan = {
  projectId: string;
  title: string;
  archetype: PortfolioArchetype;
  sectionOrder: string[];
  missingSections: string[];
  strongestVisualIds: string[];
  weakClaims: string[];
  unsupportedMetrics: string[];
  evidence: ProvenanceReference[];
};

export type MediaPlacementSuggestion = {
  id: string;
  artifactId: string;
  label: string;
  placement: "Homepage hero" | "Project card" | "Case study hero" | "Research section" | "Process timeline" | "Technical sidebar" | "Gallery";
  reason: string;
};

export type GenerationBlocker = {
  id: string;
  severity: "Blocker" | "Warning";
  title: string;
  detail: string;
  followUpQuestion: string;
  evidence: ProvenanceReference[];
};

export type PortfolioStrategyPlan = {
  archetype: PortfolioArchetype;
  persona: Persona;
  readinessScore: number;
  readinessLabel: "Blocked" | "Needs Evidence" | "Ready for Draft Planning" | "Ready for Generation";
  homepage: HomepageStrategy;
  projectRanking: RankedProjectPlan[];
  caseStudies: CaseStudyPlan[];
  mediaPlacements: MediaPlacementSuggestion[];
  missingEvidence: string[];
  generationBlockers: GenerationBlocker[];
  recruiterValueReasoning: string[];
  provenance: ProvenanceReference[];
  nextReviewActions: string[];
};
