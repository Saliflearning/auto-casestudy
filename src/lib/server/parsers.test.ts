import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { decodeXmlText, parseArtifactBytes } from "@/lib/server/parsers";

const fixture = (name: string) => fileURLToPath(new URL(`../../../test-fixtures/${name}`, import.meta.url));

describe("parseArtifactBytes", () => {
  it("decodes XML entities exactly once", () => {
    expect(decodeXmlText("&lt;tag&gt; &amp; &quot;value&quot; &apos;x&apos;")).toBe(`<tag> & "value" 'x'`);
    expect(decodeXmlText("&amp;lt;script&amp;gt;")).toBe("&lt;script&gt;");
  });

  it("extracts text from a DOCX fixture", async () => {
    const result = await parseArtifactBytes({
      artifactId: "artifact_docx",
      fileName: "sample-artifact.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      bytes: await readFile(fixture("sample-artifact.docx"))
    });

    expect(result.status).toBe("Parsed");
    if (result.status === "Parsed") {
      expect(result.content.parser).toBe("mammoth");
      expect(result.content.text.length).toBeGreaterThan(10);
    }
  });

  it("marks images for visual parsing without fabricating text", async () => {
    const result = await parseArtifactBytes({
      artifactId: "artifact_image",
      fileName: "sample-artifact.png",
      mimeType: "image/png",
      bytes: await readFile(fixture("sample-artifact.png"))
    });

    expect(result).toEqual({ status: "Visual Parsing Pending" });
  });

  it("fails safely for unsupported files", async () => {
    const result = await parseArtifactBytes({
      artifactId: "artifact_text",
      fileName: "sample-artifact.txt",
      mimeType: "text/plain",
      bytes: await readFile(fixture("sample-artifact.txt"))
    });

    expect(result.status).toBe("Failed");
  });
});
