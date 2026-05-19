import { PortfolioReference, PortfolioReferenceMetadata } from "@/lib/portfolio-reference-types";

const MAX_HTML_BYTES = 500_000;

function compactText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function uniqueLimited(values: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = decodeHtml(compactText(value));
    if (!normalized || normalized.length < 2) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized.slice(0, 90));
    if (result.length >= limit) break;
  }
  return result;
}

function matches(html: string, pattern: RegExp) {
  const globalPattern = pattern.global ? pattern : new RegExp(pattern.source, `${pattern.flags}g`);
  return Array.from(html.matchAll(globalPattern)).map((match) => match[1] ?? "");
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

function mergeMetadata(reference: PortfolioReference, html: string, title: string): PortfolioReferenceMetadata {
  const headings = uniqueLimited(matches(html, /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi), 10);
  const navLabels = uniqueLimited(matches(html, /<a[^>]*>([\s\S]*?)<\/a>/gi), 8);
  const text = compactText(html).slice(0, 8000);
  const pageStructure = headings.length ? headings : reference.metadata.pageStructure;

  return {
    ...reference.metadata,
    pageStructure,
    navigationPatterns: uniqueLimited([...inferNavigationPatterns(html), ...navLabels.map((label) => `Nav: ${label}`)], 10),
    storytellingNotes: uniqueLimited(
      [
        ...reference.metadata.storytellingNotes,
        title ? `Homepage title detected: ${title}` : "",
        headings.length ? `Detected ${headings.length} visible heading signals for human review.` : "No strong heading structure detected in the HTML probe."
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
    recruiterObservations: uniqueLimited([...inferRecruiterObservations(text), ...reference.metadata.recruiterObservations], 8)
  };
}

export async function probeReferenceStructure(reference: PortfolioReference) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(reference.normalizedUrl, {
      headers: {
        "user-agent": "Auto-CaseStudy-ReferenceProbe/0.1 (+portfolio intelligence research)"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Reference returned HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new Error("Reference did not return an HTML page.");
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);
    const title = decodeHtml(compactText(matches(html, /<title[^>]*>([\s\S]*?)<\/title>/i)[0] ?? reference.title));
    const metadata = mergeMetadata(reference, html, title);

    return {
      ...reference,
      title: title || reference.title,
      captureStatus: "Needs Review" as const,
      screenshots: reference.screenshots.map((screenshot) => ({
        ...screenshot,
        status: screenshot.status === "Captured" ? screenshot.status : ("Queued" as const)
      })),
      metadata,
      reviewTags: Array.from(new Set([...reference.reviewTags, "Needs review" as const])),
      adminNotes:
        "Structure probe completed. Screenshot capture and human portfolio review are still required before this reference guides generation."
    };
  } finally {
    clearTimeout(timeout);
  }
}
