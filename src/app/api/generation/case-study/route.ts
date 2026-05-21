import { NextRequest, NextResponse } from "next/server";
import { generateConstrainedCaseStudy } from "@/lib/constrained-generation-engine";
import { validateGenerationReadiness } from "@/lib/generation-readiness";
import { getLatestPortfolioBlueprint, recordBlueprintAuditEvent } from "@/lib/server/portfolio-blueprint-repository";
import { listArtifacts } from "@/lib/server/artifact-repository";
import { saveCaseStudyDraft, getLatestCaseStudyDraft } from "@/lib/server/case-study-draft-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

function apiError(code: string, message: string, status: number, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

export async function GET(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const draft = await getLatestCaseStudyDraft(session.workspaceId);
  const response = NextResponse.json({ draft });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}

export async function POST(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const blueprint = await getLatestPortfolioBlueprint(session.workspaceId);
  const readiness = validateGenerationReadiness({ workspaceId: session.workspaceId, blueprint });

  if (!blueprint || !readiness.canGenerate) {
    await recordBlueprintAuditEvent({
      workspaceId: session.workspaceId,
      blueprintId: blueprint?.id,
      actorId: session.userId,
      action: "GENERATION_BLOCKED",
      after: readiness,
      source: "api"
    });
    const response = apiError("GENERATION_NOT_READY", "Complete the portfolio plan and resolve open issues before generating a case study.", 409, readiness);
    setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
    return response;
  }

  const artifacts = await listArtifacts(session.workspaceId);
  const draft = generateConstrainedCaseStudy({
    workspaceId: session.workspaceId,
    blueprint,
    artifacts
  });
  const saved = await saveCaseStudyDraft(draft);
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: blueprint.id,
    actorId: session.userId,
    action: "CASE_STUDY_GENERATED",
    after: {
      draftId: saved.id,
      projectId: saved.projectId,
      blueprintVersion: saved.blueprintVersion,
      unresolvedIssues: saved.unresolvedIssues
    },
    source: "api"
  });

  const response = NextResponse.json({ draft: saved, readiness });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
