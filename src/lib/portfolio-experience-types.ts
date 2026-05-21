import { PortfolioArchetype, ProvenanceReference } from "@/lib/portfolio-strategy-types";

export type PortfolioExperienceStatus = "Draft" | "Needs Evidence" | "Ready for Assembly";

export type HomepageExperienceStrategy = {
  headline: string;
  subheadline: string;
  featuredProjectId?: string;
  featuredProof: string[];
  heroVisualId?: string;
  credibilityHierarchy: string[];
  ctaStrategy: string[];
  provenance: ProvenanceReference[];
  warnings: string[];
};

export type ProjectSequenceItem = {
  projectId: string;
  title: string;
  role: "featured" | "supporting" | "hold";
  order: number;
  recruiterValue: "high" | "medium" | "low";
  rhythmRole: "anchor" | "contrast" | "proof" | "defer";
  rationale: string;
  evidenceCount: number;
  warnings: string[];
};

export type NavigationItemPlan = {
  id: string;
  label: string;
  destination: string;
  priority: "primary" | "secondary" | "utility";
  mobileBehavior: "top-level" | "collapsed" | "footer";
  rationale: string;
};

export type RecruiterJourneyStep = {
  id: string;
  label: string;
  expectedQuestion: string;
  portfolioAnswer: string;
  targetPage: string;
  proofType: "identity" | "project" | "skills" | "evidence" | "contact";
};

export type VisualRhythmStrategy = {
  density: "calm" | "balanced" | "immersive";
  mediaPacing: string;
  layoutVariation: string[];
  repetitionRisks: string[];
  score: number;
};

export type PortfolioExperiencePlan = {
  id: string;
  workspaceId: string;
  blueprintId?: string;
  sourceCompositionIds: string[];
  archetype: PortfolioArchetype;
  status: PortfolioExperienceStatus;
  homepage: HomepageExperienceStrategy;
  projectSequence: ProjectSequenceItem[];
  navigation: NavigationItemPlan[];
  recruiterJourney: RecruiterJourneyStep[];
  visualRhythm: VisualRhythmStrategy;
  archetypeStrategy: string[];
  consistency: {
    tone: string;
    sectionLogic: string[];
    ctaPattern: string;
    identityWarnings: string[];
  };
  responsive: {
    desktop: string[];
    tablet: string[];
    mobile: string[];
  };
  unresolvedWarnings: string[];
  createdAt: string;
  updatedAt: string;
};
