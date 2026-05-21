import { PortfolioArchetype } from "@/lib/portfolio-strategy-types";
import { LayoutDensity, LayoutRegionKind, LayoutVariant } from "@/lib/layout-composition-types";
import { GeneratedCaseStudySection } from "@/lib/case-study-generation-types";

export type ArchetypeLayoutStrategy = {
  archetype: PortfolioArchetype;
  density: LayoutDensity;
  heroVariant: LayoutVariant;
  preferredRegionOrder: LayoutRegionKind[];
  strategyNotes: string[];
  sectionVariant(section: GeneratedCaseStudySection): LayoutVariant;
};

function sectionVariant(section: GeneratedCaseStudySection, fallback: LayoutVariant): LayoutVariant {
  if (section.missingEvidence.length || section.unsupportedClaims.length || section.confidence === "missing-evidence") {
    return "warning-callout";
  }
  if (section.type === "research" || section.type === "insights") return "process-timeline";
  if (section.type === "technical") return "technical-rail";
  if (section.type === "solution" || section.type === "decisions") return "split-proof";
  return fallback;
}

export function regionKindForSection(section: GeneratedCaseStudySection): LayoutRegionKind {
  if (section.missingEvidence.length || section.unsupportedClaims.length || section.confidence === "missing-evidence") {
    return "evidence-warning";
  }
  if (section.type === "overview" || section.type === "role" || section.type === "timeline") return "summary";
  if (section.type === "problem") return "problem";
  if (section.type === "research" || section.type === "insights") return "process";
  if (section.type === "decisions" || section.type === "solution") return "decision";
  if (section.type === "technical") return "technical";
  if (section.type === "outcomes") return "outcomes";
  if (section.type === "reflection") return "reflection";
  return "summary";
}

export function getArchetypeLayoutStrategy(archetype: PortfolioArchetype): ArchetypeLayoutStrategy {
  if (archetype === "UX Research" || archetype === "Academic Research") {
    return {
      archetype,
      density: "balanced",
      heroVariant: "split-proof",
      preferredRegionOrder: ["hero", "summary", "problem", "process", "decision", "outcomes", "reflection", "evidence-warning"],
      strategyNotes: [
        "Lead with project context and research credibility before visual polish.",
        "Use process rhythm to connect methods, insights, and decision rationale.",
        "Keep limitations and missing evidence visible so the story stays academically trustworthy."
      ],
      sectionVariant: (section) => sectionVariant(section, "narrative-stack")
    };
  }

  if (archetype === "Technical UX Hybrid" || archetype === "Cloud/Technical") {
    return {
      archetype,
      density: "balanced",
      heroVariant: "split-proof",
      preferredRegionOrder: ["hero", "summary", "problem", "process", "technical", "decision", "outcomes", "reflection", "evidence-warning"],
      strategyNotes: [
        "Pair user-facing decisions with implementation constraints.",
        "Give architecture and technical credibility a visible side rail instead of burying it.",
        "Use technical proof to strengthen product judgment, not to turn the case study into a system dump."
      ],
      sectionVariant: (section) => sectionVariant(section, section.type === "technical" ? "technical-rail" : "split-proof")
    };
  }

  if (archetype === "Product Design") {
    return {
      archetype,
      density: "immersive",
      heroVariant: "split-proof",
      preferredRegionOrder: ["hero", "summary", "problem", "process", "media", "decision", "outcomes", "reflection", "evidence-warning"],
      strategyNotes: [
        "Make the first visual moment strong enough for recruiter scanning.",
        "Use design decisions and iterations as the spine of the narrative.",
        "Place galleries only where they explain decisions or outcomes."
      ],
      sectionVariant: (section) => sectionVariant(section, section.type === "solution" ? "media-gallery" : "split-proof")
    };
  }

  return {
    archetype,
    density: "compact",
    heroVariant: "narrative-stack",
    preferredRegionOrder: ["hero", "summary", "problem", "process", "decision", "outcomes", "reflection", "evidence-warning"],
    strategyNotes: [
      "Optimize the page for quick recruiter comprehension.",
      "Keep proof, role, and impact visible in the first scan.",
      "Avoid dense internal reasoning above the main story."
    ],
    sectionVariant: (section) => sectionVariant(section, "narrative-stack")
  };
}
