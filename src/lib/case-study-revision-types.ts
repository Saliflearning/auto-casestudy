import { ProvenanceReference } from "@/lib/portfolio-strategy-types";

export type RevisionGoal =
  | "recruiter readability"
  | "stronger storytelling"
  | "better clarity"
  | "better structure"
  | "less AI-sounding language"
  | "stronger outcomes"
  | "stronger technical depth"
  | "archetype alignment";

export type CaseStudyRevisionStatus = "Proposed" | "Accepted" | "Rejected";

export type RevisionQualityDelta = {
  beforeScore: number;
  afterScore: number;
  delta: number;
  rationale: string;
};

export type CaseStudyRevisionRecord = {
  id: string;
  workspaceId: string;
  draftId: string;
  sectionId: string;
  status: CaseStudyRevisionStatus;
  goal: RevisionGoal;
  originalContent: string;
  revisedContent: string;
  changeSummary: string[];
  qualityDelta: RevisionQualityDelta;
  provenance: ProvenanceReference[];
  unsupportedWarnings: string[];
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  actorId?: string;
};
