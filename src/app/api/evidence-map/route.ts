import { NextResponse } from "next/server";
import { ProjectCluster } from "@/lib/types";
import { saveClusterDecision } from "@/lib/server/evidence-map-repository";

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
    !isStringArray(cluster.artifactIds) ||
    !isStringArray(cluster.reasons) ||
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
    reasons: cluster.reasons,
    confidenceScore: Math.max(0, Math.min(100, Math.round(cluster.confidenceScore))),
    status: cluster.status,
    createdAt: cluster.createdAt
  };
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const cluster = validateCluster(body.cluster);

  if (!cluster) {
    return NextResponse.json({ error: "A valid project cluster is required." }, { status: 400 });
  }

  const saved = await saveClusterDecision(cluster);
  return NextResponse.json({ cluster: saved });
}
