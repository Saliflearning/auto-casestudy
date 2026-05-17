import { NextRequest } from "next/server";

const WORKSPACE_HEADER = "x-autocasestudy-workspace";
const WORKSPACE_COOKIE = "autocasestudy_workspace";
const DEFAULT_WORKSPACE = "demo-workspace";

function sanitizeWorkspaceId(value?: string | null) {
  if (!value) return DEFAULT_WORKSPACE;
  const normalized = value.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  return normalized || DEFAULT_WORKSPACE;
}

export function getWorkspaceId(request: Request | NextRequest) {
  const headerValue = request.headers.get(WORKSPACE_HEADER);
  if (headerValue) return sanitizeWorkspaceId(headerValue);

  if ("cookies" in request) {
    return sanitizeWorkspaceId(request.cookies.get(WORKSPACE_COOKIE)?.value);
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${WORKSPACE_COOKIE}=`));

  return sanitizeWorkspaceId(cookie?.split("=")[1]);
}

export function workspaceCookieHeader(workspaceId: string) {
  return `${WORKSPACE_COOKIE}=${sanitizeWorkspaceId(workspaceId)}; Path=/; SameSite=Lax; Max-Age=31536000`;
}
