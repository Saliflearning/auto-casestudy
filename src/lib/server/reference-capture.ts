import { parse } from "node-html-parser";

import { PortfolioReference, PortfolioReferenceMetadata, PortfolioReferenceReviewTag } from "@/lib/portfolio-reference-types";
import { fetchPublicHtml } from "@/lib/server/public-url";

const MAX_HTML_BYTES = 500_000;

function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function uniqueLimited(values: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = compactText(value);
    if (!normalized || normalized.length < 2) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized.slice(0, 90));
    if (result.length >= limit) break;
  }
  return result;
}

function inferNavigationPatterns(html: string) {
  const patterns = [];
  if (/<nav[\s>]/i.test(html)) patterns.push("Semantic navigation");
  if (/href=["'][^"']*#(projects?|work|case-stud)/i.test(html)) patterns.push("Project anchor links");
  if (/href=["'][^"']*(resume|cv)\b/i.test(html)) patterns.push("Resume link");
  if (/href=["'][^"']*(mailto:|contact)\b/i.test(html)) patterns.push("Contact path");
  if (/<main[\s>]/i.test(html)) patterns.push("Semantic main content");
  return patterns.length ? patterns : ["Needs screenshot review"];
}

function inferRecruiterObservations(text: string) {
  const lower = text.toLowerCase();
  const observations = [];
  if (lower.includes("case study") || lower.includes("project")) observations.push("Project work appears discoverable.");
  if (lower.includes("research") || lower.includes("usability")) observations.push("Research credibility signals are present.");
  if (lower.includes("impact") || lower.includes("outcome") || lower.includes("metric")) observations.push("Possible outcome language is present.");
  if (lower.includes("resume") || lower.includes("linkedin") || lower.includes("email")) observations.push("Recruiter handoff path may be present.");
  return observations.length ? observations : ["Human review needed for recruiter scanability."];
}

export function extractReferenceDocument(html: string) {
  const root = parse(html);
  root.querySelectorAll("script, style").forEach((element) => element.remove());
  return {
    title: compactText(root.querySelector("title")?.textContent ?? ""),
    headings: uniqueLimited(root.querySelectorAll("h1, h2, h3").map((element) => element.textContent), 10),
    navLabels: uniqueLimited(root.querySelectorAll("a").map((element) => element.textContent), 8),
    text: compactText(root.textContent).slice(0, 8000)
  };
}

function mergeMetadata(reference: PortfolioReference, html: string, parsed: ReturnType<typeof extractReferenceDocument>): PortfolioReferenceMetadata {
  const pageStructure = parsed.headings.length ? parsed.headings : reference.metadata.pageStructure;

  return {
    ...reference.metadata,
    pageStructure,
    navigationPatterns: uniqueLimited([...inferNavigationPatterns(html), ...parsed.navLabels.map((label) => `Nav: ${label}`)], 10),
    storytellingNotes: uniqueLimited(
      [
        ...reference.metadata.storytellingNotes,
        parsed.title ? `Homepage title detected: ${parsed.title}` : "",
        parsed.headings.length ? `Detected ${parsed.headings.length} visible heading signals for human review.` : "No strong heading structure detected in the HTML probe."
      ],
      8
    ),
    visualHierarchyNotes: uniqueLimited(
      [
        "HTML structure probe completed. Screenshot capture is still required before visual hierarchy judgment.",
        ...reference.metadata.visualHierarchyNotes
      ],
      8
    ),
    recruiterObservations: uniqueLimited([...inferRecruiterObservations(parsed.text), ...reference.metadata.recruiterObservations], 8)
  };
}

export async function probeReferenceStructure(reference: PortfolioReference) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const html = await fetchPublicHtml(reference.normalizedUrl, { signal: controller.signal, maxBytes: MAX_HTML_BYTES });
    const parsed = extractReferenceDocument(html);
    const title = parsed.title || reference.title;
    const metadata = mergeMetadata(reference, html, parsed);

    return {
      ...reference,
      title,
      captureStatus: "Needs Review" as const,
      screenshots: reference.screenshots.map((screenshot) => ({
        ...screenshot,
        status: screenshot.status === "Captured" ? screenshot.status : ("Queued" as const)
      })),
      metadata,
      reviewTags: Array.from(new Set<PortfolioReferenceReviewTag>([...reference.reviewTags, "Needs review"])).slice(0, 6),
      adminNotes: "HTML structure captured. Screenshot review is still required before this reference guides generation."
    };
  } finally {
    clearTimeout(timeout);
  }
}
