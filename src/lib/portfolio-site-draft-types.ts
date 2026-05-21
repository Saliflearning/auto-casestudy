import { ProvenanceReference } from "@/lib/portfolio-strategy-types";

export type PortfolioBuilderDevice = "desktop" | "tablet" | "mobile";

export type PortfolioThemeSettings = {
  typography: "clean sans" | "editorial" | "technical mono";
  spacing: "compact" | "comfortable" | "spacious";
  colorMood: "instrument dark" | "recruiter light" | "warm editorial";
  appearance: "dark" | "light";
  buttonStyle: "solid" | "outline" | "soft";
};

export type HomepageDraftBlock = {
  headline: string;
  subtitle: string;
  featuredProjectId?: string;
  proofBlocks: string[];
  projectPreviewOrder: string[];
  ctaLabels: {
    primary: string;
    secondary: string;
  };
  provenance: ProvenanceReference[];
  warnings: string[];
};

export type NavigationDraftItem = {
  id: string;
  label: string;
  destination: string;
  visible: boolean;
  order: number;
  priority: "primary" | "secondary" | "utility";
};

export type BuilderSectionBlock = {
  id: string;
  sourceRegionId: string;
  sourceSectionIds: string[];
  title: string;
  visible: boolean;
  locked: boolean;
  needsRevision: boolean;
  order: number;
  kind: string;
  provenance: ProvenanceReference[];
  warnings: string[];
};

export type BuilderMediaAssignment = {
  id: string;
  artifactId: string;
  sourceMediaId: string;
  regionId: string;
  placement: "hero" | "inline" | "gallery" | "aside" | "warning";
  caption: string;
  visible: boolean;
  private: boolean;
  provenance: ProvenanceReference[];
};

export type ProjectPageDraft = {
  projectId: string;
  title: string;
  compositionId?: string;
  role: "featured" | "supporting" | "hold";
  sectionBlocks: BuilderSectionBlock[];
  mediaAssignments: BuilderMediaAssignment[];
  provenance: ProvenanceReference[];
  warnings: string[];
};

export type PortfolioSiteDraft = {
  id: string;
  workspaceId: string;
  sourceExperiencePlanId?: string;
  sourceCompositionIds: string[];
  sourceDraftId?: string;
  blueprintId?: string;
  status: "Draft" | "Needs Evidence";
  homepage: HomepageDraftBlock;
  navigation: NavigationDraftItem[];
  projectPages: ProjectPageDraft[];
  theme: PortfolioThemeSettings;
  responsivePreview: {
    device: PortfolioBuilderDevice;
  };
  guardrails: string[];
  provenance: ProvenanceReference[];
  createdAt: string;
  updatedAt: string;
};
