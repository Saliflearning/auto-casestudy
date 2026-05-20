import { NextRequest, NextResponse } from "next/server";
import { buildSectionRevision } from "@/lib/case-study-revision-engine";
import { RevisionGoal } from "@/lib/case-study-revision-types";
import { suggestedRevisionGoal } from "@/lib/revision-suggestion-engine";
import { getCaseStudyDraft, getLatestCaseStudyDraft, updateDraftSection } from "@/lib/server/case-study-draft-repository";
import { getLatestCaseStudyQualityReport } from "@/lib/server/case-study-quality-repository";
import { recordBlueprintAuditEvent } from "@/lib/server/portfolio-blueprint-repository";
import { saveCaseStudyRevision } from "@/lib/server/revision-audit-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

const revisionGoals: RevisionGoal[] = [
  "recruiter readability",
  "stronger storytelling",
  "better clarity",
  "better structure",
  "less AI-sounding language",
  "stronger outcomes",
  "stronger technical depth",
  "archetype alignment"
];

function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const body = await request.json().catch(() => ({}));
  const draftId = typeof body.draftId === "string" ? body.draftId : "";
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const currentContent = typeof body.currentContent === "string" ? body.currentContent.trim() : "";
  const requestedGoal = revisionGoals.includes(body.goal) ? (body.goal as RevisionGoal) : null;
  let draft = draftId ? await getCaseStudyDraft(session.workspaceId, draftId) : await getLatestCaseStudyDraft(session.workspaceId);

  if (!draft) {
    const response = apiError("DRAFT_NOT_FOUND", "No case study draft is available to revise.", 404);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const section = draft.sections.find((item) => item.id === sectionId);
  if (!section) {
    const response = apiError("SECTION_NOT_FOUND", "The requested section was not found in this draft.", 404);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  if (!section.editable) {
    const response = apiError("SECTION_LOCKED", "Locked sections cannot be regenerated. Unlock the section before requesting a revision.", 409);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  if (currentContent.length > 12000) {
    const response = apiError("SECTION_TOO_LONG", "Section content is too long to revise safely in this MVP.", 413);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  if (currentContent && currentContent !== section.content) {
    const updatedDraft = await updateDraftSection({
      workspaceId: session.workspaceId,
      draftId: draft.id,
      sectionId,
      content: currentContent
    });
    if (!updatedDraft) {
      const response = apiError("SECTION_UPDATE_FAILED", "The latest manual edit could not be saved before revision.", 409);
      setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
      return response;
    }
    draft = updatedDraft;
  }

  const qualityReport = await getLatestCaseStudyQualityReport(session.workspaceId, draft.id);
  const goal = requestedGoal ?? suggestedRevisionGoal(draft, qualityReport, sectionId);
  const revision = buildSectionRevision({
    workspaceId: session.workspaceId,
    draft,
    qualityReport,
    sectionId,
    goal,
    actorId: session.userId
  });
  const saved = await saveCaseStudyRevision(revision);
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: draft.blueprintId,
    actorId: session.userId,
    action: "CASE_STUDY_REVISION_PROPOSED",
    after: {
      revisionId: saved.id,
      draftId: saved.draftId,
      sectionId: saved.sectionId,
      goal: saved.goal,
      qualityDelta: saved.qualityDelta
    },
    source: "api"
  });

  const response = NextResponse.json({ revision: saved });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
