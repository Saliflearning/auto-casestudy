import { describe, expect, it } from "vitest";

import { classifyArtifactRecord } from "@/lib/server/classifier";

describe("classifyArtifactRecord", () => {
  it("extracts evidence signals without relying on an external model", () => {
    const result = classifyArtifactRecord({
      artifactId: "artifact_research",
      fileName: "checkout-research-notes.docx",
      fileType: "DOCX",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extractedText:
        "Project: Checkout Redesign. Course: Interaction Design. In March 2025 we ran interview and usability test sessions in Figma. The validated flow improved task completion by 18%."
    });

    expect(result.classification).toBe("research notes");
    expect(result.projectName).toBe("Checkout Redesign");
    expect(result.courseOrJob).toBe("Interaction Design");
    expect(result.tools).toContain("Figma");
    expect(result.methods).toEqual(expect.arrayContaining(["interview", "usability test"]));
    expect(result.dates).toContain("March 2025");
    expect(result.outcomes.join(" ")).toContain("18%");
    expect(result.classifier).toBe("deterministic-keyword-rules");
    expect(result.confidenceScore).toBeGreaterThan(50);
  });
});
