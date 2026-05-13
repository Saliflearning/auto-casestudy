import { randomUUID } from "node:crypto";
import { Artifact, ArtifactRelationship, ArtifactRelationshipType, ProjectCluster } from "@/lib/types";

function normalize(value?: string) {
  return value?.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() ?? "";
}

function overlap(left: string[] = [], right: string[] = []) {
  const normalizedRight = right.map(normalize);
  return left.filter((item) => normalizedRight.includes(normalize(item)));
}

function relationshipBetween(source: Artifact, target: Artifact): ArtifactRelationship[] {
  const sourceClass = source.classification;
  const targetClass = target.classification;
  if (!sourceClass || !targetClass) return [];

  const createdAt = new Date().toISOString();
  const relationships: ArtifactRelationship[] = [];

  if (normalize(sourceClass.projectName) && normalize(sourceClass.projectName) === normalize(targetClass.projectName)) {
    relationships.push({
      id: `relationship_${randomUUID()}`,
      sourceArtifactId: source.id,
      targetArtifactId: target.id,
      type: "same project",
      reason: `Both artifacts reference project clue "${sourceClass.projectName}".`,
      confidenceScore: 86,
      status: "Suggested",
      createdAt
    });
  }

  if (normalize(sourceClass.courseOrJob) && normalize(sourceClass.courseOrJob) === normalize(targetClass.courseOrJob)) {
    relationships.push({
      id: `relationship_${randomUUID()}`,
      sourceArtifactId: source.id,
      targetArtifactId: target.id,
      type: "same course/job",
      reason: `Both artifacts reference "${sourceClass.courseOrJob}".`,
      confidenceScore: 78,
      status: "Suggested",
      createdAt
    });
  }

  for (const tool of overlap(sourceClass.tools, targetClass.tools).slice(0, 2)) {
    relationships.push({
      id: `relationship_${randomUUID()}`,
      sourceArtifactId: source.id,
      targetArtifactId: target.id,
      type: "same tool",
      reason: `Both artifacts mention ${tool}.`,
      confidenceScore: 68,
      status: "Suggested",
      createdAt
    });
  }

  if (overlap(sourceClass.dates, targetClass.dates).length) {
    relationships.push({
      id: `relationship_${randomUUID()}`,
      sourceArtifactId: source.id,
      targetArtifactId: target.id,
      type: "possible timeline connection",
      reason: "Artifacts share date clues that may belong to the same timeline.",
      confidenceScore: 58,
      status: "Suggested",
      createdAt
    });
  }

  const supportingPairs: Array<[string, string, ArtifactRelationshipType]> = [
    ["research notes", "design artifact", "supporting evidence"],
    ["research notes", "presentation", "supporting evidence"],
    ["project report", "presentation", "supporting evidence"],
    ["technical documentation", "project report", "supporting evidence"]
  ];

  const pair = [sourceClass.classification, targetClass.classification].sort().join("|");
  const hasSupportingPair = supportingPairs.some(([a, b]) => [a, b].sort().join("|") === pair);
  if (hasSupportingPair) {
    relationships.push({
      id: `relationship_${randomUUID()}`,
      sourceArtifactId: source.id,
      targetArtifactId: target.id,
      type: "supporting evidence",
      reason: `${sourceClass.classification} can support ${targetClass.classification} in a case study evidence map.`,
      confidenceScore: 52,
      status: "Suggested",
      createdAt
    });
  }

  return relationships;
}

function labelForCluster(artifacts: Artifact[]) {
  const named = artifacts.find((artifact) => artifact.classification?.projectName)?.classification?.projectName;
  if (named) return named;
  const first = artifacts[0]?.sourceLabel ?? "Untitled Project Cluster";
  return first.replace(/[_-]+/g, " ");
}

export function mapArtifactRelationships(artifacts: Artifact[]) {
  const classified = artifacts.filter((artifact) => artifact.classification);
  const relationships: ArtifactRelationship[] = [];

  for (let i = 0; i < classified.length; i += 1) {
    for (let j = i + 1; j < classified.length; j += 1) {
      relationships.push(...relationshipBetween(classified[i], classified[j]));
    }
  }

  const clusterMap = new Map<string, Artifact[]>();
  for (const artifact of classified) {
    const key =
      normalize(artifact.classification?.projectName) ||
      normalize(artifact.classification?.courseOrJob) ||
      normalize(artifact.sourceLabel) ||
      artifact.id;
    const existing = clusterMap.get(key) ?? [];
    existing.push(artifact);
    clusterMap.set(key, existing);
  }

  const clusters: ProjectCluster[] = Array.from(clusterMap.values()).map((items) => {
    const relatedEdges = relationships.filter(
      (relationship) =>
        items.some((item) => item.id === relationship.sourceArtifactId) &&
        items.some((item) => item.id === relationship.targetArtifactId)
    );
    const confidence = relatedEdges.length
      ? Math.round(relatedEdges.reduce((sum, relationship) => sum + relationship.confidenceScore, 0) / relatedEdges.length)
      : Math.max(...items.map((item) => item.classification?.confidenceScore ?? 30));

    return {
      id: `cluster_${normalize(labelForCluster(items)).replace(/\s+/g, "_") || randomUUID()}`,
      label: labelForCluster(items),
      artifactIds: items.map((item) => item.id),
      reasons: relatedEdges.length
        ? relatedEdges.slice(0, 4).map((relationship) => relationship.reason)
        : ["Grouped from a shared project clue or single-artifact project candidate."],
      confidenceScore: Math.min(confidence, 92),
      status: "Suggested",
      createdAt: new Date().toISOString()
    };
  });

  return { clusters, relationships };
}
