import { NextRequest, NextResponse } from "next/server";
import { evaluateCaseStudyQuality } from "@/lib/case-study-quality-engine";
import { getCaseStudyDraft, updateDraftSection } from "@/lib/server/case-study-draft-repository";
import { saveCaseStudyQualityReport } from "@/lib/server/case-study-quality-repository";
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
    const response = apiError("REVISION_ALREADY_DECIDED", "Only proposed revisions can be accepted.", 409);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const draft = await getCaseStudyDraft(session.workspaceId, revision.draftId);
  const section = draft?.sections.find((item) => item.id === revision.sectionId);
  if (!draft || !section) {
    const response = apiError("DRAFT_SECTION_NOT_FOUND", "The draft section for this revision no longer exists.", 404);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  if (!section.editable) {
    const response = apiError("SECTION_LOCKED", "Locked sections cannot accept revisions until they are unlocked.", 409);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  if (section.content !== revision.originalContent) {
    const response = apiError(
      "SECTION_CHANGED",
      "This section changed after the revision was proposed. Create a fresh revision from the latest text before accepting.",
      409
    );
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const accepted = await updateRevisionStatus(session.workspaceId, revision.id, "Accepted", session.userId);
  if (!accepted) {
    const response = apiError("REVISION_ALREADY_DECIDED", "This revision was already accepted or rejected.", 409);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const updatedDraft = await updateDraftSection({
    workspaceId: session.workspaceId,
    draftId: draft.id,
    sectionId: section.id,
    content: revision.revisedContent
  });

  if (!updatedDraft) {
    const response = apiError("DRAFT_UPDATE_FAILED", "The draft could not be updated with this revision.", 500);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const report = await saveCaseStudyQualityReport(evaluateCaseStudyQuality(updatedDraft));
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: updatedDraft.blueprintId,
    actorId: session.userId,
    action: "CASE_STUDY_REVISION_ACCEPTED",
    before: {
      sectionId: section.id,
      content: revision.originalContent
    },
    after: {
      revisionId: revision.id,
      sectionId: section.id,
      qualityReportId: report.id,
      overallScore: report.scores.overall
    },
    source: "api"
  });

  const response = NextResponse.json({ revision: accepted, draft: updatedDraft, report });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
