import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { CaseStudyQualityIssue, QualityCategoryResult } from "@/lib/case-study-quality-types";

const genericPhrases = [
  "intentionally editable",
  "before publication",
  "should be used",
  "not strongly",
  "not safely detected",
  "plausible",
  "should explain"
];

function issue(id: string, severity: CaseStudyQualityIssue["severity"], message: string, suggestion: string, sectionId?: string): CaseStudyQualityIssue {
  return { id, category: "writing", severity, message, suggestion, sectionId };
}

export function evaluateWritingQuality(draft: GeneratedCaseStudyDraft): QualityCategoryResult {
  const issues: CaseStudyQualityIssue[] = [];
  const allText = draft.sections.map((section) => section.content).join(" ").toLowerCase();
  const repeatedGeneric = genericPhrases.filter((phrase) => allText.includes(phrase));

  draft.sections.forEach((section) => {
    const wordCount = section.content.split(/\s+/).filter(Boolean).length;
    if (wordCount < 14) {
      issues.push(issue(`thin-${section.id}`, "minor", `${section.title} is too thin.`, "Add concrete detail or keep it as a missing-evidence prompt.", section.id));
    }
    if (wordCount > 160) {
      issues.push(issue(`verbose-${section.id}`, "minor", `${section.title} may be too verbose.`, "Shorten the section and move supporting detail into evidence callouts.", section.id));
    }
  });

  if (repeatedGeneric.length >= 3) {
    issues.push(issue("generic-ai-language", "major", "The draft still contains process-placeholder language.", "Rewrite placeholders into specific, evidence-backed portfolio prose."));
  }

  const penalty = issues.reduce((sum, item) => sum + (item.severity === "major" ? 18 : 7), 0);
  return { score: Math.max(0, 100 - penalty), issues };
}
