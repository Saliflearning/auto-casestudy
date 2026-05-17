import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { ProjectCluster } from "@/lib/types";

const dataDir = path.join(process.cwd(), ".data");
const decisionsPath = path.join(dataDir, "evidence-map-decisions.json");

const globalForEvidencePrisma = globalThis as unknown as {
  evidencePrisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForEvidencePrisma.evidencePrisma) {
    globalForEvidencePrisma.evidencePrisma = new PrismaClient();
  }
  return globalForEvidencePrisma.evidencePrisma;
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

async function readLocalDecisions(): Promise<ProjectCluster[]> {
  try {
    const raw = await readFile(decisionsPath, "utf8");
    return JSON.parse(raw) as ProjectCluster[];
  } catch {
    return [];
  }
}

async function writeLocalDecisions(clusters: ProjectCluster[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(decisionsPath, JSON.stringify(clusters, null, 2), "utf8");
}

type StoredProjectCluster = ProjectCluster & { workspaceId?: string };

export async function listClusterDecisions(workspaceId?: string): Promise<ProjectCluster[]> {
  if (shouldUseDatabase()) {
    const clusters = await prisma().projectCluster.findMany({
      where: workspaceId ? { workspaceId } : undefined
    });
    return clusters.map((cluster) => ({
      id: cluster.id,
      label: cluster.label,
      artifactIds: cluster.artifactIds,
      reasons: cluster.reasons,
      confidenceScore: cluster.confidenceScore,
      status: cluster.status as ProjectCluster["status"],
      createdAt: cluster.createdAt.toISOString()
    }));
  }

  const decisions = (await readLocalDecisions()) as StoredProjectCluster[];
  return workspaceId ? decisions.filter((cluster) => cluster.workspaceId === workspaceId) : decisions;
}

export async function saveClusterDecision(cluster: ProjectCluster, workspaceId = "demo-workspace") {
  if (shouldUseDatabase()) {
    await ensureWorkspace(workspaceId);
    const saved = await prisma().projectCluster.upsert({
      where: { id: cluster.id },
      update: {
        workspaceId,
        label: cluster.label,
        artifactIds: cluster.artifactIds,
        reasons: cluster.reasons,
        confidenceScore: cluster.confidenceScore,
        status: cluster.status
      },
      create: {
        id: cluster.id,
        workspaceId,
        label: cluster.label,
        artifactIds: cluster.artifactIds,
        reasons: cluster.reasons,
        confidenceScore: cluster.confidenceScore,
        status: cluster.status,
        createdAt: new Date(cluster.createdAt)
      }
    });

    return {
      id: saved.id,
      label: saved.label,
      artifactIds: saved.artifactIds,
      reasons: saved.reasons,
      confidenceScore: saved.confidenceScore,
      status: saved.status as ProjectCluster["status"],
      createdAt: saved.createdAt.toISOString()
    };
  }

  const decisions = (await readLocalDecisions()) as StoredProjectCluster[];
  const scopedCluster = { ...cluster, workspaceId };
  const next = [scopedCluster, ...decisions.filter((item) => item.id !== cluster.id)];
  await writeLocalDecisions(next);
  return cluster;
}

export function applyClusterDecisions(generated: ProjectCluster[], decisions: ProjectCluster[]) {
  const byId = new Map(decisions.map((cluster) => [cluster.id, cluster]));
  const merged = generated.map((cluster) => byId.get(cluster.id) ?? cluster);
  const generatedIds = new Set(generated.map((cluster) => cluster.id));
  const manualOnly = decisions.filter((cluster) => !generatedIds.has(cluster.id));
  return [...merged, ...manualOnly];
}
