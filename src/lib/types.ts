export type Persona =
  | "HCI Master's Student"
  | "UX Researcher"
  | "Product Designer"
  | "Technical UX Hybrid"
  | "Cloud/IT Hybrid"
  | "Product Manager"
  | "Software Project Builder";

export type AudienceMode = "Portfolio" | "Research" | "Technical";

export type ArtifactKind =
  | "PDF"
  | "DOCX"
  | "Image"
  | "Photo"
  | "Figma"
  | "Prototype"
  | "Slide Deck"
  | "Code"
  | "Certification"
  | "Resume"
  | "Notes";

export type Confidence = "High" | "Medium" | "Low";

export type ArtifactProcessingStatus =
  | "Demo"
  | "Uploaded"
  | "Parsing"
  | "Pending Parsing"
  | "Parsed"
  | "Failed"
  | "Visual Parsing Pending";

export type ArtifactExtractedContent = {
  id: string;
  artifactId: string;
  text: string;
  parser: string;
  parserVersion: string;
  createdAt: string;
};

export type ArtifactClassificationKind =
  | "research notes"
  | "presentation"
  | "design artifact"
  | "resume/profile"
  | "project report"
  | "technical documentation"
  | "certificate"
  | "unknown";

export type ArtifactClassification = {
  id: string;
  artifactId: string;
  classification: ArtifactClassificationKind;
  confidenceScore: number;
  projectName?: string;
  courseOrJob?: string;
  tools: string[];
  methods: string[];
  dates: string[];
  outcomes: string[];
  tags: string[];
  classifier: string;
  classifierVersion: string;
  createdAt: string;
};

export type ArtifactRelationshipType =
  | "same project"
  | "same course/job"
  | "same tool"
  | "possible timeline connection"
  | "supporting evidence";

export type ArtifactRelationship = {
  id: string;
  sourceArtifactId: string;
  targetArtifactId: string;
  type: ArtifactRelationshipType;
  reason: string;
  confidenceScore: number;
  status: "Suggested" | "Confirmed" | "Rejected" | "Needs Review";
  createdAt: string;
};

export type ProjectCluster = {
  id: string;
  label: string;
  artifactIds: string[];
  reasons: string[];
  confidenceScore: number;
  status: "Suggested" | "Confirmed" | "Rejected" | "Needs Review";
  createdAt: string;
};

export type Artifact = {
  id: string;
  userId?: string;
  name: string;
  fileName?: string;
  kind: ArtifactKind;
  fileType?: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt?: string;
  updatedAt?: string;
  storagePath?: string;
  storageUrl?: string;
  storageKey?: string;
  storageVisibility?: "private" | "public-demo" | "local-dev";
  status?: ArtifactProcessingStatus;
  extractedContent?: ArtifactExtractedContent;
  classification?: ArtifactClassification;
  parserError?: string;
  phase: string;
  confidence: Confidence;
  confidenceScore: number;
  evidenceStrength: number;
  extractedSignals: string[];
  suggestedPlacement: string;
  risk: string;
  sourceLabel: string;
};

export type CaseStudySection = {
  id: string;
  title: string;
  type: "overview" | "research" | "process" | "design" | "technical" | "outcome" | "reflection";
  content: string;
  evidenceIds: string[];
  locked: boolean;
};

export type Gap = {
  id: string;
  severity: "Critical" | "Important" | "Suggestion";
  title: string;
  detail: string;
  action: string;
};

export type UnderstandingBacklogItem = {
  id: string;
  category:
    | "Project reconstruction"
    | "Portfolio planning"
    | "Evidence gap"
    | "Media placement"
    | "Recruiter readability"
    | "Guardrail";
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Needs evidence" | "Needs review" | "Ready for planning" | "Blocked";
  title: string;
  rationale: string;
  suggestedAction: string;
  sourceArtifactIds: string[];
  relatedClusterIds: string[];
  outputTarget: "Home" | "Projects" | "Case Study" | "Resume" | "Skills" | "Publish Readiness";
};

export type PortfolioTheme = "Instrument Dark" | "Editorial Light" | "Recruiter Clean";
