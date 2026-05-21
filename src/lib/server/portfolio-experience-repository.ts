import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PortfolioExperiencePlan } from "@/lib/portfolio-experience-types";

const dataDir = process.env.VERCEL ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const plansPath = path.join(dataDir, "portfolio-experience-plans.json");

const globalForExperiencePrisma = globalThis as unknown as {
  experiencePrisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForExperiencePrisma.experiencePrisma) {
    globalForExperiencePrisma.experiencePrisma = new PrismaClient();
  }
  return globalForExperiencePrisma.experiencePrisma;
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

async function readLocalPlans(): Promise<PortfolioExperiencePlan[]> {
  try {
    const raw = await readFile(plansPath, "utf8");
    return JSON.parse(raw) as PortfolioExperiencePlan[];
  } catch {
    return [];
  }
}

async function writeLocalPlans(plans: PortfolioExperiencePlan[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(plansPath, JSON.stringify(plans, null, 2), "utf8");
}

function toPlan(record: any): PortfolioExperiencePlan {
  return {
    ...record.planJson,
    id: record.id,
    workspaceId: record.workspaceId,
    blueprintId: record.blueprintId ?? undefined,
    archetype: record.archetype,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export async function savePortfolioExperiencePlan(plan: PortfolioExperiencePlan) {
  if (shouldUseDatabase()) {
    await ensureWorkspace(plan.workspaceId);
    const saved = await (prisma() as any).portfolioExperiencePlan.upsert({
      where: { id: plan.id },
      update: {
        status: plan.status,
        archetype: plan.archetype,
        planJson: plan
      },
      create: {
        id: plan.id,
        workspaceId: plan.workspaceId,
        blueprintId: plan.blueprintId,
        archetype: plan.archetype,
        status: plan.status,
        planJson: plan
      }
    });
    return toPlan(saved);
  }

  const plans = await readLocalPlans();
  await writeLocalPlans([plan, ...plans.filter((item) => item.id !== plan.id)]);
  return plan;
}

export async function getPortfolioExperiencePlan(workspaceId: string, planId: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).portfolioExperiencePlan.findFirst({
      where: { id: planId, workspaceId }
    });
    return record ? toPlan(record) : null;
  }

  const plans = await readLocalPlans();
  return plans.find((plan) => plan.id === planId && plan.workspaceId === workspaceId) ?? null;
}

export async function getLatestPortfolioExperiencePlan(workspaceId: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).portfolioExperiencePlan.findFirst({
      where: { workspaceId },
      orderBy: { createdAt: "desc" }
    });
    return record ? toPlan(record) : null;
  }

  const plans = await readLocalPlans();
  return plans
    .filter((plan) => plan.workspaceId === workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}
