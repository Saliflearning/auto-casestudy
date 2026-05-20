import { NextRequest, NextResponse } from "next/server";
import { evaluateCaseStudyQuality } from "@/lib/case-study-quality-engine";
import { getCaseStudyDraft, getLatestCaseStudyDraft } from "@/lib/server/case-study-draft-repository";
import { saveCaseStudyQualityReport } from "@/lib/server/case-study-quality-repository";
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
  const draft = draftId ? await getCaseStudyDraft(session.workspaceId, draftId) : await getLatestCaseStudyDraft(session.workspaceId);

  if (!draft) {
    const response = apiError("DRAFT_NOT_FOUND", "No case study draft is available to evaluate.", 404);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const report = evaluateCaseStudyQuality(draft);
  const saved = await saveCaseStudyQualityReport(report);
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: draft.blueprintId,
    actorId: session.userId,
    action: "CASE_STUDY_EVALUATED",
    after: {
      draftId: draft.id,
      reportId: saved.id,
      readiness: saved.readiness,
      overallScore: saved.scores.overall,
      blockers: saved.blockers.length
    },
    source: "api"
  });

  const response = NextResponse.json({ report: saved });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
