import { NextRequest, NextResponse } from "next/server";
import { listPortfolioBlueprintRevisions, rollbackPortfolioBlueprint } from "@/lib/server/portfolio-blueprint-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const revisions = await listPortfolioBlueprintRevisions(session.workspaceId);
  const response = NextResponse.json({ revisions });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}

export async function POST(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const version = typeof body === "object" && body !== null && "version" in body ? Number((body as { version: unknown }).version) : NaN;
  if (!Number.isInteger(version) || version < 1) {
    return apiError("VALIDATION_ERROR", "A valid revision version is required.", 422);
  }

  const rolledBack = await rollbackPortfolioBlueprint({ workspaceId: session.workspaceId, userId: session.userId, version });
  if (!rolledBack) {
    return apiError("NOT_FOUND", "Blueprint revision was not found for this workspace.", 404);
  }

  const revisions = await listPortfolioBlueprintRevisions(session.workspaceId);
  const response = NextResponse.json({ blueprint: rolledBack.blueprint, revision: rolledBack.revision, revisionCount: revisions.length });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
