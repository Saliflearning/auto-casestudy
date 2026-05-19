export type PortfolioReferenceArchetype =
  | "UX Research"
  | "Product Design"
  | "Technical UX Hybrid"
  | "HCI Academic"
  | "Cloud Engineer"
  | "Data/Analytics"
  | "Recruiter-Optimized"
  | "Unknown";

export type PortfolioReferenceStyle =
  | "Case-study led"
  | "Visual gallery"
  | "Research-heavy"
  | "Technical proof"
  | "Editorial narrative"
  | "Minimal recruiter"
  | "Unknown";

export type PortfolioReferenceCaptureStatus = "Queued" | "Captured" | "Failed" | "Needs Review";

export type PortfolioReferenceReviewTag =
  | "Excellent storytelling"
  | "Weak hierarchy"
  | "Strong case studies"
  | "Strong visual rhythm"
  | "Recruiter-friendly"
  | "Research-heavy"
  | "Technical depth"
  | "Needs review";

export type PortfolioReferenceScreenshot = {
  id: string;
  label: string;
  pageUrl: string;
  storageKey?: string;
  storageUrl?: string;
  capturedAt?: string;
  status: PortfolioReferenceCaptureStatus;
};

export type PortfolioReferenceMetadata = {
  pageStructure: string[];
  navigationPatterns: string[];
  mediaDensity: "Low" | "Medium" | "High" | "Unknown";
  storytellingNotes: string[];
  visualHierarchyNotes: string[];
  recruiterObservations: string[];
  strengths: string[];
  weaknesses: string[];
};

export type PortfolioReference = {
  id: string;
  url: string;
  normalizedUrl: string;
  title: string;
  archetype: PortfolioReferenceArchetype;
  roleType: string;
  portfolioStyle: PortfolioReferenceStyle;
  storytellingStructure: string;
  layoutStructure: string;
  researchWeight: "Low" | "Medium" | "High" | "Unknown";
  visualWeight: "Low" | "Medium" | "High" | "Unknown";
  recruiterReadability: "Low" | "Medium" | "High" | "Unknown";
  technicalDepth: "Low" | "Medium" | "High" | "Unknown";
  captureStatus: PortfolioReferenceCaptureStatus;
  screenshots: PortfolioReferenceScreenshot[];
  metadata: PortfolioReferenceMetadata;
  reviewTags: PortfolioReferenceReviewTag[];
  adminNotes: string;
  createdAt: string;
  updatedAt: string;
};
