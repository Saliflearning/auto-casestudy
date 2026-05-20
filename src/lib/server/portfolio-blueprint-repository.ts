import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  BlueprintAuditEventRecord,
  ConfirmedPortfolioBlueprint,
  PortfolioBlueprintRecord,
  PortfolioBlueprintReviewState,
  PortfolioBlueprintRevisionRecord
} from "@/lib/portfolio-blueprint-types";

const dataDir = process.env.VERCEL ? path.join("/tmp", "auto-casestudy") : path.join(process.cwd(), ".data");
const blueprintPath = path.join(dataDir, "portfolio-blueprints.json");
const revisionPath = path.join(dataDir, "portfolio-blueprint-revisions.json");
const auditPath = path.join(dataDir, "portfolio-blueprint-audit-log.json");

const globalForBlueprintPrisma = globalThis as unknown as {
  blueprintPrisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForBlueprintPrisma.blueprintPrisma) {
    globalForBlueprintPrisma.blueprintPrisma = new PrismaClient();
  }
  return globalForBlueprintPrisma.blueprintPrisma;
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

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, data: T) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function toBlueprintRecord(record: any): PortfolioBlueprintRecord {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    userId: record.userId,
    version: record.version,
    status: record.status,
    archetype: record.archetype,
    readinessScore: record.readinessScore,
    blueprint: record.blueprintJson,
    reviewState: record.reviewStateJson,
    provenanceRefs: record.provenanceRefsJson,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function toRevisionRecord(record: any): PortfolioBlueprintRevisionRecord {
  return {
    id: record.id,
    blueprintId: record.blueprintId,
    workspaceId: record.workspaceId,
    version: record.version,
    snapshot: record.snapshotJson,
    reviewState: record.reviewStateJson,
    changeSummary: record.changeSummary,
    createdAt: record.createdAt.toISOString(),
    createdBy: record.createdBy ?? undefined
  };
}

function toAuditRecord(record: any): BlueprintAuditEventRecord {
  return {
    id: record.id,
    workspaceId: record.workspaceId,
    blueprintId: record.blueprintId ?? undefined,
    revisionId: record.revisionId ?? undefined,
    actorId: record.actorId ?? undefined,
    action: record.action,
    before: record.beforeJson,
    after: record.afterJson,
    createdAt: record.createdAt.toISOString(),
    source: record.source
  };
}

function jsonSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getLatestPortfolioBlueprint(workspaceId: string): Promise<PortfolioBlueprintRecord | null> {
  if (shouldUseDatabase()) {
    const record = await (prisma() as any).portfolioBlueprint.findUnique({ where: { workspaceId } });
    return record ? toBlueprintRecord(record) : null;
  }

  const records = await readJson<PortfolioBlueprintRecord[]>(blueprintPath, []);
  return records.find((record) => record.workspaceId === workspaceId) ?? null;
}

export async function listPortfolioBlueprintRevisions(workspaceId: string): Promise<PortfolioBlueprintRevisionRecord[]> {
  if (shouldUseDatabase()) {
    const revisions = await (prisma() as any).portfolioBlueprintRevision.findMany({
      where: { workspaceId },
      orderBy: { version: "desc" },
      take: 25
    });
    return revisions.map(toRevisionRecord);
  }

  const revisions = await readJson<PortfolioBlueprintRevisionRecord[]>(revisionPath, []);
  return revisions.filter((revision) => revision.workspaceId === workspaceId).sort((a, b) => b.version - a.version);
}

export async function listBlueprintAuditEvents(workspaceId: string): Promise<BlueprintAuditEventRecord[]> {
  if (shouldUseDatabase()) {
    const events = await (prisma() as any).blueprintAuditEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return events.map(toAuditRecord);
  }

  const events = await readJson<BlueprintAuditEventRecord[]>(auditPath, []);
  return events.filter((event) => event.workspaceId === workspaceId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function savePortfolioBlueprint(input: {
  workspaceId: string;
  userId: string;
  blueprint: ConfirmedPortfolioBlueprint;
  reviewState: PortfolioBlueprintReviewState;
  changeSummary?: string;
}) {
  const existing = await getLatestPortfolioBlueprint(input.workspaceId);
  const now = new Date().toISOString();
  const nextVersion = (existing?.version ?? 0) + 1;
  const blueprintId = existing?.id ?? `portfolio_blueprint_${randomUUID()}`;
  const revisionId = `portfolio_blueprint_revision_${randomUUID()}`;
  const record: PortfolioBlueprintRecord = {
    id: blueprintId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    version: nextVersion,
    status: input.blueprint.status,
    archetype: input.blueprint.archetype,
    readinessScore: input.blueprint.readinessScore,
    blueprint: jsonSafe(input.blueprint),
    reviewState: jsonSafe(input.reviewState),
    provenanceRefs: jsonSafe(input.blueprint.provenance),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  const revision: PortfolioBlueprintRevisionRecord = {
    id: revisionId,
    blueprintId,
    workspaceId: input.workspaceId,
    version: nextVersion,
    snapshot: jsonSafe(input.blueprint),
    reviewState: jsonSafe(input.reviewState),
    changeSummary: input.changeSummary ?? "Saved portfolio blueprint review decisions.",
    createdAt: now,
    createdBy: input.userId
  };
  const auditEvent: BlueprintAuditEventRecord = {
    id: `blueprint_audit_${randomUUID()}`,
    workspaceId: input.workspaceId,
    blueprintId,
    revisionId,
    actorId: input.userId,
    action: "BLUEPRINT_SAVED",
    before: existing?.blueprint ? jsonSafe(existing.blueprint) : null,
    after: jsonSafe(input.blueprint),
    createdAt: now,
    source: "portfolio-review-workspace"
  };

  if (shouldUseDatabase()) {
    await ensureWorkspace(input.workspaceId);
    await (prisma() as any).portfolioBlueprint.upsert({
      where: { workspaceId: input.workspaceId },
      update: {
        userId: input.userId,
        version: nextVersion,
        status: record.status,
        archetype: record.archetype,
        readinessScore: record.readinessScore,
        blueprintJson: record.blueprint,
        reviewStateJson: record.reviewState,
        provenanceRefsJson: record.provenanceRefs
      },
      create: {
        id: blueprintId,
        workspaceId: input.workspaceId,
        userId: input.userId,
        version: nextVersion,
        status: record.status,
        archetype: record.archetype,
        readinessScore: record.readinessScore,
        blueprintJson: record.blueprint,
        reviewStateJson: record.reviewState,
        provenanceRefsJson: record.provenanceRefs
      }
    });
    await (prisma() as any).portfolioBlueprintRevision.create({
      data: {
        id: revision.id,
        blueprintId,
        workspaceId: input.workspaceId,
        version: revision.version,
        snapshotJson: revision.snapshot,
        reviewStateJson: revision.reviewState,
        changeSummary: revision.changeSummary,
        createdBy: input.userId
      }
    });
    await (prisma() as any).blueprintAuditEvent.create({
      data: {
        id: auditEvent.id,
        workspaceId: input.workspaceId,
        blueprintId,
        revisionId,
        actorId: input.userId,
        action: auditEvent.action,
        beforeJson: auditEvent.before,
        afterJson: auditEvent.after,
        source: auditEvent.source
      }
    });
    const saved = await getLatestPortfolioBlueprint(input.workspaceId);
    return { blueprint: saved ?? record, revision, auditEvent };
  }

  const records = await readJson<PortfolioBlueprintRecord[]>(blueprintPath, []);
  const revisions = await readJson<PortfolioBlueprintRevisionRecord[]>(revisionPath, []);
  const events = await readJson<BlueprintAuditEventRecord[]>(auditPath, []);
  await writeJson(blueprintPath, [record, ...records.filter((item) => item.workspaceId !== input.workspaceId)]);
  await writeJson(revisionPath, [revision, ...revisions]);
  await writeJson(auditPath, [auditEvent, ...events]);
  return { blueprint: record, revision, auditEvent };
}

export async function rollbackPortfolioBlueprint(input: { workspaceId: string; userId: string; version: number }) {
  const revisions = await listPortfolioBlueprintRevisions(input.workspaceId);
  const target = revisions.find((revision) => revision.version === input.version);
  if (!target) return null;

  const saved = await savePortfolioBlueprint({
    workspaceId: input.workspaceId,
    userId: input.userId,
    blueprint: target.snapshot,
    reviewState: target.reviewState,
    changeSummary: `Rolled back to blueprint revision ${target.version}.`
  });

  if (shouldUseDatabase()) {
    await (prisma() as any).blueprintAuditEvent.create({
      data: {
        id: `blueprint_audit_${randomUUID()}`,
        workspaceId: input.workspaceId,
        blueprintId: saved.blueprint.id,
        revisionId: saved.revision.id,
        actorId: input.userId,
        action: "BLUEPRINT_ROLLED_BACK",
        beforeJson: null,
        afterJson: target.snapshot,
        source: "portfolio-review-workspace"
      }
    });
  } else {
    const events = await readJson<BlueprintAuditEventRecord[]>(auditPath, []);
    await writeJson(auditPath, [
      {
        id: `blueprint_audit_${randomUUID()}`,
        workspaceId: input.workspaceId,
        blueprintId: saved.blueprint.id,
        revisionId: saved.revision.id,
        actorId: input.userId,
        action: "BLUEPRINT_ROLLED_BACK",
        before: null,
        after: target.snapshot,
        createdAt: new Date().toISOString(),
        source: "portfolio-review-workspace"
      },
      ...events
    ]);
  }

  return saved;
}

export async function recordBlueprintAuditEvent(input: {
  workspaceId: string;
  blueprintId?: string;
  revisionId?: string;
  actorId?: string;
  action: BlueprintAuditEventRecord["action"];
  before?: unknown;
  after?: unknown;
  source?: BlueprintAuditEventRecord["source"];
}) {
  const event: BlueprintAuditEventRecord = {
    id: `blueprint_audit_${randomUUID()}`,
    workspaceId: input.workspaceId,
    blueprintId: input.blueprintId,
    revisionId: input.revisionId,
    actorId: input.actorId,
    action: input.action,
    before: input.before === undefined ? null : jsonSafe(input.before),
    after: input.after === undefined ? null : jsonSafe(input.after),
    createdAt: new Date().toISOString(),
    source: input.source ?? "api"
  };

  if (shouldUseDatabase()) {
    await ensureWorkspace(input.workspaceId);
    await (prisma() as any).blueprintAuditEvent.create({
      data: {
        id: event.id,
        workspaceId: event.workspaceId,
        blueprintId: event.blueprintId,
        revisionId: event.revisionId,
        actorId: event.actorId,
        action: event.action,
        beforeJson: event.before,
        afterJson: event.after,
        source: event.source
      }
    });
    return event;
  }

  const events = await readJson<BlueprintAuditEventRecord[]>(auditPath, []);
  await writeJson(auditPath, [event, ...events]);
  return event;
}
