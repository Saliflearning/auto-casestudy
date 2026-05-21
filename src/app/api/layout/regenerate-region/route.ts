import { NextRequest, NextResponse } from "next/server";
import { regenerateCompositionRegion } from "@/lib/layout-composition-engine";
import { getPortfolioPageComposition, savePortfolioPageComposition } from "@/lib/server/layout-composition-repository";
import { recordBlueprintAuditEvent } from "@/lib/server/portfolio-blueprint-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const body = await request.json().catch(() => ({}));
  const compositionId = typeof body.compositionId === "string" ? body.compositionId : "";
  const regionId = typeof body.regionId === "string" ? body.regionId : "";

  if (!compositionId || !regionId) {
    const response = apiError("INVALID_INPUT", "compositionId and regionId are required.", 422);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const composition = await getPortfolioPageComposition(session.workspaceId, compositionId);
  if (!composition) {
    const response = apiError("COMPOSITION_NOT_FOUND", "Layout composition was not found for this workspace.", 404);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const next = regenerateCompositionRegion({ composition, regionId });
  const saved = await savePortfolioPageComposition(next);
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    actorId: session.userId,
    action: "LAYOUT_REGION_REGENERATED",
    before: { compositionId, regionId },
    after: { compositionId: saved.id, regionId },
    source: "api"
  });

  const response = NextResponse.json({ composition: saved });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
