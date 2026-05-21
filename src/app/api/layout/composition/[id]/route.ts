import { NextRequest, NextResponse } from "next/server";
import { getLatestPortfolioPageComposition, getPortfolioPageComposition } from "@/lib/server/layout-composition-repository";
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
  const draftId = request.nextUrl.searchParams.get("draftId") ?? undefined;
  const composition =
    id === "latest"
      ? await getLatestPortfolioPageComposition(session.workspaceId, draftId)
      : await getPortfolioPageComposition(session.workspaceId, id);
  const response = composition
    ? NextResponse.json({ composition })
    : NextResponse.json({ error: { code: "NOT_FOUND", message: "Layout composition was not found for this workspace." } }, { status: 404 });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
