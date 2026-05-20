import { NextRequest, NextResponse } from "next/server";
import { validateGenerationReadiness } from "@/lib/generation-readiness";
import { getLatestPortfolioBlueprint, recordBlueprintAuditEvent } from "@/lib/server/portfolio-blueprint-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const blueprint = await getLatestPortfolioBlueprint(session.workspaceId);
  const readiness = validateGenerationReadiness({ workspaceId: session.workspaceId, blueprint });
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: blueprint?.id,
    actorId: session.userId,
    action: readiness.canGenerate ? "GENERATION_READINESS_CHECKED" : "GENERATION_BLOCKED",
    after: readiness,
    source: "api"
  });

  const response = NextResponse.json({ readiness, allowed: readiness.canGenerate }, { status: readiness.canGenerate ? 200 : 409 });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
