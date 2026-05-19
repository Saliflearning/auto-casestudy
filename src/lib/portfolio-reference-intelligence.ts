import {
  PortfolioReference,
  PortfolioReferenceArchetype,
  PortfolioReferenceMetadata,
  PortfolioReferenceStyle
} from "@/lib/portfolio-reference-types";

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

export function normalizeReferenceUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Portfolio URL is required.");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  const hostname = url.hostname.toLowerCase();
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Reference URL must use http or https.");
  }
  if (!hostname.includes(".") || hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Reference URL must be a public portfolio website.");
  }
  if (/^(10|127|169\.254|192\.168)\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) {
    throw new Error("Private network URLs cannot be used as portfolio references.");
  }
  url.hash = "";
  return url.toString();
}

function inferArchetype(text: string): PortfolioReferenceArchetype {
  if (includesAny(text, ["research", "uxr", "user-research", "usability", "interview"])) return "UX Research";
  if (includesAny(text, ["product", "designer", "figma", "interaction", "prototype"])) return "Product Design";
  if (includesAny(text, ["hci", "human-computer", "academic", "thesis"])) return "HCI Academic";
  if (includesAny(text, ["cloud", "aws", "azure", "devops", "infrastructure"])) return "Cloud Engineer";
  if (includesAny(text, ["data", "analytics", "dashboard", "visualization"])) return "Data/Analytics";
  if (includesAny(text, ["technical", "engineer", "developer", "full-stack"])) return "Technical UX Hybrid";
  if (includesAny(text, ["resume", "recruiter", "hire", "work"])) return "Recruiter-Optimized";
  return "Unknown";
}

function inferStyle(text: string, archetype: PortfolioReferenceArchetype): PortfolioReferenceStyle {
  if (includesAny(text, ["case-study", "case_study", "case study", "project"])) return "Case-study led";
  if (includesAny(text, ["gallery", "visual", "shots", "dribbble", "motion"])) return "Visual gallery";
  if (archetype === "UX Research" || includesAny(text, ["research", "method", "findings"])) return "Research-heavy";
  if (archetype === "Cloud Engineer" || includesAny(text, ["architecture", "system", "github"])) return "Technical proof";
  if (includesAny(text, ["writing", "story", "essay", "journal"])) return "Editorial narrative";
  if (includesAny(text, ["resume", "cv", "hire"])) return "Minimal recruiter";
  return "Unknown";
}

function defaultMetadata(archetype: PortfolioReferenceArchetype, style: PortfolioReferenceStyle): PortfolioReferenceMetadata {
  const researchHeavy = archetype === "UX Research" || style === "Research-heavy";
  const technical = archetype === "Cloud Engineer" || style === "Technical proof";

  return {
    pageStructure: ["Home", "About", "Projects", "Project detail", "Contact"],
    navigationPatterns: ["Top navigation", "Project cards", "Case-study deep links"],
    mediaDensity: style === "Visual gallery" ? "High" : researchHeavy ? "Medium" : "Unknown",
    storytellingNotes: researchHeavy
      ? ["Likely needs method, participants, findings, limitations, and evidence traceability."]
      : ["Review how quickly the strongest project and role are communicated."],
    visualHierarchyNotes: ["Capture screenshots before judging hierarchy.", "Separate observed layout from inferred style."],
    recruiterObservations: ["Check whether role, impact, project scope, and contact path are clear within 30 seconds."],
    strengths: technical ? ["Potential technical credibility signals."] : [],
    weaknesses: ["Needs human review before agents use this as a strong reference."]
  };
}

export function createReferenceFromUrl(inputUrl: string): Omit<PortfolioReference, "id" | "createdAt" | "updatedAt"> {
  const normalizedUrl = normalizeReferenceUrl(inputUrl);
  const parsed = new URL(normalizedUrl);
  const haystack = `${parsed.hostname} ${parsed.pathname}`.toLowerCase();
  const archetype = inferArchetype(haystack);
  const portfolioStyle = inferStyle(haystack, archetype);
  const researchWeight = archetype === "UX Research" || archetype === "HCI Academic" ? "High" : "Unknown";
  const technicalDepth = archetype === "Cloud Engineer" || archetype === "Technical UX Hybrid" ? "High" : "Unknown";
  const visualWeight = portfolioStyle === "Visual gallery" || portfolioStyle === "Case-study led" ? "Medium" : "Unknown";

  return {
    url: inputUrl.trim(),
    normalizedUrl,
    title: parsed.hostname.replace(/^www\./, ""),
    archetype,
    roleType: archetype === "Unknown" ? "Unreviewed portfolio" : archetype,
    portfolioStyle,
    storytellingStructure: portfolioStyle === "Case-study led" ? "Project cards to case-study detail pages" : "Needs capture review",
    layoutStructure: "Needs screenshot capture",
    researchWeight,
    visualWeight,
    recruiterReadability: "Unknown",
    technicalDepth,
    captureStatus: "Queued",
    screenshots: [
      {
        id: "homepage",
        label: "Homepage",
        pageUrl: normalizedUrl,
        status: "Queued"
      }
    ],
    metadata: defaultMetadata(archetype, portfolioStyle),
    reviewTags: ["Needs review"],
    adminNotes: "Reference ingested. Screenshot capture and human review still required before use in generation planning."
  };
}
