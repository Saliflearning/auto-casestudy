import { Artifact } from "@/lib/types";
import { CaseStudySectionConfidence } from "@/lib/case-study-generation-types";

export function sectionConfidence(artifacts: Artifact[], missingEvidence: string[]): CaseStudySectionConfidence {
  if (missingEvidence.length) return "missing-evidence";
  const highSignals = artifacts.filter((artifact) => artifact.confidence === "High" || artifact.evidenceStrength >= 75).length;
  return highSignals ? "confirmed" : "inferred";
}
