import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ProjectCluster } from "@/lib/types";
import { saveClusterDecision } from "@/lib/server/evidence-map-repository";
import { listArtifacts } from "@/lib/server/artifact-repository";
import { getWorkspaceId, workspaceCookieHeader } from "@/lib/server/workspace";

export const runtime = "nodejs";

const clusterStatuses = new Set(["Suggested", "Confirmed", "Rejected", "Needs Review"]);

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateCluster(value: unknown): ProjectCluster | null {
  if (!value || typeof value !== "object") return null;
  const cluster = value as Partial<ProjectCluster>;

  if (
    typeof cluster.id !== "string" ||
    typeof cluster.label !== "string" ||
    cluster.label.length > 120 ||
    !isStringArray(cluster.artifactIds) ||
    cluster.artifactIds.length > 50 ||
    !isStringArray(cluster.reasons) ||
    cluster.reasons.length > 12 ||
    typeof cluster.confidenceScore !== "number" ||
    typeof cluster.status !== "string" ||
    !clusterStatuses.has(cluster.status) ||
    typeof cluster.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: cluster.id,
    label: cluster.label.trim() || "Untitled project cluster",
    artifactIds: Array.from(new Set(cluster.artifactIds)),
    reasons: cluster.reasons.map((reason) => reason.slice(0, 240)),
    confidenceScore: Math.max(0, Math.min(100, Math.round(cluster.confidenceScore))),
    status: cluster.status,
    createdAt: cluster.createdAt
  };
}

export async function PATCH(request: NextRequest) {
  const workspaceId = getWorkspaceId(request);
  const body = await request.json();
  const cluster = validateCluster(body.cluster);

  if (!cluster) {
    return NextResponse.json({ error: "A valid project cluster is required." }, { status: 400 });
  }

  const artifacts = await listArtifacts(workspaceId);
  const knownArtifactIds = new Set(artifacts.map((artifact) => artifact.id));
  const hasUnknownArtifacts = cluster.artifactIds.some((artifactId) => !knownArtifactIds.has(artifactId));
  if (hasUnknownArtifacts) {
    return NextResponse.json({ error: "Cluster contains artifacts outside this workspace." }, { status: 403 });
  }

  const saved = await saveClusterDecision(cluster, workspaceId);
  const response = NextResponse.json({ cluster: saved });
  response.headers.append("Set-Cookie", workspaceCookieHeader(workspaceId));
  return response;
}
