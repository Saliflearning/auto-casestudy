import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PortfolioPageComposition } from "@/lib/layout-composition-types";

const dataDir = process.env.VERCEL ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const compositionsPath = path.join(dataDir, "layout-compositions.json");

const globalForLayoutPrisma = globalThis as unknown as {
  layoutPrisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForLayoutPrisma.layoutPrisma) {
    globalForLayoutPrisma.layoutPrisma = new PrismaClient();
  }
  return globalForLayoutPrisma.layoutPrisma;
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

async function readLocalCompositions(): Promise<PortfolioPageComposition[]> {
  try {
    const raw = await readFile(compositionsPath, "utf8");
    return JSON.parse(raw) as PortfolioPageComposition[];
  } catch {
    return [];
  }
}

async function writeLocalCompositions(compositions: PortfolioPageComposition[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(compositionsPath, JSON.stringify(compositions, null, 2), "utf8");
}

function toComposition(record: any): PortfolioPageComposition {
  return {
    ...record.compositionJson,
    id: record.id,
    workspaceId: record.workspaceId,
    draftId: record.caseStudyDraftId,
    projectId: record.projectId,
    title: record.title,
    archetype: record.archetype,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function savePortfolioPageComposition(composition: PortfolioPageComposition) {
  if (shouldUseDatabase()) {
    await ensureWorkspace(composition.workspaceId);
    const saved = await (prisma() as any).portfolioPageComposition.upsert({
      where: { id: composition.id },
      update: {
        title: composition.title,
        archetype: composition.archetype,
        status: composition.status,
        compositionJson: composition
      },
      create: {
        id: composition.id,
        workspaceId: composition.workspaceId,
        caseStudyDraftId: composition.draftId,
        projectId: composition.projectId,
        title: composition.title,
        archetype: composition.archetype,
        status: composition.status,
        compositionJson: composition
      }
    });
    return toComposition(saved);
  }

  const compositions = await readLocalCompositions();
  await writeLocalCompositions([composition, ...compositions.filter((item) => item.id !== composition.id)]);
  return composition;
}

export async function getPortfolioPageComposition(workspaceId: string, compositionId: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).portfolioPageComposition.findFirst({
      where: { id: compositionId, workspaceId }
    });
    return record ? toComposition(record) : null;
  }

  const compositions = await readLocalCompositions();
  return compositions.find((composition) => composition.id === compositionId && composition.workspaceId === workspaceId) ?? null;
}

export async function getLatestPortfolioPageComposition(workspaceId: string, draftId?: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).portfolioPageComposition.findFirst({
      where: { workspaceId, ...(draftId ? { caseStudyDraftId: draftId } : {}) },
      orderBy: { createdAt: "desc" }
    });
    return record ? toComposition(record) : null;
  }

  const compositions = await readLocalCompositions();
  return compositions
    .filter((composition) => composition.workspaceId === workspaceId && (!draftId || composition.draftId === draftId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export async function listPortfolioPageCompositions(workspaceId: string) {
  if (shouldUseDatabase()) {
    const records = await (prisma() as any).portfolioPageComposition.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 25
    });
    return records.map(toComposition);
  }

  const compositions = await readLocalCompositions();
  return compositions
    .filter((composition) => composition.workspaceId === workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
