import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { CaseStudyRevisionRecord, CaseStudyRevisionStatus } from "@/lib/case-study-revision-types";

const dataDir = process.env.VERCEL ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const revisionsPath = path.join(dataDir, "case-study-revisions.json");

const globalForRevisionPrisma = globalThis as unknown as {
  revisionPrisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForRevisionPrisma.revisionPrisma) {
    globalForRevisionPrisma.revisionPrisma = new PrismaClient();
  }
  return globalForRevisionPrisma.revisionPrisma;
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

async function readLocalRevisions(): Promise<CaseStudyRevisionRecord[]> {
  try {
    const raw = await readFile(revisionsPath, "utf8");
    return JSON.parse(raw) as CaseStudyRevisionRecord[];
  } catch {
    return [];
  }
}

async function writeLocalRevisions(revisions: CaseStudyRevisionRecord[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(revisionsPath, JSON.stringify(revisions, null, 2), "utf8");
}

function toRevision(record: any): CaseStudyRevisionRecord {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    draftId: record.draftId,
    sectionId: record.sectionId,
    status: record.status as CaseStudyRevisionRecord["status"],
    goal: record.goal as CaseStudyRevisionRecord["goal"],
    originalContent: record.originalContent,
    revisedContent: record.revisedContent,
    changeSummary: record.changeSummaryJson,
    qualityDelta: record.qualityDeltaJson,
    provenance: record.provenanceRefsJson,
    unsupportedWarnings: record.unsupportedWarnings,
    actorId: record.actorId ?? undefined,
    decidedAt: record.decidedAt?.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function saveCaseStudyRevision(revision: CaseStudyRevisionRecord) {
  if (shouldUseDatabase()) {
    await ensureWorkspace(revision.workspaceId);
    const saved = await (prisma() as any).caseStudyRevision.upsert({
      where: { id: revision.id },
      update: {
        status: revision.status,
        revisedContent: revision.revisedContent,
        changeSummaryJson: revision.changeSummary,
        qualityDeltaJson: revision.qualityDelta,
        provenanceRefsJson: revision.provenance,
        unsupportedWarnings: revision.unsupportedWarnings,
        actorId: revision.actorId,
        decidedAt: revision.decidedAt ? new Date(revision.decidedAt) : undefined
      },
      create: {
        id: revision.id,
        workspaceId: revision.workspaceId,
        draftId: revision.draftId,
        sectionId: revision.sectionId,
        status: revision.status,
        goal: revision.goal,
        originalContent: revision.originalContent,
        revisedContent: revision.revisedContent,
        changeSummaryJson: revision.changeSummary,
        qualityDeltaJson: revision.qualityDelta,
        provenanceRefsJson: revision.provenance,
        unsupportedWarnings: revision.unsupportedWarnings,
        actorId: revision.actorId,
        decidedAt: revision.decidedAt ? new Date(revision.decidedAt) : undefined
      }
    });
    return toRevision(saved);
  }

  const revisions = await readLocalRevisions();
  await writeLocalRevisions([revision, ...revisions.filter((item) => item.id !== revision.id)]);
  return revision;
}

export async function getCaseStudyRevision(workspaceId: string, revisionId: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).caseStudyRevision.findFirst({
      where: { id: revisionId, workspaceId }
    });
    return record ? toRevision(record) : null;
  }

  const revisions = await readLocalRevisions();
  return revisions.find((revision) => revision.id === revisionId && revision.workspaceId === workspaceId) ?? null;
}

export async function listCaseStudyRevisions(workspaceId: string, draftId: string) {
  if (shouldUseDatabase()) {
    const records = await (prisma() as any).caseStudyRevision.findMany({
      where: { workspaceId, draftId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return records.map(toRevision);
  }

  const revisions = await readLocalRevisions();
  return revisions
    .filter((revision) => revision.workspaceId === workspaceId && revision.draftId === draftId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateRevisionStatus(workspaceId: string, revisionId: string, status: CaseStudyRevisionStatus, actorId?: string) {
  if (shouldUseDatabase()) {
    const decidedAt = new Date();
    const updated = await (prisma() as any).caseStudyRevision.updateMany({
      where: { id: revisionId, workspaceId, status: "Proposed" },
      data: { status, actorId, decidedAt }
    });
    if (updated.count === 0) return null;
    return getCaseStudyRevision(workspaceId, revisionId);
  }

  const revision = await getCaseStudyRevision(workspaceId, revisionId);
  if (!revision || revision.status !== "Proposed") return null;
  return saveCaseStudyRevision({
    ...revision,
    status,
    actorId: actorId ?? revision.actorId,
    decidedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}
