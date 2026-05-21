import { PortfolioArchetype } from "@/lib/portfolio-strategy-types";

export function archetypeExperienceStrategy(archetype: PortfolioArchetype) {
  if (archetype === "UX Research" || archetype === "Academic Research") {
    return {
      tone: "measured, evidence-led, and method-aware",
      notes: [
        "Lead with research maturity before visual polish.",
        "Make methods, findings, limitations, and traceability easy to scan.",
        "Use project pages to show how evidence changed decisions."
      ],
      homepageEmphasis: "research credibility",
      density: "calm" as const
    };
  }

  if (archetype === "Technical UX Hybrid" || archetype === "Cloud/Technical") {
    return {
      tone: "clear, systems-aware, and outcome-oriented",
      notes: [
        "Frame technical depth as product judgment.",
        "Balance architecture proof with human experience decisions.",
        "Use cross-links between project stories, skills, and technical artifacts."
      ],
      homepageEmphasis: "hybrid credibility",
      density: "balanced" as const
    };
  }

  if (archetype === "Product Design") {
    return {
      tone: "visual, decision-led, and recruiter-readable",
      notes: [
        "Lead with a strong visual and a clear product problem.",
        "Vary case-study rhythm between process, decisions, and final screens.",
        "Keep galleries tied to decisions instead of decorative browsing."
      ],
      homepageEmphasis: "design impact",
      density: "immersive" as const
    };
  }

  return {
    tone: "concise, scannable, and proof-oriented",
    notes: [
      "Prioritize the fastest path to credibility.",
      "Keep navigation shallow and recruiter-friendly.",
      "Expose strongest projects before secondary proof."
    ],
    homepageEmphasis: "recruiter scanability",
    density: "calm" as const
  };
}
