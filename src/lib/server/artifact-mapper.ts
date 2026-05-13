import { Artifact, ArtifactClassificationKind } from "@/lib/types";

export type ArtifactMetadataRecord = {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string;
  storageKey: string;
  status: string;
  parserError?: string | null;
  uploadedAt: string | Date;
  updatedAt: string | Date;
  extractedContent?: {
    id: string;
    artifactId: string;
    text: string;
    parser: string;
    parserVersion: string;
    createdAt: string | Date;
  } | null;
  classification?: {
    id: string;
    artifactId: string;
    classification: string;
    confidenceScore: number;
    projectName?: string | null;
    courseOrJob?: string | null;
    tools: string[];
    methods: string[];
    dates: string[];
    outcomes: string[];
    tags: string[];
    classifier: string;
    classifierVersion: string;
    createdAt: string | Date;
  } | null;
};

function toIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

export function recordToArtifact(record: ArtifactMetadataRecord): Artifact {
  return {
    id: record.id,
    userId: record.userId,
    name: record.fileName,
    fileName: record.fileName,
    kind: record.fileType as Artifact["kind"],
    fileType: record.fileType,
    mimeType: record.mimeType,
    sizeBytes: record.sizeBytes,
    uploadedAt: toIso(record.uploadedAt),
    updatedAt: toIso(record.updatedAt),
    storagePath: record.storageKey,
    storageKey: record.storageKey,
    storageUrl: record.storageUrl,
    status: record.status as Artifact["status"],
    parserError: record.parserError ?? undefined,
    extractedContent: record.extractedContent
      ? {
          ...record.extractedContent,
          createdAt: toIso(record.extractedContent.createdAt)
        }
      : undefined,
    classification: record.classification
      ? {
          ...record.classification,
          classification: record.classification.classification as ArtifactClassificationKind,
          projectName: record.classification.projectName ?? undefined,
          courseOrJob: record.classification.courseOrJob ?? undefined,
          createdAt: toIso(record.classification.createdAt)
        }
      : undefined,
    phase: "Uploaded / Unprocessed",
    confidence: "Low",
    confidenceScore: 0,
    evidenceStrength: 0,
    extractedSignals: ["stored file", "metadata only", "awaiting parser"],
    suggestedPlacement: "Artifact Library",
    risk: "Stored successfully. No content parsing or AI understanding has run yet.",
    sourceLabel: record.fileName.replace(/\.[^/.]+$/, "")
  };
}
