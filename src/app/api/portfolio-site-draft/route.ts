import { NextRequest, NextResponse } from "next/server";
import { normalizePortfolioSiteDraft } from "@/lib/portfolio-builder-engine";
import { PortfolioSiteDraft } from "@/lib/portfolio-site-draft-types";
import { getLatestPortfolioSiteDraft, savePortfolioSiteDraft } from "@/lib/server/portfolio-site-draft-repository";
import { recordBlueprintAuditEvent } from "@/lib/server/portfolio-blueprint-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validateDraft(value: unknown, workspaceId: string): PortfolioSiteDraft | null {
  if (!isRecord(value)) return null;
  if (value.workspaceId !== workspaceId) return null;
  if (typeof value.id !== "string" || typeof value.status !== "string") return null;
  if (!isRecord(value.homepage) || !Array.isArray(value.navigation) || !Array.isArray(value.projectPages)) return null;
  if (!isRecord(value.theme) || !isRecord(value.responsivePreview)) return null;
  if (!Array.isArray(value.guardrails) || !Array.isArray(value.provenance)) return null;
  return value as PortfolioSiteDraft;
}

export async function GET(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const draft = await getLatestPortfolioSiteDraft(session.workspaceId);
  const response = NextResponse.json({ draft });
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

  const draft = isRecord(body) ? validateDraft(body.draft, session.workspaceId) : null;
  if (!draft) {
    const response = apiError("VALIDATION_ERROR", "A valid workspace-scoped portfolio site draft is required.", 422);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const saved = await savePortfolioSiteDraft(normalizePortfolioSiteDraft(draft));
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: saved.blueprintId,
    actorId: session.userId,
    action: "PORTFOLIO_SITE_DRAFT_SAVED",
    after: {
      draftId: saved.id,
      status: saved.status,
      projectPages: saved.projectPages.length,
      guardrails: saved.guardrails.length
    },
    source: "api"
  });
  const response = NextResponse.json({ draft: saved });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
