import { NextRequest, NextResponse } from "next/server";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  const { workspace, membership } = await ensureWorkspaceMembership(session);
  const response = NextResponse.json({
    workspaces: [
      {
        id: workspace.id,
        name: workspace.name,
        role: membership.role
      }
    ]
  });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
