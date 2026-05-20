import { PortfolioArchetype, ProvenanceReference } from "@/lib/portfolio-strategy-types";

export type CaseStudySectionConfidence = "confirmed" | "inferred" | "missing-evidence";

export type GeneratedCaseStudySection = {
  id: string;
  title: string;
  type: "overview" | "role" | "timeline" | "problem" | "research" | "insights" | "decisions" | "solution" | "outcomes" | "reflection" | "technical";
  content: string;
  confidence: CaseStudySectionConfidence;
  editable: boolean;
  evidenceIds: string[];
  provenance: ProvenanceReference[];
  missingEvidence: string[];
  unsupportedClaims: string[];
};

export type GeneratedCaseStudyMedia = {
  id: string;
  artifactId: string;
  placement: "hero" | "research" | "process" | "solution" | "technical" | "gallery";
  caption: string;
  provenance: ProvenanceReference[];
  private: boolean;
};

export type GeneratedCaseStudyDraft = {
  id: string;
  workspaceId: string;
  blueprintId: string;
  blueprintVersion: number;
  projectId: string;
  title: string;
  archetype: PortfolioArchetype;
  status: "Draft" | "Blocked";
  sections: GeneratedCaseStudySection[];
  media: GeneratedCaseStudyMedia[];
  unresolvedIssues: string[];
  generationNotes: string[];
  provenance: ProvenanceReference[];
  createdAt: string;
  updatedAt: string;
};
