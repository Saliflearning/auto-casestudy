import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { Artifact } from "@/lib/types";
import { ArtifactMetadataRecord, recordToArtifact } from "@/lib/server/artifact-mapper";

const dataDir = path.join(process.cwd(), ".data");
const manifestPath = path.join(dataDir, "artifacts.json");

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

async function ensureWorkspace(workspaceId: string) {
  await prisma().workspace.upsert({
    where: { id: workspaceId },
    update: {},
    create: {
      id: workspaceId,
      name: "Auto-CaseStudy Workspace"
    }
  });
}

async function readLocalManifest(): Promise<Artifact[]> {
  try {
    const raw = await readFile(manifestPath, "utf8");
    return JSON.parse(raw) as Artifact[];
  } catch {
    return [];
  }
}

async function writeLocalManifest(artifacts: Artifact[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(manifestPath, JSON.stringify(artifacts, null, 2), "utf8");
}

export async function listArtifacts(workspaceId?: string): Promise<Artifact[]> {
  if (shouldUseDatabase()) {
    const records = await prisma().artifact.findMany({
      where: workspaceId ? { workspaceId } : undefined,
      orderBy: { uploadedAt: "desc" },
      include: { extractedContent: true, classification: true }
    });
    return records.map(recordToArtifact);
  }

  const records = await readLocalManifest();
  return workspaceId ? records.filter((artifact) => artifact.userId === workspaceId) : records;
}

export async function createArtifactRecords(records: ArtifactMetadataRecord[]): Promise<Artifact[]> {
  if (shouldUseDatabase()) {
    const created = [];
    const workspaceIds = Array.from(new Set(records.map((record) => record.workspaceId ?? record.userId)));
    for (const workspaceId of workspaceIds) {
      await ensureWorkspace(workspaceId);
    }
    for (const record of records) {
      const artifact = await prisma().artifact.create({
        data: {
          id: record.id,
          userId: record.userId,
          workspaceId: record.workspaceId ?? record.userId,
          fileName: record.fileName,
          fileType: record.fileType,
          mimeType: record.mimeType,
          sizeBytes: record.sizeBytes,
          storageUrl: record.storageUrl,
          storageKey: record.storageKey,
          storageVisibility: record.storageVisibility ?? "local-dev",
          status: record.status,
          parserError: record.parserError,
          extractedContent: record.extractedContent
            ? {
                create: {
                  id: record.extractedContent.id,
                  text: record.extractedContent.text,
                  parser: record.extractedContent.parser,
                  parserVersion: record.extractedContent.parserVersion,
                  createdAt: new Date(record.extractedContent.createdAt)
                }
              }
            : undefined,
          classification: record.classification
            ? {
                create: {
                  id: record.classification.id,
                  classification: record.classification.classification,
                  confidenceScore: record.classification.confidenceScore,
                  projectName: record.classification.projectName,
                  courseOrJob: record.classification.courseOrJob,
                  tools: record.classification.tools,
                  methods: record.classification.methods,
                  dates: record.classification.dates,
                  outcomes: record.classification.outcomes,
                  tags: record.classification.tags,
                  classifier: record.classification.classifier,
                  classifierVersion: record.classification.classifierVersion,
                  createdAt: new Date(record.classification.createdAt)
                }
              }
            : undefined
        },
        include: { extractedContent: true, classification: true }
      });
      created.push(artifact);
    }

    return created.map(recordToArtifact);
  }

  const previous = await readLocalManifest();
  const created = records.map(recordToArtifact);
  await writeLocalManifest([...created, ...previous]);
  return created;
}
