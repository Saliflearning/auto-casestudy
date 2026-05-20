import { Artifact } from "@/lib/types";
import { ProvenanceReference } from "@/lib/portfolio-strategy-types";

export function artifactEvidenceSummary(artifact: Artifact) {
  const text = artifact.extractedContent?.text?.trim();
  if (text) return text.slice(0, 280);
  const signals = artifact.extractedSignals.length ? artifact.extractedSignals.join(", ") : artifact.phase;
  return `${artifact.sourceLabel}: ${signals}`;
}

export function provenanceForArtifacts(artifacts: Artifact[], reason: string): ProvenanceReference[] {
  return artifacts.map((artifact) => ({
    artifactId: artifact.id,
    label: artifact.sourceLabel,
    reason
  }));
}

export function evidenceLabels(artifacts: Artifact[]) {
  return artifacts.map((artifact) => artifact.sourceLabel).join(", ");
}
