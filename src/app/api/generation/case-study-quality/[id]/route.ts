import { NextRequest, NextResponse } from "next/server";
import { getCaseStudyQualityReport, getLatestCaseStudyQualityReport } from "@/lib/server/case-study-quality-repository";
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
  const report = id === "latest" ? await getLatestCaseStudyQualityReport(session.workspaceId) : await getCaseStudyQualityReport(session.workspaceId, id);
  const response = report
    ? NextResponse.json({ report })
    : NextResponse.json({ error: { code: "NOT_FOUND", message: "Case study quality report was not found for this workspace." } }, { status: 404 });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
