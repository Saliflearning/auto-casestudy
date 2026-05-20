import { randomUUID } from "node:crypto";
import { GeneratedCaseStudyDraft, GeneratedCaseStudySection } from "@/lib/case-study-generation-types";
import { CaseStudyQualityReport } from "@/lib/case-study-quality-types";
import { CaseStudyRevisionRecord, RevisionGoal } from "@/lib/case-study-revision-types";
import { evaluateRevisionDelta } from "@/lib/revision-quality-delta";
import { summarizeSectionDiff } from "@/lib/section-diff-engine";

function cleanPlaceholderLanguage(content: string) {
  return content
    .replace(/ should be used to /gi, " can ")
    .replace(/ should explain /gi, " explains ")
    .replace(/not strongly evidenced yet/gi, "not fully evidenced yet")
    .replace(/not safely detected/gi, "not confirmed")
    .replace(/plausible from the selected project, but /gi, "")
    .replace(/The draft is intentionally editable and keeps provenance attached before publication\./gi, "The story remains linked to source evidence.");
}

function goalPrefix(goal: RevisionGoal, section: GeneratedCaseStudySection) {
  if (goal === "recruiter readability") return "For a recruiter scan, ";
  if (goal === "stronger technical depth") return "From the technical evidence, ";
  if (goal === "archetype alignment") return `${section.title} aligns to the case-study archetype by showing `;
  if (goal === "stronger outcomes") return "The outcome remains evidence-bounded: ";
  return "";
}

function reviseContent(section: GeneratedCaseStudySection, goal: RevisionGoal) {
  const cleaned = cleanPlaceholderLanguage(section.content).trim();
  const missing = [...section.missingEvidence, ...section.unsupportedClaims];
  const evidenceLabel = section.provenance.map((item) => item.label).slice(0, 3).join(", ");
  const prefix = goalPrefix(goal, section);
  const evidenceSentence = evidenceLabel ? ` Source support: ${evidenceLabel}.` : " Source support still needs to be attached.";
  const warningSentence = missing.length ? ` Evidence needed before publishing: ${missing.join(" ")}` : "";

  if (goal === "less AI-sounding language") {
    return `${prefix}${cleaned}${evidenceSentence}${warningSentence}`.replace(/\s+/g, " ").trim();
  }

  if (goal === "recruiter readability") {
    return `${prefix}${cleaned} This section should make the user's contribution, decision, and evidence easy to scan.${evidenceSentence}${warningSentence}`.replace(/\s+/g, " ").trim();
  }

  if (goal === "stronger outcomes" && missing.length) {
    return `${cleaned} No measurable outcome should be claimed until the user provides supported results, rubric feedback, testing evidence, or validated learning outcomes.${evidenceSentence}${warningSentence}`.replace(/\s+/g, " ").trim();
  }

  return `${prefix}${cleaned}${evidenceSentence}${warningSentence}`.replace(/\s+/g, " ").trim();
}

export function buildSectionRevision(input: {
  workspaceId: string;
  draft: GeneratedCaseStudyDraft;
  qualityReport: CaseStudyQualityReport | null;
  sectionId: string;
  goal: RevisionGoal;
  actorId?: string;
}): CaseStudyRevisionRecord {
  const section = input.draft.sections.find((item) => item.id === input.sectionId);
  if (!section) {
    throw new Error("Section was not found in this case study draft.");
  }
  if (!section.editable) {
    throw new Error("Locked sections cannot be regenerated.");
  }

  const revisedContent = reviseContent(section, input.goal);
  const qualityDelta = evaluateRevisionDelta(section, revisedContent);
  const qualityIssue = input.qualityReport?.revisionSuggestions.find((issue) => issue.sectionId === section.id);
  const now = new Date().toISOString();

  return {
    id: `case_study_revision_${randomUUID()}`,
    workspaceId: input.workspaceId,
    draftId: input.draft.id,
    sectionId: section.id,
    status: "Proposed",
    goal: input.goal,
    originalContent: section.content,
    revisedContent,
    changeSummary: [
      ...summarizeSectionDiff(section.content, revisedContent),
      ...(qualityIssue ? [`Responds to quality issue: ${qualityIssue.message}`] : [])
    ],
    qualityDelta,
    provenance: section.provenance,
    unsupportedWarnings: [...section.missingEvidence, ...section.unsupportedClaims],
    createdAt: now,
    updatedAt: now,
    actorId: input.actorId
  };
}
