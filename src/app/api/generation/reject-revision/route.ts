import { NextRequest, NextResponse } from "next/server";
import { recordBlueprintAuditEvent } from "@/lib/server/portfolio-blueprint-repository";
import { getCaseStudyRevision, updateRevisionStatus } from "@/lib/server/revision-audit-repository";
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
  const revisionId = typeof body.revisionId === "string" ? body.revisionId : "";
  const revision = await getCaseStudyRevision(session.workspaceId, revisionId);

  if (!revision) {
    const response = apiError("REVISION_NOT_FOUND", "The requested revision was not found for this workspace.", 404);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  if (revision.status !== "Proposed") {
    const response = apiError("REVISION_ALREADY_DECIDED", "Only proposed revisions can be rejected.", 409);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const rejected = await updateRevisionStatus(session.workspaceId, revision.id, "Rejected", session.userId);
  if (!rejected) {
    const response = apiError("REVISION_ALREADY_DECIDED", "This revision was already accepted or rejected.", 409);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    actorId: session.userId,
    action: "CASE_STUDY_REVISION_REJECTED",
    after: {
      revisionId: revision.id,
      draftId: revision.draftId,
      sectionId: revision.sectionId
    },
    source: "api"
  });

  const response = NextResponse.json({ revision: rejected });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
