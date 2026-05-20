import { NextRequest, NextResponse } from "next/server";
import { ConfirmedPortfolioBlueprint, PortfolioBlueprintReviewState } from "@/lib/portfolio-blueprint-types";
import {
  getLatestPortfolioBlueprint,
  listBlueprintAuditEvents,
  listPortfolioBlueprintRevisions,
  savePortfolioBlueprint
} from "@/lib/server/portfolio-blueprint-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateReviewState(value: unknown): PortfolioBlueprintReviewState | null {
  if (!isRecord(value)) return null;
  if (typeof value.approvedHomepage !== "boolean") return null;
  if (!Array.isArray(value.projectOrder) || !isStringArray(value.projectOrder)) return null;
  if (!Array.isArray(value.rejectedProjectIds) || !isStringArray(value.rejectedProjectIds)) return null;
  if (typeof value.homepageTone !== "string") return null;
  if (!isRecord(value.mediaDecisions) || !isRecord(value.blockerDecisions) || !isRecord(value.missingEvidenceNotes) || !isRecord(value.sectionNotes)) {
    return null;
  }

  return value as PortfolioBlueprintReviewState;
}

function validateBlueprint(value: unknown): ConfirmedPortfolioBlueprint | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.status !== "string" ||
    typeof value.archetype !== "string" ||
    typeof value.readinessScore !== "number" ||
    !isRecord(value.approvedHomepageStrategy) ||
    !isStringArray(value.approvedProjectOrder) ||
    !isStringArray(value.rejectedProjectIds) ||
    !isStringArray(value.approvedVisualIds) ||
    !isStringArray(value.privateVisualIds) ||
    !isStringArray(value.rejectedVisualIds) ||
    !isStringArray(value.resolvedBlockerIds) ||
    !isStringArray(value.unresolvedBlockerIds) ||
    !isStringArray(value.skippedBlockerIds) ||
    !isStringArray(value.recruiterStrategy) ||
    !Array.isArray(value.provenance)
  ) {
    return null;
  }

  return {
    ...(value as ConfirmedPortfolioBlueprint),
    readinessScore: Math.max(0, Math.min(100, Math.round(value.readinessScore)))
  };
}

export async function GET(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const [blueprint, revisions, auditEvents] = await Promise.all([
    getLatestPortfolioBlueprint(session.workspaceId),
    listPortfolioBlueprintRevisions(session.workspaceId),
    listBlueprintAuditEvents(session.workspaceId)
  ]);
  const response = NextResponse.json({
    blueprint,
    revisionCount: revisions.length,
    latestRevision: revisions[0] ?? null,
    auditEventCount: auditEvents.length
  });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}

export async function PUT(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  if (!isRecord(body)) {
    return apiError("VALIDATION_ERROR", "Request body must be an object.", 422);
  }

  const blueprint = validateBlueprint(body.blueprint);
  const reviewState = validateReviewState(body.reviewState);
  const changeSummary = typeof body.changeSummary === "string" ? body.changeSummary.slice(0, 240) : undefined;

  if (!blueprint || !reviewState) {
    return apiError("VALIDATION_ERROR", "A valid confirmed blueprint and review state are required.", 422);
  }

  const saved = await savePortfolioBlueprint({ workspaceId: session.workspaceId, userId: session.userId, blueprint, reviewState, changeSummary });
  const revisions = await listPortfolioBlueprintRevisions(session.workspaceId);
  const response = NextResponse.json({
    blueprint: saved.blueprint,
    revision: saved.revision,
    revisionCount: revisions.length
  });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
