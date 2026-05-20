import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  const { workspace, membership } = await ensureWorkspaceMembership(session);
  const response = NextResponse.json({
    workspace: {
      id: workspace.id,
      name: workspace.name
    },
    user: {
      id: session.userId
    },
    membership: {
      role: membership.role
    },
    authMode: "signed-workspace-session",
    productionAuthRequired: true
  });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
