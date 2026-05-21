import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { evaluateArchetypeAlignment } from "@/lib/archetype-alignment-evaluator";
import { evaluateEvidenceIntegrity } from "@/lib/evidence-integrity-evaluator";
import { readinessFromScore, publishRiskFromReadiness } from "@/lib/portfolio-readiness-scorer";
import { evaluateRecruiterReadability } from "@/lib/recruiter-readability-evaluator";
import { CaseStudyQualityIssue, CaseStudyQualityReport } from "@/lib/case-study-quality-types";
import { evaluateWritingQuality } from "@/lib/writing-quality-evaluator";

function evaluateStructure(draft: GeneratedCaseStudyDraft) {
  const issues: CaseStudyQualityIssue[] = [];
  const required = ["overview", "role", "problem", "research", "insights", "decisions", "solution", "outcomes", "reflection"];
  required.forEach((id) => {
    if (!draft.sections.some((section) => section.id === id || section.type === id)) {
      issues.push({
        id: `missing-${id}`,
        category: "structure",
        severity: id === "outcomes" || id === "problem" ? "major" : "minor",
        message: `Missing expected ${id} section.`,
        suggestion: `Add a ${id} section or explicitly mark it as unavailable.`
      });
    }
  });
  const blockedSections = draft.sections.filter((section) => section.confidence === "missing-evidence").length;
  if (blockedSections >= 4) {
    issues.push({
      id: "many-missing-sections",
      category: "structure",
      severity: "major",
      message: "Too many sections are still missing evidence.",
      suggestion: "Collect missing source material before trying to polish the story."
    });
  }
  return { score: Math.max(0, 100 - issues.length * 10 - blockedSections * 5), issues };
}

function evaluateMedia(draft: GeneratedCaseStudyDraft) {
  const issues: CaseStudyQualityIssue[] = [];
  if (!draft.media.length) {
    issues.push({
      id: "no-media",
      category: "media",
      severity: "major",
      message: "No approved media is attached to the case study.",
      suggestion: "Approve a hero visual, research artifact, prototype screenshot, or architecture diagram."
    });
  }
  draft.media.forEach((media) => {
    if (!media.provenance.length) {
      issues.push({
        id: `media-no-provenance-${media.id}`,
        category: "media",
        severity: "major",
        message: "A media item lacks a source link.",
        suggestion: "Attach the visual to a source artifact before publishing."
      });
    }
    if (/should be captioned/i.test(media.caption)) {
      issues.push({
        id: `weak-caption-${media.id}`,
        category: "media",
        severity: "minor",
        message: "A media caption is still instructional rather than portfolio-ready.",
        suggestion: "Rewrite the caption to explain what the visual proves."
      });
    }
  });
  return { score: Math.max(0, 100 - issues.reduce((sum, item) => sum + (item.severity === "major" ? 22 : 8), 0)), issues };
}

function weightedOverall(scores: CaseStudyQualityReport["scores"]) {
  return Math.round(
    scores.structural * 0.16 +
      scores.evidence * 0.24 +
      scores.recruiter * 0.2 +
      scores.archetype * 0.16 +
      scores.writing * 0.14 +
      scores.media * 0.1
  );
}

export function evaluateCaseStudyQuality(draft: GeneratedCaseStudyDraft): CaseStudyQualityReport {
  const structural = evaluateStructure(draft);
  const evidence = evaluateEvidenceIntegrity(draft);
  const recruiter = evaluateRecruiterReadability(draft);
  const archetype = evaluateArchetypeAlignment(draft);
  const writing = evaluateWritingQuality(draft);
  const media = evaluateMedia(draft);
  const issues = [...structural.issues, ...evidence.issues, ...recruiter.issues, ...archetype.issues, ...writing.issues, ...media.issues];
  const scores = {
    structural: structural.score,
    evidence: evidence.score,
    recruiter: recruiter.score,
    archetype: archetype.score,
    writing: writing.score,
    media: media.score,
    overall: 0
  };
  scores.overall = weightedOverall(scores);
  const readiness = readinessFromScore(scores.overall, issues);
  const blockers = issues.filter((issue) => issue.severity === "blocker");
  const weakSections = Array.from(new Set(issues.map((issue) => issue.sectionId).filter(Boolean))) as string[];
  const unsupportedClaims = draft.sections.flatMap((section) => section.unsupportedClaims);
  const provenanceGaps = issues.filter((issue) => issue.id.includes("provenance") || issue.id.includes("missing-evidence")).map((issue) => issue.message);

  return {
    id: `case_study_quality_${draft.id}`,
    workspaceId: draft.workspaceId,
    caseStudyDraftId: draft.id,
    projectId: draft.projectId,
    archetype: draft.archetype,
    scores,
    readiness,
    publishRisk: publishRiskFromReadiness(readiness),
    confidenceScore: Math.max(0, Math.min(100, Math.round((scores.evidence + scores.archetype + scores.structural) / 3))),
    blockers,
    revisionSuggestions: issues.sort((a, b) => {
      const weight = { blocker: 3, major: 2, minor: 1 };
      return weight[b.severity] - weight[a.severity];
    }),
    weakSections,
    unsupportedClaims,
    provenanceGaps,
    evaluatedAt: new Date().toISOString()
  };
}
