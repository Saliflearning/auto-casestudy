import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ArtifactKind } from "@/lib/types";
import { mapArtifactRelationships } from "@/lib/relationship-engine";
import { classifyArtifactRecord } from "@/lib/server/classifier";
import { applyClusterDecisions, listClusterDecisions } from "@/lib/server/evidence-map-repository";
import { createArtifactRecords, listArtifacts } from "@/lib/server/artifact-repository";
import { parseArtifactBytes } from "@/lib/server/parsers";
import { storeArtifactFile } from "@/lib/server/storage";

export const runtime = "nodejs";

const acceptedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);

const acceptedExtensions = new Set(["pdf", "doc", "docx", "ppt", "pptx", "png", "jpg", "jpeg", "webp", "gif"]);

function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function kindFromFile(file: File): ArtifactKind {
  const ext = extensionOf(file.name);
  if (ext === "pdf") return "PDF";
  if (ext === "doc" || ext === "docx") return "DOCX";
  if (ext === "ppt" || ext === "pptx") return "Slide Deck";
  if (file.type.startsWith("image/")) return "Image";
  return "Notes";
}

function validateFile(file: File) {
  const ext = extensionOf(file.name);
  return acceptedMimeTypes.has(file.type) || acceptedExtensions.has(ext);
}

async function buildEvidenceMap() {
  const artifacts = await listArtifacts();
  const generated = mapArtifactRelationships(artifacts);
  const decisions = await listClusterDecisions();
  return {
    artifacts,
    evidenceMap: {
      ...generated,
      clusters: applyClusterDecisions(generated.clusters, decisions)
    }
  };
}

export async function GET() {
  const { artifacts, evidenceMap } = await buildEvidenceMap();
  return NextResponse.json({ artifacts, evidenceMap });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const files = form.getAll("files").filter((value): value is File => {
    return typeof value === "object" && value !== null && "arrayBuffer" in value && "name" in value;
  });

  if (!files.length) {
    return NextResponse.json({ error: "No files uploaded." }, { status: 400 });
  }

  const rejected = files.filter((file) => !validateFile(file));
  if (rejected.length) {
    return NextResponse.json(
      {
        error: "Unsupported file type.",
        rejected: rejected.map((file) => file.name)
      },
      { status: 415 }
    );
  }

  const now = new Date().toISOString();
  const userId = process.env.AUTOCASESTUDY_DEFAULT_USER_ID ?? "demo-user";
  const records = [];

  for (const file of files) {
    const id = `artifact_${randomUUID()}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    const stored = await storeArtifactFile(file, id, bytes);
    const parseResult = await parseArtifactBytes({
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
      fileName: file.name,
      fileType,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      storageUrl: stored.storageUrl,
      storageKey: stored.storageKey,
      status: parseResult.status,
      parserError: "parserError" in parseResult ? parseResult.parserError : null,
      extractedContent: "content" in parseResult ? parseResult.content : null,
      classification,
      uploadedAt: now,
      updatedAt: now
    });
  }

  const artifacts = await createArtifactRecords(records);
  const { evidenceMap } = await buildEvidenceMap();

  return NextResponse.json({ artifacts, evidenceMap });
}
