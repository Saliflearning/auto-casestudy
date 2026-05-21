import { GeneratedCaseStudyDraft } from "@/lib/case-study-generation-types";
import { CaseStudyQualityReport } from "@/lib/case-study-quality-types";
import { composeCaseStudyLayout } from "@/lib/layout-composition-engine";

export function composePortfolioCaseStudyPage(input: {
  workspaceId: string;
  draft: GeneratedCaseStudyDraft;
  qualityReport?: CaseStudyQualityReport | null;
}) {
  return composeCaseStudyLayout(input);
}
