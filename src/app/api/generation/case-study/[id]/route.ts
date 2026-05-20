import { NextRequest, NextResponse } from "next/server";
import { getCaseStudyDraft } from "@/lib/server/case-study-draft-repository";
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
  const draft = await getCaseStudyDraft(session.workspaceId, id);
  const response = draft
    ? NextResponse.json({ draft })
    : NextResponse.json({ error: { code: "NOT_FOUND", message: "Case study draft was not found for this workspace." } }, { status: 404 });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
