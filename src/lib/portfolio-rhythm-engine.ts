import { PortfolioPageComposition } from "@/lib/layout-composition-types";
import { VisualRhythmStrategy } from "@/lib/portfolio-experience-types";

export function buildPortfolioRhythm(compositions: PortfolioPageComposition[]): VisualRhythmStrategy {
  const mediaCount = compositions.reduce((sum, composition) => sum + composition.mediaPlacements.length, 0);
  const warningCount = compositions.reduce((sum, composition) => sum + composition.unresolvedWarnings.length, 0);
  const averageScore = compositions.length
    ? Math.round(compositions.reduce((sum, composition) => sum + composition.visualRhythm.score, 0) / compositions.length)
    : 48;
  const score = Math.max(25, Math.min(92, averageScore + Math.min(10, mediaCount * 2) - Math.min(20, warningCount * 2)));

  return {
    density: mediaCount >= 3 ? "immersive" : mediaCount >= 1 ? "balanced" : "calm",
    mediaPacing: mediaCount
      ? "Use approved visuals as proof moments near the claims they support."
      : "Keep the experience calm until project visuals are approved.",
    layoutVariation: [
      "Use a strong homepage proof block before project cards.",
      "Alternate summary, proof, and reflection regions to avoid wall-of-text pacing.",
      "Keep evidence warnings visible instead of turning them into polished decoration."
    ],
    repetitionRisks: warningCount
      ? ["Multiple unresolved warnings can make the portfolio feel unfinished.", "Avoid repeating the same missing-evidence callout across every page."]
      : ["Watch for repeated card grids once more projects are added."],
    score
  };
}
