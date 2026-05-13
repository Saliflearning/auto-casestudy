import { randomUUID } from "node:crypto";
import { ArtifactClassification, ArtifactClassificationKind, ArtifactKind } from "@/lib/types";

type ClassificationInput = {
  artifactId: string;
  fileName: string;
  fileType: ArtifactKind;
  mimeType: string;
  extractedText?: string;
};

const toolKeywords = [
  "Figma",
  "FigJam",
  "Miro",
  "Maze",
  "UserZoom",
  "Jira",
  "Notion",
  "GitHub",
  "AWS",
  "Azure",
  "React",
  "Next.js",
  "PostgreSQL",
  "Tableau",
  "Excel"
];

const methodKeywords = [
  "interview",
  "survey",
  "usability test",
  "affinity map",
  "persona",
  "journey map",
  "wireframe",
  "prototype",
  "heuristic evaluation",
  "card sort",
  "contextual inquiry",
  "thematic analysis"
];

const outcomePatterns = [
  /\b\d+%[^.]{0,80}/gi,
  /\b(increased|decreased|reduced|improved|launched|published|shipped|validated|measured)\b[^.]{0,100}/gi
];

function includesAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word.toLowerCase()));
}

function matchesFromList(text: string, words: string[]) {
  return words.filter((word) => text.includes(word.toLowerCase()));
}

function unique(values: string[]) {
  return values.filter((value, index) => values.indexOf(value) === index);
}

function extractDates(text: string) {
  const matches = text.match(/\b(?:20\d{2}|19\d{2}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b(?:\s+\d{1,2})?(?:,\s*\d{4})?/gi);
  return unique(matches ?? []).slice(0, 8);
}

function extractProjectName(fileName: string, text: string) {
  const explicit = text.match(/\b(?:project|case study|title)\s*[:\-]\s*([A-Z][A-Za-z0-9 &/_-]{3,80})/);
  if (explicit?.[1]) return explicit[1].trim();
  return fileName.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
}

function extractCourseOrJob(text: string) {
  const course = text.match(/\b(?:course|class|seminar)\s*[:\-]\s*([A-Za-z0-9 &/_-]{3,80})/i);
  if (course?.[1]) return course[1].trim();
  const job = text.match(/\b(?:internship|role|company|client)\s*[:\-]\s*([A-Za-z0-9 &/_-]{3,80})/i);
  if (job?.[1]) return job[1].trim();
  return undefined;
}

function extractOutcomes(text: string) {
  const outcomes = outcomePatterns.flatMap((pattern) => text.match(pattern) ?? []);
  return unique(outcomes.map((item) => item.trim())).slice(0, 6);
}

function classifyKind(fileName: string, fileType: ArtifactKind, text: string): ArtifactClassificationKind {
  const haystack = `${fileName} ${text}`.toLowerCase();

  if (includesAny(haystack, ["certificate", "certification", "credential", "badge"])) return "certificate";
  if (includesAny(haystack, ["resume", "cv", "curriculum vitae", "experience", "skills"])) return "resume/profile";
  if (includesAny(haystack, ["interview", "survey", "participant", "usability test", "findings", "research"])) {
    return "research notes";
  }
  if (fileType === "Slide Deck" || includesAny(haystack, ["slide", "presentation", "deck"])) return "presentation";
  if (includesAny(haystack, ["figma", "wireframe", "prototype", "screen", "component", "design system"])) {
    return "design artifact";
  }
  if (includesAny(haystack, ["architecture", "api", "database", "deployment", "terraform", "cloud", "repository"])) {
    return "technical documentation";
  }
  if (includesAny(haystack, ["report", "reflection", "summary", "case study"])) return "project report";
  return "unknown";
}

function confidenceFor(kind: ArtifactClassificationKind, text: string, tags: string[]) {
  if (kind === "unknown") return 25;
  const textBonus = text.length > 120 ? 15 : text.length > 20 ? 8 : 0;
  const tagBonus = Math.min(tags.length * 4, 20);
  return Math.min(92, 52 + textBonus + tagBonus);
}

export function classifyArtifactRecord(input: ClassificationInput): ArtifactClassification {
  const text = `${input.fileName} ${input.extractedText ?? ""}`.toLowerCase();
  const kind = classifyKind(input.fileName, input.fileType, text);
  const tools = matchesFromList(text, toolKeywords);
  const methods = matchesFromList(text, methodKeywords);
  const dates = extractDates(text);
  const outcomes = extractOutcomes(text);
  const projectName = extractProjectName(input.fileName, input.extractedText ?? "");
  const courseOrJob = extractCourseOrJob(input.extractedText ?? "");
  const tags = [
    kind,
    ...tools.map((tool) => `tool:${tool}`),
    ...methods.map((method) => `method:${method}`),
    ...dates.map((date) => `date:${date}`)
  ].slice(0, 16);

  return {
    id: `classification_${randomUUID()}`,
    artifactId: input.artifactId,
    classification: kind,
    confidenceScore: confidenceFor(kind, input.extractedText ?? "", tags),
    projectName,
    courseOrJob,
    tools,
    methods,
    dates,
    outcomes,
    tags,
    classifier: "deterministic-keyword-rules",
    classifierVersion: "step-005",
    createdAt: new Date().toISOString()
  };
}
