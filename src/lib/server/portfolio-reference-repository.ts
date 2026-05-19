import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PortfolioReference } from "@/lib/portfolio-reference-types";

const isReadOnlyServerless = process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");
const dataDir = isReadOnlyServerless ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const manifestPath = path.join(dataDir, "portfolio-references.json");
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}

function recordToReference(record: {
  id: string;
  url: string;
  normalizedUrl: string;
  title: string;
  archetype: string;
  roleType: string;
  portfolioStyle: string;
  storytellingStructure: string;
  layoutStructure: string;
  researchWeight: string;
  visualWeight: string;
  recruiterReadability: string;
  technicalDepth: string;
  captureStatus: string;
  screenshots: unknown;
  metadata: unknown;
  reviewTags: string[];
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
}): PortfolioReference {
  return {
    ...record,
    screenshots: record.screenshots as PortfolioReference["screenshots"],
    metadata: record.metadata as PortfolioReference["metadata"],
    reviewTags: record.reviewTags as PortfolioReference["reviewTags"],
    archetype: record.archetype as PortfolioReference["archetype"],
    portfolioStyle: record.portfolioStyle as PortfolioReference["portfolioStyle"],
    researchWeight: record.researchWeight as PortfolioReference["researchWeight"],
    visualWeight: record.visualWeight as PortfolioReference["visualWeight"],
    recruiterReadability: record.recruiterReadability as PortfolioReference["recruiterReadability"],
    technicalDepth: record.technicalDepth as PortfolioReference["technicalDepth"],
    captureStatus: record.captureStatus as PortfolioReference["captureStatus"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

async function readLocalReferences(): Promise<PortfolioReference[]> {
  try {
    const raw = await readFile(manifestPath, "utf8");
    return JSON.parse(raw) as PortfolioReference[];
  } catch {
    return [];
  }
}

async function writeLocalReferences(references: PortfolioReference[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(manifestPath, JSON.stringify(references, null, 2));
}

export async function listPortfolioReferences() {
  if (shouldUseDatabase()) {
    const records = await prisma().portfolioReference.findMany({
      orderBy: { createdAt: "desc" }
    });
    return records.map(recordToReference);
  }

  const references = await readLocalReferences();
  return references.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createPortfolioReference(input: Omit<PortfolioReference, "id" | "createdAt" | "updatedAt">) {
  if (shouldUseDatabase()) {
    const existing = await prisma().portfolioReference.findUnique({
      where: { normalizedUrl: input.normalizedUrl }
    });
    if (existing) return recordToReference(existing);

    const reference = await prisma().portfolioReference.create({
      data: {
        ...input,
        id: `reference_${randomUUID()}`
      }
    });
    return recordToReference(reference);
  }

  const references = await readLocalReferences();
  const existing = references.find((reference) => reference.normalizedUrl === input.normalizedUrl);
  if (existing) return existing;

  const now = new Date().toISOString();
  const reference: PortfolioReference = {
    ...input,
    id: `reference_${randomUUID()}`,
    createdAt: now,
    updatedAt: now
  };
  references.unshift(reference);
  await writeLocalReferences(references);
  return reference;
}

export async function getPortfolioReference(referenceId: string) {
  if (shouldUseDatabase()) {
    const record = await prisma().portfolioReference.findUnique({
      where: { id: referenceId }
    });
    return record ? recordToReference(record) : null;
  }

  const references = await readLocalReferences();
  return references.find((reference) => reference.id === referenceId) ?? null;
}

export async function updatePortfolioReference(
  referenceId: string,
  patch: Partial<Omit<PortfolioReference, "id" | "createdAt" | "updatedAt">>
) {
  if (shouldUseDatabase()) {
    const record = await prisma().portfolioReference.update({
      where: { id: referenceId },
      data: patch
    });
    return recordToReference(record);
  }

  const references = await readLocalReferences();
  const index = references.findIndex((reference) => reference.id === referenceId);
  if (index === -1) return null;

  const updated: PortfolioReference = {
    ...references[index],
    ...patch,
    updatedAt: new Date().toISOString()
  };
  references[index] = updated;
  await writeLocalReferences(references);
  return updated;
}
