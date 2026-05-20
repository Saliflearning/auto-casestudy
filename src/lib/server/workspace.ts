import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";

const WORKSPACE_HEADER = "x-autocasestudy-workspace";
const WORKSPACE_COOKIE = "autocasestudy_workspace";
const WORKSPACE_SESSION_COOKIE = "autocasestudy_workspace_session";
const DEFAULT_WORKSPACE = "demo-workspace";
const DEFAULT_USER = "demo-user";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type WorkspaceRole = "owner" | "editor" | "reviewer" | "mentor" | "recruiter-viewer";

export type WorkspaceSession = {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  issuedAt: string;
};

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

function secret() {
  const configured = process.env.AUTOCASESTUDY_WORKSPACE_SECRET || process.env.NEXTAUTH_SECRET;
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTOCASESTUDY_WORKSPACE_SECRET is required in production.");
  }
  return "local-dev-autocasestudy-workspace-secret";
}

function base64url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function getCookieValue(request: Request | NextRequest, cookieName: string) {
  if ("cookies" in request) {
    return request.cookies.get(cookieName)?.value;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.split("=")[1];
}

function verifySessionCookie(value?: string | null): WorkspaceSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64url(payload)) as Partial<WorkspaceSession>;
    if (!parsed.workspaceId || !parsed.userId || !parsed.role || !parsed.issuedAt) return null;
    return {
      workspaceId: sanitizeWorkspaceId(parsed.workspaceId),
      userId: sanitizeWorkspaceId(parsed.userId),
      role: parsed.role,
      issuedAt: parsed.issuedAt
    };
  } catch {
    return null;
  }
}

export function createWorkspaceSession(workspaceId = DEFAULT_WORKSPACE, userId = DEFAULT_USER): WorkspaceSession {
  return {
    workspaceId: sanitizeWorkspaceId(workspaceId),
    userId: sanitizeWorkspaceId(userId || `user_${randomUUID()}`),
    role: "owner",
    issuedAt: new Date().toISOString()
  };
}

export function workspaceSessionCookieHeader(session: WorkspaceSession) {
  const payload = base64url(JSON.stringify(session));
  const cookie = `${payload}.${sign(payload)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${WORKSPACE_SESSION_COOKIE}=${cookie}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function requireWorkspaceSession(request: Request | NextRequest) {
  const existing = verifySessionCookie(getCookieValue(request, WORKSPACE_SESSION_COOKIE));
  const session = existing ?? createWorkspaceSession(getWorkspaceId(request), DEFAULT_USER);
  return {
    session,
    setCookieHeaders: [workspaceCookieHeader(session.workspaceId), workspaceSessionCookieHeader(session)]
  };
}
