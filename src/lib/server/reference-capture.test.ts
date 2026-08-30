import { describe, expect, it } from "vitest";

import { extractReferenceDocument } from "@/lib/server/reference-capture";

describe("extractReferenceDocument", () => {
  it("uses an HTML parser and excludes executable and styled content", () => {
    const result = extractReferenceDocument(`
      <html><head><title>Evidence &amp; Impact</title><style>.hidden { color: red }</style></head>
      <body><nav><a href="#work">Work</a></nav><main><h1>Selected &lt;Projects&gt;</h1>
      <script>alert("not visible")</script><p>Measured outcomes</p></main></body></html>
    `);

    expect(result.title).toBe("Evidence & Impact");
    expect(result.headings).toEqual(["Selected <Projects>"]);
    expect(result.navLabels).toEqual(["Work"]);
    expect(result.text).toContain("Measured outcomes");
    expect(result.text).not.toContain("alert");
    expect(result.text).not.toContain("hidden");
  });

  it("does not double-decode entities", () => {
    const result = extractReferenceDocument("<h1>&amp;lt;script&amp;gt;</h1>");
    expect(result.headings).toEqual(["&lt;script&gt;"]);
  });
});
