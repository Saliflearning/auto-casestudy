import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { PortfolioSiteDraft } from "@/lib/portfolio-site-draft-types";
import { ValidationFinding } from "@/lib/persona-validation-types";

export function portfolioBelievabilityFindings(input: {
  draft: GeneratedCaseStudyDraft;
  siteDraft: PortfolioSiteDraft;
}): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  const unsupported = input.draft.sections.flatMap((section) => section.unsupportedClaims);
  const missingEvidence = input.draft.sections.flatMap((section) => section.missingEvidence);
  const sourceLinkedSections = input.draft.sections.filter((section) => section.provenance.length).length;

  findings.push({
    id: "believability-source-links",
    category: "generation",
    severity: sourceLinkedSections >= Math.ceil(input.draft.sections.length * 0.6) ? "pass" : "warning",
    message: `${sourceLinkedSections}/${input.draft.sections.length} generated sections carry source links.`,
    recommendation: "Keep section-level source links visible in Builder and Preview."
  });

  findings.push({
    id: "believability-unsupported-claims",
    category: "generation",
    severity: unsupported.length ? "warning" : "pass",
    message: unsupported.length ? `${unsupported.length} unsupported claim warning(s) remained visible.` : "No hidden unsupported claims were detected.",
    recommendation: unsupported.length ? "Ask for evidence or keep the limitation visible." : "Continue preserving evidence-backed generation."
  });

  findings.push({
    id: "believability-missing-evidence",
    category: "quality",
    severity: missingEvidence.length > 6 ? "warning" : "pass",
    message: `${missingEvidence.length} missing-evidence prompt(s) are still present.`,
    recommendation: "Missing evidence should block polish, not block honest draft review."
  });

  findings.push({
    id: "believability-builder-draft",
    category: "builder",
    severity: input.siteDraft.projectPages.length ? "pass" : "fail",
    message: input.siteDraft.projectPages.length ? "Builder draft contains at least one project page." : "Builder draft has no project pages.",
    recommendation: "The builder must always receive project-page structure after orchestration."
  });

  return findings;
}
