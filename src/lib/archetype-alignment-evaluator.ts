import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { CaseStudyQualityIssue, QualityCategoryResult } from "@/lib/case-study-quality-types";

function issue(id: string, severity: CaseStudyQualityIssue["severity"], message: string, suggestion: string, sectionId?: string): CaseStudyQualityIssue {
  return { id, category: "archetype", severity, message, suggestion, sectionId };
}

function hasSection(draft: GeneratedCaseStudyDraft, ids: string[]) {
  return ids.some((id) => draft.sections.some((section) => section.id === id || section.type === id));
}

export function evaluateArchetypeAlignment(draft: GeneratedCaseStudyDraft): QualityCategoryResult {
  const issues: CaseStudyQualityIssue[] = [];
  const archetype = draft.archetype;

  if (archetype === "UX Research" || archetype === "Academic Research") {
    if (!hasSection(draft, ["research"])) {
      issues.push(issue("missing-research", "blocker", `${archetype} case studies need a research method section.`, "Add methods, participants, synthesis, and findings."));
    }
    if (!hasSection(draft, ["insights"])) {
      issues.push(issue("missing-insights", "major", `${archetype} case studies need explicit findings or insights.`, "Add evidence-backed insights tied to research artifacts."));
    }
  }

  if (archetype === "Technical UX Hybrid" || archetype === "Cloud/Technical") {
    if (!hasSection(draft, ["technical"])) {
      issues.push(issue("missing-technical", "blocker", `${archetype} needs technical credibility, architecture, or implementation reasoning.`, "Add a technical section tied to approved architecture/system artifacts."));
    }
  }

  if (!hasSection(draft, ["decisions"])) {
    issues.push(issue("missing-decisions", "major", "The case study lacks a clear decision rationale section.", "Explain how evidence changed the design or technical direction."));
  }

  const penalty = issues.reduce((sum, item) => sum + (item.severity === "blocker" ? 28 : 16), 0);
  return { score: Math.max(0, 100 - penalty), issues };
}
