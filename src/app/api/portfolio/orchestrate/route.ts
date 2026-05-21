import { NextRequest, NextResponse } from "next/server";
import { orchestratePortfolioExperience } from "@/lib/portfolio-experience-orchestrator";
import { listArtifacts } from "@/lib/server/artifact-repository";
import { getLatestPortfolioBlueprint, recordBlueprintAuditEvent } from "@/lib/server/portfolio-blueprint-repository";
import { savePortfolioExperiencePlan } from "@/lib/server/portfolio-experience-repository";
import { listPortfolioPageCompositions } from "@/lib/server/layout-composition-repository";
import { requireWorkspaceSession } from "@/lib/server/workspace";
import { ensureWorkspaceMembership } from "@/lib/server/workspace-repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { session, setCookieHeaders } = requireWorkspaceSession(request);
  await ensureWorkspaceMembership(session);
  const [blueprint, compositions, artifacts] = await Promise.all([
    getLatestPortfolioBlueprint(session.workspaceId),
    listPortfolioPageCompositions(session.workspaceId),
    listArtifacts(session.workspaceId)
  ]);
  const plan = orchestratePortfolioExperience({
    workspaceId: session.workspaceId,
    blueprint,
    compositions,
    artifacts
  });
  const saved = await savePortfolioExperiencePlan(plan);
  await recordBlueprintAuditEvent({
    workspaceId: session.workspaceId,
    blueprintId: blueprint?.id,
    actorId: session.userId,
    action: "PORTFOLIO_EXPERIENCE_ORCHESTRATED",
    after: {
      planId: saved.id,
      status: saved.status,
      projectCount: saved.projectSequence.length,
      warningCount: saved.unresolvedWarnings.length
    },
    source: "api"
  });

  const response = NextResponse.json({ plan: saved });
  setCookieHeaders.forEach((cookie) => response.headers.append("Set-Cookie", cookie));
  return response;
}
