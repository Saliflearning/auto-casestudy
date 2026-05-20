import { GeneratedCaseStudySection } from "@/lib/case-study-generation-types";
import { RevisionQualityDelta } from "@/lib/case-study-revision-types";

function contentScore(content: string, section: GeneratedCaseStudySection) {
  let score = 72;
  const words = content.split(/\s+/).filter(Boolean).length;
  if (words < 18) score -= 12;
  if (words > 150) score -= 8;
  if (/should be|not strongly|not safely|plausible|intentionally editable/i.test(content)) score -= 14;
  if (section.provenance.length) score += 8;
  if (section.missingEvidence.length) score -= 12;
  if (section.unsupportedClaims.length) score -= 18;
  return Math.max(0, Math.min(100, score));
}

export function evaluateRevisionDelta(section: GeneratedCaseStudySection, revisedContent: string): RevisionQualityDelta {
  const beforeScore = contentScore(section.content, section);
  const afterScore = contentScore(revisedContent, section);
  return {
    beforeScore,
    afterScore,
    delta: afterScore - beforeScore,
    rationale:
      afterScore >= beforeScore
        ? "Revision improves clarity while keeping evidence limits visible."
        : "Revision may not improve quality because evidence gaps or unsupported claims remain."
  };
}
