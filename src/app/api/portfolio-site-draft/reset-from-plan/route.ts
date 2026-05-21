import { NextRequest, NextResponse } from "next/server";
import { buildPortfolioSiteDraftFromPlan } from "@/lib/portfolio-builder-engine";
import { getLatestCaseStudyDraft } from "@/lib/server/case-study-draft-repository";
import { listPortfolioPageCompositions } from "@/lib/server/layout-composition-repository";
import { getLatestPortfolioBlueprint, recordBlueprintAuditEvent } from "@/lib/server/portfolio-blueprint-repository";
import { getLatestPortfolioExperiencePlan } from "@/lib/server/portfolio-experience-repository";
import { savePortfolioSiteDraft } from "@/lib/server/portfolio-site-draft-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const [experiencePlan, compositions, caseStudyDraft, blueprint] = await Promise.all([
    getLatestPortfolioExperiencePlan(session.workspaceId),
    listPortfolioPageCompositions(session.workspaceId),
    getLatestCaseStudyDraft(session.workspaceId),
    getLatestPortfolioBlueprint(session.workspaceId)
  ]);
  const draft = buildPortfolioSiteDraftFromPlan({
    workspaceId: session.workspaceId,
    experiencePlan,
    compositions,
    caseStudyDraft,
    blueprint
  });
  const saved = await savePortfolioSiteDraft(draft);
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: blueprint?.id,
    actorId: session.userId,
    action: "PORTFOLIO_SITE_DRAFT_RESET",
    after: {
      draftId: saved.id,
      sourceExperiencePlanId: saved.sourceExperiencePlanId,
      sourceCompositionIds: saved.sourceCompositionIds,
      guardrails: saved.guardrails.length
    },
    source: "api"
  });
  const response = NextResponse.json({ draft: saved });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
