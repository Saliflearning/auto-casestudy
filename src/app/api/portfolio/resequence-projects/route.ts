import { NextRequest, NextResponse } from "next/server";
import { resequencePortfolioExperience } from "@/lib/portfolio-experience-orchestrator";
import { getPortfolioExperiencePlan, savePortfolioExperiencePlan } from "@/lib/server/portfolio-experience-repository";
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
  const planId = typeof body.planId === "string" ? body.planId : "";
  const projectIds = Array.isArray(body.projectIds) && body.projectIds.every((id: unknown) => typeof id === "string") ? body.projectIds : [];

  if (!planId || !projectIds.length) {
    const response = apiError("INVALID_INPUT", "planId and projectIds are required.", 422);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const plan = await getPortfolioExperiencePlan(session.workspaceId, planId);
  if (!plan) {
    const response = apiError("PLAN_NOT_FOUND", "Portfolio experience plan was not found for this workspace.", 404);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const next = resequencePortfolioExperience({ plan, projectIds });
  const saved = await savePortfolioExperiencePlan(next);
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: saved.blueprintId,
    actorId: session.userId,
    action: "PORTFOLIO_PROJECTS_RESEQUENCED",
    before: { planId, previousOrder: plan.projectSequence.map((project) => project.projectId) },
    after: { planId, nextOrder: saved.projectSequence.map((project) => project.projectId) },
    source: "api"
  });

  const response = NextResponse.json({ plan: saved });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
