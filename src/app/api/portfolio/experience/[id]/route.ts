import { NextRequest, NextResponse } from "next/server";
import { getLatestPortfolioExperiencePlan, getPortfolioExperiencePlan } from "@/lib/server/portfolio-experience-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const { id } = await context.params;
  const plan = id === "latest" ? await getLatestPortfolioExperiencePlan(session.workspaceId) : await getPortfolioExperiencePlan(session.workspaceId, id);
  const response = plan
    ? NextResponse.json({ plan })
    : NextResponse.json({ error: { code: "NOT_FOUND", message: "Portfolio experience plan was not found for this workspace." } }, { status: 404 });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
