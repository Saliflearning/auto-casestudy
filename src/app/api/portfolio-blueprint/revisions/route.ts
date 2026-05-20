import { NextRequest, NextResponse } from "next/server";
import { listPortfolioBlueprintRevisions, rollbackPortfolioBlueprint } from "@/lib/server/portfolio-blueprint-repository";
import { getWorkspaceId, workspaceCookieHeader } from "@/lib/server/workspace";

export const runtime = "nodejs";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function GET(request: NextRequest) {
  const workspaceId = getWorkspaceId(request);
  const revisions = await listPortfolioBlueprintRevisions(workspaceId);
  const response = NextResponse.json({ revisions });
  response.headers.append("Set-Cookie", workspaceCookieHeader(workspaceId));
  return response;
}

export async function POST(request: NextRequest) {
  const workspaceId = getWorkspaceId(request);
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

  const rolledBack = await rollbackPortfolioBlueprint({ workspaceId, userId: workspaceId, version });
  if (!rolledBack) {
    return apiError("NOT_FOUND", "Blueprint revision was not found for this workspace.", 404);
  }

  const revisions = await listPortfolioBlueprintRevisions(workspaceId);
  const response = NextResponse.json({ blueprint: rolledBack.blueprint, revision: rolledBack.revision, revisionCount: revisions.length });
  response.headers.append("Set-Cookie", workspaceCookieHeader(workspaceId));
  return response;
}
