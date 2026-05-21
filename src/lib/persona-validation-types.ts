import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { CaseStudyQualityReport } from "@/lib/case-study-quality-types";
import { CaseStudyRevisionRecord } from "@/lib/case-study-revision-types";
import { CanonicalPersonaPackId } from "@/lib/canonical-persona-packs";
import { GenerationReadinessResult } from "@/lib/generation-readiness";
import { PortfolioBlueprintRecord } from "@/lib/portfolio-blueprint-types";
import { PortfolioExperiencePlan } from "@/lib/portfolio-experience-types";
import { PortfolioPageComposition } from "@/lib/layout-composition-types";
import { PortfolioSiteDraft } from "@/lib/portfolio-site-draft-types";
import { PortfolioStrategyPlan } from "@/lib/portfolio-strategy-types";
import { Artifact, ArtifactRelationship, Gap, ProjectCluster, UnderstandingBacklogItem } from "@/lib/types";

export type ValidationFindingSeverity = "pass" | "warning" | "fail";

export type ValidationFinding = {
  id: string;
  severity: ValidationFindingSeverity;
  category:
    | "parsing"
    | "classification"
    | "evidence-graph"
    | "planning"
    | "generation"
    | "quality"
    | "revision"
    | "layout"
    | "orchestration"
    | "builder"
    | "recruiter"
    | "ux";
  message: string;
  recommendation: string;
};

export type ValidationScorecard = {
  pipelineCompletion: number;
  evidenceIntegrity: number;
  recruiterReadability: number;
  archetypeAlignment: number;
  resilience: number;
  builderCoherence: number;
  overall: number;
  status: "validated" | "needs attention" | "failed";
};

export type PersonaValidationReport = {
  personaId: CanonicalPersonaPackId;
  title: string;
  completedStages: string[];
  uploadedArtifacts: Array<{
    id: string;
    fileName: string;
    classification: string;
    confidenceScore: number;
    expectedUse: string;
  }>;
  artifacts: Artifact[];
  relationships: ArtifactRelationship[];
  clusters: ProjectCluster[];
  gaps: Gap[];
  backlog: UnderstandingBacklogItem[];
  plan: PortfolioStrategyPlan;
  blueprint: PortfolioBlueprintRecord;
  readinessState: string;
  readinessGate: GenerationReadinessResult;
  caseStudyDraft: GeneratedCaseStudyDraft;
  qualityReport: CaseStudyQualityReport;
  revision: CaseStudyRevisionRecord;
  composition: PortfolioPageComposition;
  experiencePlan: PortfolioExperiencePlan;
  siteDraft: PortfolioSiteDraft;
  findings: ValidationFinding[];
  recruiterObservations: string[];
  uxObservations: string[];
  improvementRecommendations: string[];
  scorecard: ValidationScorecard;
};

export type PersonaValidationRun = {
  generatedAt: string;
  summary: {
    personaCount: number;
    validatedCount: number;
    needsAttentionCount: number;
    failedCount: number;
    averageOverallScore: number;
    criticalFindings: number;
  };
  reports: PersonaValidationReport[];
};
