import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { CaseStudyQualityReport } from "@/lib/case-study-quality-types";
import { RevisionGoal } from "@/lib/case-study-revision-types";

export function suggestedRevisionGoal(draft: GeneratedCaseStudyDraft, report: CaseStudyQualityReport | null, sectionId: string): RevisionGoal {
  const sectionIssue = report?.revisionSuggestions.find((issue) => issue.sectionId === sectionId);
  if (sectionIssue?.category === "recruiter") return "recruiter readability";
  if (sectionIssue?.category === "writing") return "less AI-sounding language";
  if (sectionIssue?.category === "archetype") return "archetype alignment";
  if (sectionIssue?.category === "structure") return "better structure";
  const section = draft.sections.find((item) => item.id === sectionId);
  if (section?.type === "outcomes") return "stronger outcomes";
  if (section?.type === "technical") return "stronger technical depth";
  return "better clarity";
}
