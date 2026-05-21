import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PortfolioSiteDraft } from "@/lib/portfolio-site-draft-types";

const dataDir = process.env.VERCEL ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const draftsPath = path.join(dataDir, "portfolio-site-drafts.json");

const globalForSiteDraftPrisma = globalThis as unknown as {
  siteDraftPrisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForSiteDraftPrisma.siteDraftPrisma) {
    globalForSiteDraftPrisma.siteDraftPrisma = new PrismaClient();
  }
  return globalForSiteDraftPrisma.siteDraftPrisma;
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

async function readLocalDrafts(): Promise<PortfolioSiteDraft[]> {
  try {
    const raw = await readFile(draftsPath, "utf8");
    return JSON.parse(raw) as PortfolioSiteDraft[];
  } catch {
    return [];
  }
}

async function writeLocalDrafts(drafts: PortfolioSiteDraft[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(draftsPath, JSON.stringify(drafts, null, 2), "utf8");
}

function toDraft(record: any): PortfolioSiteDraft {
  return {
    ...record.draftJson,
    id: record.id,
    workspaceId: record.workspaceId,
    sourceExperiencePlanId: record.sourceExperiencePlanId ?? undefined,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function savePortfolioSiteDraft(draft: PortfolioSiteDraft) {
  if (shouldUseDatabase()) {
    await ensureWorkspace(draft.workspaceId);
    const saved = await (prisma() as any).portfolioSiteDraft.upsert({
      where: { id: draft.id },
      update: {
        sourceExperiencePlanId: draft.sourceExperiencePlanId,
        status: draft.status,
        draftJson: draft
      },
      create: {
        id: draft.id,
        workspaceId: draft.workspaceId,
        sourceExperiencePlanId: draft.sourceExperiencePlanId,
        status: draft.status,
        draftJson: draft
      }
    });
    return toDraft(saved);
  }

  const drafts = await readLocalDrafts();
  await writeLocalDrafts([draft, ...drafts.filter((item) => item.id !== draft.id)]);
  return draft;
}

export async function getLatestPortfolioSiteDraft(workspaceId: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).portfolioSiteDraft.findFirst({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" }
    });
    return record ? toDraft(record) : null;
  }

  const drafts = await readLocalDrafts();
  return drafts
    .filter((draft) => draft.workspaceId === workspaceId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
}
