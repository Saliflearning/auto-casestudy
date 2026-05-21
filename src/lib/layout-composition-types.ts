import { GeneratedCaseStudySection } from "@/lib/case-study-generation-types";
import { CaseStudyReadinessState } from "@/lib/case-study-quality-types";
import { PortfolioArchetype, ProvenanceReference } from "@/lib/portfolio-strategy-types";

export type LayoutViewport = "desktop" | "tablet" | "mobile";

export type LayoutRegionKind =
  | "hero"
  | "summary"
  | "problem"
  | "process"
  | "decision"
  | "media"
  | "technical"
  | "outcomes"
  | "reflection"
  | "evidence-warning";

export type LayoutDensity = "compact" | "balanced" | "immersive";

export type LayoutVariant =
  | "narrative-stack"
  | "split-proof"
  | "process-timeline"
  | "media-gallery"
  | "technical-rail"
  | "warning-callout";

export type ResponsiveRegionPlan = {
  regionId: string;
  order: number;
  columnSpan: number;
  rowSpan: number;
  emphasis: "primary" | "secondary" | "supporting" | "guardrail";
};

export type ResponsiveLayoutPlan = {
  viewport: LayoutViewport;
  columns: number;
  rhythm: "stacked" | "split" | "magazine" | "rail";
  regions: ResponsiveRegionPlan[];
  notes: string[];
};

export type ComposedMediaPlacement = {
  id: string;
  artifactId: string;
  regionId: string;
  placement: "hero" | "inline" | "gallery" | "aside" | "warning";
  caption: string;
  altText: string;
  provenance: ProvenanceReference[];
  private: boolean;
  rationale: string;
};

export type SectionHierarchyItem = {
  id: string;
  title: string;
  type: GeneratedCaseStudySection["type"];
  regionKind: LayoutRegionKind;
  level: 1 | 2 | 3;
  order: number;
  evidenceCount: number;
  warningCount: number;
};

export type LayoutRegion = {
  id: string;
  kind: LayoutRegionKind;
  title: string;
  variant: LayoutVariant;
  density: LayoutDensity;
  sourceSectionIds: string[];
  contentSummary: string;
  evidenceCount: number;
  warnings: string[];
  provenance: ProvenanceReference[];
  mediaIds: string[];
  rationale: string;
  editable: boolean;
};

export type PortfolioPageComposition = {
  id: string;
  workspaceId: string;
  draftId: string;
  projectId: string;
  title: string;
  archetype: PortfolioArchetype;
  status: "Composed" | "Needs Evidence";
  readiness: CaseStudyReadinessState | "not evaluated";
  regions: LayoutRegion[];
  responsivePlan: Record<LayoutViewport, ResponsiveLayoutPlan>;
  mediaPlacements: ComposedMediaPlacement[];
  hierarchy: SectionHierarchyItem[];
  rationale: string[];
  archetypeStrategy: string[];
  visualRhythm: {
    score: number;
    density: LayoutDensity;
    notes: string[];
  };
  provenance: ProvenanceReference[];
  unresolvedWarnings: string[];
  createdAt: string;
  updatedAt: string;
};
