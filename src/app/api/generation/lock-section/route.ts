import { NextRequest, NextResponse } from "next/server";
import { updateDraftSection } from "@/lib/server/case-study-draft-repository";
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
  const draftId = typeof body.draftId === "string" ? body.draftId : "";
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const locked = Boolean(body.locked);

  const draft = await updateDraftSection({
    workspaceId: session.workspaceId,
    draftId,
    sectionId,
    locked
  });

  if (!draft) {
    const response = apiError("DRAFT_SECTION_NOT_FOUND", "The requested draft section was not found.", 404);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: draft.blueprintId,
    actorId: session.userId,
    action: "CASE_STUDY_SECTION_LOCKED",
    after: { draftId, sectionId, locked },
    source: "api"
  });

  const response = NextResponse.json({ draft });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
