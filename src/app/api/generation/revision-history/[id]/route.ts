import { NextRequest, NextResponse } from "next/server";
import { listCaseStudyRevisions } from "@/lib/server/revision-audit-repository";
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
  const revisions = await listCaseStudyRevisions(session.workspaceId, id);
  const response = NextResponse.json({ revisions });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
