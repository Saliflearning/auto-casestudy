import { PersonaValidationReport, ValidationFinding, ValidationScorecard } from "@/lib/persona-validation-types";

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resilienceScore(findings: ValidationFinding[]) {
  const failures = findings.filter((finding) => finding.severity === "fail").length;
  const warnings = findings.filter((finding) => finding.severity === "warning").length;
  return clamp(100 - failures * 24 - warnings * 6);
}

export function buildValidationScorecard(report: Omit<PersonaValidationReport, "scorecard">): ValidationScorecard {
  const pipelineCompletion = clamp((report.completedStages.length / 17) * 100);
  const evidenceIntegrity = report.qualityReport.scores.evidence;
  const recruiterReadability = report.qualityReport.scores.recruiter;
  const archetypeAlignment = report.qualityReport.scores.archetype;
  const resilience = resilienceScore(report.findings);
  const builderCoherence = clamp(
    50 +
      Math.min(25, report.siteDraft.projectPages.length * 12) +
      Math.min(15, report.siteDraft.navigation.length * 2) -
      Math.min(30, report.siteDraft.guardrails.length * 5)
  );
  const overall = clamp(
    pipelineCompletion * 0.22 +
      evidenceIntegrity * 0.2 +
      recruiterReadability * 0.18 +
      archetypeAlignment * 0.16 +
      resilience * 0.14 +
      builderCoherence * 0.1
  );

  return {
    pipelineCompletion,
    evidenceIntegrity,
    recruiterReadability,
    archetypeAlignment,
    resilience,
    builderCoherence,
    overall,
    status: overall >= 78 && resilience >= 70 ? "validated" : overall >= 55 ? "needs attention" : "failed"
  };
}
