import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Artifact, ArtifactKind } from "@/lib/types";
import { mapArtifactRelationships } from "@/lib/relationship-engine";
import { classifyArtifactRecord } from "@/lib/server/classifier";
import { applyClusterDecisions, listClusterDecisions } from "@/lib/server/evidence-map-repository";
import { createArtifactRecords, listArtifacts } from "@/lib/server/artifact-repository";
import { parseArtifactBytes } from "@/lib/server/parsers";
import { storeArtifactFile } from "@/lib/server/storage";
import { getWorkspaceId, workspaceCookieHeader } from "@/lib/server/workspace";

export const runtime = "nodejs";

const MAX_FILES_PER_REQUEST = Number(process.env.AUTOCASESTUDY_MAX_FILES_PER_REQUEST ?? 5);
const MAX_FILE_BYTES = Number(process.env.AUTOCASESTUDY_MAX_FILE_BYTES ?? 15 * 1024 * 1024);
const MAX_TOTAL_BYTES = Number(process.env.AUTOCASESTUDY_MAX_TOTAL_BYTES ?? 40 * 1024 * 1024);
const MAX_SYNC_PARSE_BYTES = Number(process.env.AUTOCASESTUDY_MAX_SYNC_PARSE_BYTES ?? 8 * 1024 * 1024);

const acceptedTypesByExtension: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  pptx: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"]
};

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function kindFromFile(file: File): ArtifactKind {
  const ext = extensionOf(file.name);
  if (ext === "pdf") return "PDF";
  if (ext === "docx") return "DOCX";
  if (ext === "pptx") return "Slide Deck";
  if (file.type.startsWith("image/")) return "Image";
  return "Notes";
}

function validateFile(file: File) {
  const ext = extensionOf(file.name);
  const allowedMimeTypes = acceptedTypesByExtension[ext];
  return Boolean(allowedMimeTypes?.includes(file.type));
}

function validateUploadBatch(files: File[]) {
  if (files.length > MAX_FILES_PER_REQUEST) {
    return `Upload ${MAX_FILES_PER_REQUEST} files or fewer at a time.`;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    return `Upload batch is too large. Maximum batch size is ${(MAX_TOTAL_BYTES / 1024 / 1024).toFixed(0)} MB.`;
  }

  const oversized = files.find((file) => file.size > MAX_FILE_BYTES);
  if (oversized) {
    return `${oversized.name} is too large. Maximum file size is ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB.`;
  }

  return "";
}

function sanitizeArtifactsForClient(artifacts: Artifact[]) {
  return artifacts.map((artifact) => ({
    ...artifact,
    storageUrl: artifact.storageVisibility === "public-demo" ? artifact.storageUrl : undefined,
    storagePath: undefined,
    storageKey: undefined,
    extractedContent: artifact.extractedContent
      ? {
          ...artifact.extractedContent,
          text:
            artifact.extractedContent.text.length > 700
              ? `${artifact.extractedContent.text.slice(0, 700)}...`
              : artifact.extractedContent.text
        }
      : undefined
  }));
}

async function buildEvidenceMap(workspaceId: string) {
  const artifacts = await listArtifacts(workspaceId);
  const generated = mapArtifactRelationships(artifacts);
  const decisions = await listClusterDecisions(workspaceId);
  return {
    artifacts,
    evidenceMap: {
      ...generated,
      clusters: applyClusterDecisions(generated.clusters, decisions)
    }
  };
}

export async function GET(request: NextRequest) {
  const workspaceId = getWorkspaceId(request);
  const { artifacts, evidenceMap } = await buildEvidenceMap(workspaceId);
  const response = NextResponse.json({ artifacts: sanitizeArtifactsForClient(artifacts), evidenceMap });
  response.headers.append("Set-Cookie", workspaceCookieHeader(workspaceId));
  return response;
}

export async function POST(request: NextRequest) {
  const workspaceId = getWorkspaceId(request);
  const form = await request.formData();
  const files = form.getAll("files").filter((value): value is File => {
    return typeof value === "object" && value !== null && "arrayBuffer" in value && "name" in value;
  });

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  }

  const batchError = validateUploadBatch(files);
  if (batchError) {
    return NextResponse.json({ error: batchError }, { status: 413 });
  }

  const rejected = files.filter((file) => !validateFile(file));
  if (rejected.length) {
    return NextResponse.json(
      {
        error: "Unsupported or unsafe file type. Use PDF, DOCX, PPTX, PNG, JPG, or WebP for this MVP.",
        rejected: rejected.map((file) => file.name)
      },
      { status: 415 }
    );
  }

  const now = new Date().toISOString();
  const userId = workspaceId;
  const records = [];

  for (const file of files) {
    const id = `artifact_${randomUUID()}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await storeArtifactFile(file, id, bytes);
    const parseResult =
      bytes.length > MAX_SYNC_PARSE_BYTES
        ? {
            status: "Pending Parsing" as const,
            parserError: `Queued for parsing because it exceeds the ${(MAX_SYNC_PARSE_BYTES / 1024 / 1024).toFixed(0)} MB synchronous parsing limit.`
          }
        : await parseArtifactBytes({
            artifactId: id,
            fileName: file.name,
            mimeType: file.type || "application/octet-stream",
            bytes
          });
    const extractedText = "content" in parseResult ? parseResult.content.text : undefined;
    const fileType = kindFromFile(file);
    const classification = classifyArtifactRecord({
      artifactId: id,
      fileName: file.name,
      fileType,
      mimeType: file.type || "application/octet-stream",
      extractedText
    });

    records.push({
      id,
      userId,
      workspaceId,
      fileName: file.name,
      fileType,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storageUrl: stored.storageUrl,
      storageKey: stored.storageKey,
      storageVisibility: stored.storageVisibility,
      status: parseResult.status,
      parserError: "parserError" in parseResult ? parseResult.parserError : null,
      extractedContent: "content" in parseResult ? parseResult.content : null,
      classification,
      uploadedAt: now,
      updatedAt: now
    });
  }

  const artifacts = await createArtifactRecords(records);
  const { evidenceMap } = await buildEvidenceMap(workspaceId);

  const response = NextResponse.json({ artifacts: sanitizeArtifactsForClient(artifacts), evidenceMap });
  response.headers.append("Set-Cookie", workspaceCookieHeader(workspaceId));
  return response;
}
