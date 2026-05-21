import { NextRequest, NextResponse } from "next/server";
import { composePortfolioCaseStudyPage } from "@/lib/portfolio-page-composer";
import { getCaseStudyDraft, getLatestCaseStudyDraft } from "@/lib/server/case-study-draft-repository";
import { getLatestCaseStudyQualityReport } from "@/lib/server/case-study-quality-repository";
import { savePortfolioPageComposition } from "@/lib/server/layout-composition-repository";
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
    const response = apiError("DRAFT_NOT_FOUND", "No persisted case study draft is available for layout composition.", 404);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const qualityReport = await getLatestCaseStudyQualityReport(session.workspaceId, draft.id);
  const composition = composePortfolioCaseStudyPage({
    workspaceId: session.workspaceId,
    draft,
    qualityReport
  });
  const saved = await savePortfolioPageComposition(composition);

  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: draft.blueprintId,
    actorId: session.userId,
    action: "LAYOUT_COMPOSITION_CREATED",
    after: {
      compositionId: saved.id,
      draftId: draft.id,
      regionCount: saved.regions.length,
      unresolvedWarnings: saved.unresolvedWarnings.length
    },
    source: "api"
  });

  const response = NextResponse.json({ composition: saved });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
