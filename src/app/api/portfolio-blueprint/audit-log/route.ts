import { NextRequest, NextResponse } from "next/server";
import { listBlueprintAuditEvents } from "@/lib/server/portfolio-blueprint-repository";
import { getWorkspaceId, workspaceCookieHeader } from "@/lib/server/workspace";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const workspaceId = getWorkspaceId(request);
  const auditEvents = await listBlueprintAuditEvents(workspaceId);
  const response = NextResponse.json({ auditEvents });
  response.headers.append("Set-Cookie", workspaceCookieHeader(workspaceId));
  return response;
}
