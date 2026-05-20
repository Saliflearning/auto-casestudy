import { NextRequest, NextResponse } from "next/server";
import { getLatestCaseStudyDraft } from "@/lib/server/case-study-draft-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const body = await request.json().catch(() => ({}));
  const sectionId = typeof body.sectionId === "string" ? body.sectionId : "";
  const draft = await getLatestCaseStudyDraft(session.workspaceId);
  const section = draft?.sections.find((item) => item.id === sectionId);
  const response = section
    ? NextResponse.json({
        sectionId,
        valid: section.confidence !== "missing-evidence" && section.unsupportedClaims.length === 0,
        confidence: section.confidence,
        missingEvidence: section.missingEvidence,
        unsupportedClaims: section.unsupportedClaims,
        provenance: section.provenance
      })
    : NextResponse.json({ error: { code: "NOT_FOUND", message: "Section was not found in the latest draft." } }, { status: 404 });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
