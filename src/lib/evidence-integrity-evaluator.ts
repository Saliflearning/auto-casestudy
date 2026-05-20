import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { CaseStudyQualityIssue, QualityCategoryResult } from "@/lib/case-study-quality-types";

function issue(id: string, severity: CaseStudyQualityIssue["severity"], message: string, suggestion: string, sectionId?: string): CaseStudyQualityIssue {
  return { id, category: "evidence", severity, message, suggestion, sectionId };
}

export function evaluateEvidenceIntegrity(draft: GeneratedCaseStudyDraft): QualityCategoryResult {
  const issues: CaseStudyQualityIssue[] = [];
  const sectionsWithoutEvidence = draft.sections.filter((section) => !section.evidenceIds.length || !section.provenance.length);
  const missingEvidenceSections = draft.sections.filter((section) => section.missingEvidence.length);
  const unsupportedClaimSections = draft.sections.filter((section) => section.unsupportedClaims.length);

  sectionsWithoutEvidence.forEach((section) => {
    issues.push(issue(`no-provenance-${section.id}`, "major", `${section.title} has weak or missing provenance.`, "Attach a source artifact or downgrade unsupported claims.", section.id));
  });
  missingEvidenceSections.forEach((section) => {
    issues.push(issue(`missing-evidence-${section.id}`, "major", `${section.title} still asks for missing evidence.`, "Add source material or keep the section marked as unresolved.", section.id));
  });
  unsupportedClaimSections.forEach((section) => {
    issues.push(issue(`unsupported-${section.id}`, "blocker", `${section.title} contains unsupported claims.`, "Remove the claim or attach evidence before publish.", section.id));
  });

  if (!draft.provenance.length) {
    issues.push(issue("draft-no-provenance", "blocker", "The draft has no top-level provenance references.", "Regenerate from a persisted blueprint with approved evidence."));
  }

  const penalty = sectionsWithoutEvidence.length * 8 + missingEvidenceSections.length * 10 + unsupportedClaimSections.length * 18 + (draft.provenance.length ? 0 : 25);
  return { score: Math.max(0, 100 - penalty), issues };
}
