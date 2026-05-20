import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { CaseStudyQualityReport } from "@/lib/case-study-quality-types";

const dataDir = process.env.VERCEL ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const reportsPath = path.join(dataDir, "case-study-quality-reports.json");

const globalForQualityPrisma = globalThis as unknown as {
  qualityPrisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForQualityPrisma.qualityPrisma) {
    globalForQualityPrisma.qualityPrisma = new PrismaClient();
  }
  return globalForQualityPrisma.qualityPrisma;
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

async function readLocalReports(): Promise<CaseStudyQualityReport[]> {
  try {
    const raw = await readFile(reportsPath, "utf8");
    return JSON.parse(raw) as CaseStudyQualityReport[];
  } catch {
    return [];
  }
}

async function writeLocalReports(reports: CaseStudyQualityReport[]) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(reportsPath, JSON.stringify(reports, null, 2), "utf8");
}

function toReport(record: any): CaseStudyQualityReport {
  return record.reportJson as CaseStudyQualityReport;
}

export async function saveCaseStudyQualityReport(report: CaseStudyQualityReport) {
  if (shouldUseDatabase()) {
    await ensureWorkspace(report.workspaceId);
    const saved = await (prisma() as any).caseStudyQualityReport.upsert({
      where: { id: report.id },
      update: {
        readiness: report.readiness,
        publishRisk: report.publishRisk,
        overallScore: report.scores.overall,
        reportJson: report
      },
      create: {
        id: report.id,
        workspaceId: report.workspaceId,
        caseStudyDraftId: report.caseStudyDraftId,
        projectId: report.projectId,
        readiness: report.readiness,
        publishRisk: report.publishRisk,
        overallScore: report.scores.overall,
        reportJson: report
      }
    });
    return toReport(saved);
  }

  const reports = await readLocalReports();
  await writeLocalReports([report, ...reports.filter((item) => item.id !== report.id)]);
  return report;
}

export async function getCaseStudyQualityReport(workspaceId: string, reportId: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).caseStudyQualityReport.findFirst({
      where: { id: reportId, workspaceId }
    });
    return record ? toReport(record) : null;
  }

  const reports = await readLocalReports();
  return reports.find((report) => report.id === reportId && report.workspaceId === workspaceId) ?? null;
}

export async function getLatestCaseStudyQualityReport(workspaceId: string, draftId?: string) {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).caseStudyQualityReport.findFirst({
      where: { workspaceId, ...(draftId ? { caseStudyDraftId: draftId } : {}) },
      orderBy: { createdAt: "desc" }
    });
    return record ? toReport(record) : null;
  }

  const reports = await readLocalReports();
  return reports
    .filter((report) => report.workspaceId === workspaceId && (!draftId || report.caseStudyDraftId === draftId))
    .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))[0] ?? null;
}
