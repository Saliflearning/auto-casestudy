import { randomUUID } from "node:crypto";
import JSZip from "jszip";

const MAX_EXTRACTED_TEXT_CHARS = Number(process.env.AUTOCASESTUDY_MAX_EXTRACTED_TEXT_CHARS ?? 50_000);
const MAX_PPTX_SLIDES = Number(process.env.AUTOCASESTUDY_MAX_PPTX_SLIDES ?? 80);
const MAX_PPTX_SLIDE_XML_CHARS = Number(process.env.AUTOCASESTUDY_MAX_PPTX_SLIDE_XML_CHARS ?? 250_000);

export type ParseResult =
  | {
      status: "Parsed";
      content: {
        id: string;
        artifactId: string;
        text: string;
        parser: string;
        parserVersion: string;
        createdAt: string;
      };
    }
  | {
      status: "Failed";
      parserError: string;
    }
  | {
      status: "Visual Parsing Pending";
      parserError?: string;
    };

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_EXTRACTED_TEXT_CHARS);
}

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

async function parsePdf(bytes: Buffer) {
  const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
  const result = await pdfParse(bytes);
  return cleanText(result.text);
}

async function parseDocx(bytes: Buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: bytes });
  return cleanText(result.value);
}

export function decodeXmlText(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

async function parsePptx(bytes: Buffer) {
  const zip = await JSZip.loadAsync(bytes);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const chunks: string[] = [];
  for (const fileName of slideFiles.slice(0, MAX_PPTX_SLIDES)) {
    const xml = await zip.files[fileName].async("text");
    if (xml.length > MAX_PPTX_SLIDE_XML_CHARS) continue;
    const matches: string[] = [];
    const textNodePattern = /<a:t>(.*?)<\/a:t>/g;
    let match = textNodePattern.exec(xml);
    while (match) {
      matches.push(decodeXmlText(match[1]));
      match = textNodePattern.exec(xml);
    }
    if (matches.length) chunks.push(matches.join(" "));
  }

  return cleanText(chunks.join("\n"));
}

export async function parseArtifactBytes({
  artifactId,
  fileName,
  mimeType,
  bytes
}: {
  artifactId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<ParseResult> {
  if (mimeType.startsWith("image/")) {
    return { status: "Visual Parsing Pending" };
  }

  try {
    const extension = ext(fileName);
    let text = "";
    let parser = "";

    if (extension === "pdf" || mimeType === "application/pdf") {
      parser = "pdf-parse";
      text = await parsePdf(bytes);
    } else if (
      extension === "docx" ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      parser = "mammoth";
      text = await parseDocx(bytes);
    } else if (
      extension === "pptx" ||
      mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      parser = "jszip-pptx-xml";
      text = await parsePptx(bytes);
    } else {
      return {
        status: "Failed",
        parserError: "No parser is available for this file type yet."
      };
    }

    if (!text) {
      return {
        status: "Failed",
        parserError: "Parser completed but did not extract text."
      };
    }

    return {
      status: "Parsed",
      content: {
        id: `extract_${randomUUID()}`,
        artifactId,
        text,
        parser,
        parserVersion: "step-004",
        createdAt: new Date().toISOString()
      }
    };
  } catch {
    return {
      status: "Failed",
      parserError: "Parser failed safely. Try a smaller file or export the source document again."
    };
  }
}
