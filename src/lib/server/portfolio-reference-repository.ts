import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PortfolioReference } from "@/lib/portfolio-reference-types";

const isReadOnlyServerless = process.env.VERCEL === "1" || process.cwd().startsWith("/var/task");
const dataDir = isReadOnlyServerless ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const manifestPath = path.join(dataDir, "portfolio-references.json");

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
  const references = await readLocalReferences();
  return references.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createPortfolioReference(input: Omit<PortfolioReference, "id" | "createdAt" | "updatedAt">) {
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
