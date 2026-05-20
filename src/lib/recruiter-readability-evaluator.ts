import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { CaseStudyQualityIssue, QualityCategoryResult } from "@/lib/case-study-quality-types";

function issue(id: string, severity: CaseStudyQualityIssue["severity"], message: string, suggestion: string, sectionId?: string): CaseStudyQualityIssue {
  return { id, category: "recruiter", severity, message, suggestion, sectionId };
}

function sectionText(draft: GeneratedCaseStudyDraft, id: string) {
  return draft.sections.find((section) => section.id === id)?.content ?? "";
}

export function evaluateRecruiterReadability(draft: GeneratedCaseStudyDraft): QualityCategoryResult {
  const issues: CaseStudyQualityIssue[] = [];
  const role = sectionText(draft, "role");
  const outcomes = sectionText(draft, "outcomes");
  const overview = sectionText(draft, "overview");
  const hasImpactLanguage = /impact|improved|reduced|increased|validated|launched|delivered|saved|conversion|retention|usability|adoption/i.test(outcomes + overview);

  if (!role || /not strongly evidenced|clarify/i.test(role)) {
    issues.push(issue("unclear-role", "major", "Contribution ownership is unclear.", "Add a concise role statement with responsibilities and collaborators.", "role"));
  }
  if (!hasImpactLanguage || /not detected|missing|not strongly/i.test(outcomes)) {
    issues.push(issue("weak-impact", "major", "Impact is not visible enough for recruiter scanning.", "Add supported metrics, testing outcomes, rubric results, or validated learning outcomes.", "outcomes"));
  }
  if (overview.length > 520) {
    issues.push(issue("overview-too-long", "minor", "The overview may be too dense for a quick recruiter scan.", "Compress the overview into problem, role, and outcome in 3-4 lines.", "overview"));
  }

  const sectionCount = draft.sections.length;
  if (sectionCount > 11) {
    issues.push(issue("too-many-sections", "minor", "The draft may feel long for first-pass portfolio review.", "Group low-value sections or add stronger scanning hierarchy."));
  }

  const penalty = issues.reduce((sum, item) => sum + (item.severity === "major" ? 18 : 8), 0);
  return { score: Math.max(0, 100 - penalty), issues };
}
