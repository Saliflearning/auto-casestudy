import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";

const dataDir = process.env.VERCEL ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const draftsPath = path.join(dataDir, "case-study-drafts.json");

const globalForCaseStudyPrisma = globalThis as unknown as {
  caseStudyPrisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForCaseStudyPrisma.caseStudyPrisma) {
    globalForCaseStudyPrisma.caseStudyPrisma = new PrismaClient();
  }
  return globalForCaseStudyPrisma.caseStudyPrisma;
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

async function readLocalDrafts(): Promise<GeneratedCaseStudyDraft[]> {
  try {
    const raw = await readFile(draftsPath, "utf8");
    return JSON.parse(raw) as GeneratedCaseStudyDraft[];
  } catch {
    return [];
  }
}

async function writeLocalDrafts(drafts: GeneratedCaseStudyDraft[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(draftsPath, JSON.stringify(drafts, null, 2), "utf8");
}

function toDraft(record: any): GeneratedCaseStudyDraft {
  return {
    ...record.contentJson,
    id: record.id,
    workspaceId: record.workspaceId,
    blueprintId: record.blueprintId,
    blueprintVersion: record.blueprintVersion,
    projectId: record.projectId,
    title: record.title,
    archetype: record.archetype,
    status: record.status,
    provenance: record.provenanceRefsJson,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function saveCaseStudyDraft(draft: GeneratedCaseStudyDraft) {
  if (shouldUseDatabase()) {
    await ensureWorkspace(draft.workspaceId);
    const saved = await (prisma() as any).caseStudyDraft.upsert({
      where: { id: draft.id },
      update: {
        title: draft.title,
        archetype: draft.archetype,
        status: draft.status,
        contentJson: draft,
        provenanceRefsJson: draft.provenance
      },
      create: {
        id: draft.id,
        workspaceId: draft.workspaceId,
        blueprintId: draft.blueprintId,
        blueprintVersion: draft.blueprintVersion,
        projectId: draft.projectId,
        title: draft.title,
        archetype: draft.archetype,
        status: draft.status,
        contentJson: draft,
        provenanceRefsJson: draft.provenance
      }
    });
    return toDraft(saved);
  }

  const drafts = await readLocalDrafts();
  await writeLocalDrafts([draft, ...drafts.filter((item) => item.id !== draft.id)]);
  return draft;
}

export async function getCaseStudyDraft(workspaceId: string, draftId: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).caseStudyDraft.findFirst({
      where: { id: draftId, workspaceId }
    });
    return record ? toDraft(record) : null;
  }

  const drafts = await readLocalDrafts();
  return drafts.find((draft) => draft.id === draftId && draft.workspaceId === workspaceId) ?? null;
}

export async function getLatestCaseStudyDraft(workspaceId: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).caseStudyDraft.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: "desc" }
    });
    return record ? toDraft(record) : null;
  }

  const drafts = await readLocalDrafts();
  return drafts
    .filter((draft) => draft.workspaceId === workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

export async function updateCaseStudyDraft(draft: GeneratedCaseStudyDraft) {
  return saveCaseStudyDraft({ ...draft, updatedAt: new Date().toISOString() });
}

export async function updateDraftSection(input: {
  workspaceId: string;
  draftId: string;
  sectionId: string;
  content?: string;
  locked?: boolean;
}) {
  const draft = await getCaseStudyDraft(input.workspaceId, input.draftId);
  if (!draft) return null;
  const matched = draft.sections.some((section) => section.id === input.sectionId);
  if (!matched) return null;

  const next: GeneratedCaseStudyDraft = {
    ...draft,
    sections: draft.sections.map((section) =>
      section.id === input.sectionId
        ? {
            ...section,
            content: input.content ?? section.content,
            editable: input.locked === undefined ? section.editable : !input.locked
          }
        : section
    ),
    updatedAt: new Date().toISOString()
  };
  return saveCaseStudyDraft(next);
}
