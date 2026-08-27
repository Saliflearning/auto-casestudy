import { describe, expect, it } from "vitest";

import {
  createWorkspaceSession,
  requireWorkspaceSession,
  workspaceSessionCookieHeader
} from "@/lib/server/workspace";

function cookieValue(header: string) {
  return header.split(";")[0];
}

describe("workspace sessions", () => {
  it("round-trips a signed HttpOnly workspace session", () => {
    const session = createWorkspaceSession("portfolio-workspace", "synthetic-owner");
    const setCookie = workspaceSessionCookieHeader(session);
    const request = new Request("https://example.test/api/projects", {
      headers: { cookie: cookieValue(setCookie) }
    });

    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("SameSite=Lax");
    expect(requireWorkspaceSession(request).session).toMatchObject({
      workspaceId: "portfolio-workspace",
      userId: "synthetic-owner",
      role: "owner"
    });
  });

  it("rejects a tampered signature and falls back to a safe demo session", () => {
    const session = createWorkspaceSession("private-workspace", "synthetic-owner");
    const cookie = cookieValue(workspaceSessionCookieHeader(session));
    const request = new Request("https://example.test/api/projects", {
      headers: { cookie: `${cookie.slice(0, -1)}x` }
    });

    expect(requireWorkspaceSession(request).session).toMatchObject({
      workspaceId: "demo-workspace",
      userId: "demo-user",
      role: "owner"
    });
  });
});
