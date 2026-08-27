import { describe, expect, it } from "vitest";

import { generateConstrainedCaseStudy } from "@/lib/constrained-generation-engine";
import { PortfolioBlueprintRecord } from "@/lib/portfolio-blueprint-types";
import { Artifact } from "@/lib/types";

const reviewState = {
  approvedHomepage: true,
  projectOrder: ["project_checkout"],
  rejectedProjectIds: [],
  homepageTone: "Recruiter" as const,
  mediaDecisions: {},
  blockerDecisions: {},
  missingEvidenceNotes: {},
  sectionNotes: {}
};

const blueprint: PortfolioBlueprintRecord = {
  id: "blueprint_1",
  workspaceId: "workspace_1",
  userId: "synthetic-owner",
  version: 1,
  status: "Approved With Blockers",
  archetype: "Technical UX Hybrid",
  readinessScore: 70,
  reviewState,
  provenanceRefs: [],
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
  blueprint: {
    id: "confirmed_blueprint_1",
    status: "Approved With Blockers",
    archetype: "Technical UX Hybrid",
    approvedHomepageStrategy: {
      approved: true,
      featuredProjectId: "project_checkout",
      heroProofId: "artifact_research",
      heroVisualId: "artifact_design",
      tone: "Recruiter",
      positioning: "Evidence-backed product engineering"
    },
    approvedProjectOrder: ["project_checkout"],
    rejectedProjectIds: [],
    approvedVisualIds: ["artifact_design"],
    privateVisualIds: [],
    rejectedVisualIds: [],
    approvedCaseStudyStructures: [
      {
        projectId: "project_checkout",
        title: "Checkout Redesign",
        archetype: "Technical UX Hybrid",
        sectionOrder: ["overview", "research", "solution", "outcomes"],
        missingSections: ["validated outcomes"],
        strongestVisualIds: ["artifact_design"],
        weakClaims: [],
        unsupportedMetrics: ["Revenue increased by 40%"],
        evidence: [
          { artifactId: "artifact_research", label: "Synthetic research notes", reason: "Research evidence" },
          { artifactId: "artifact_design", label: "Synthetic prototype", reason: "Design evidence" }
        ]
      }
    ],
    resolvedBlockerIds: [],
    unresolvedBlockerIds: ["missing_outcomes"],
    skippedBlockerIds: [],
    recruiterStrategy: [],
    userOverrides: reviewState,
    provenance: [],
    readinessScore: 70,
    readinessLabel: "Ready for Draft Planning",
    generatedFromPlanAt: "2025-01-01T00:00:00.000Z"
  }
};

const artifact = (overrides: Partial<Artifact>): Artifact => ({
  id: "artifact_research",
  name: "Synthetic Research Notes",
  kind: "Notes",
  phase: "Research",
  confidence: "High",
  confidenceScore: 90,
  evidenceStrength: 90,
  extractedSignals: ["interview", "testing"],
  suggestedPlacement: "Research section",
  risk: "None",
  sourceLabel: "Synthetic research notes",
  ...overrides
});

describe("generateConstrainedCaseStudy", () => {
  it("keeps unsupported claims visible and links generated sections to evidence", () => {
    const result = generateConstrainedCaseStudy({
      workspaceId: "workspace_1",
      blueprint,
      artifacts: [
        artifact({
          extractedContent: {
            id: "extract_1",
            artifactId: "artifact_research",
            text: "Synthetic interview findings identified checkout confusion.",
            parser: "fixture",
            parserVersion: "1",
            createdAt: "2025-01-01T00:00:00.000Z"
          }
        }),
        artifact({
          id: "artifact_design",
          name: "Synthetic Figma Prototype",
          kind: "Figma",
          phase: "Design",
          extractedSignals: ["figma", "prototype"],
          suggestedPlacement: "Case study hero",
          sourceLabel: "Synthetic prototype"
        })
      ]
    });

    expect(result.status).toBe("Blocked");
    expect(result.unresolvedIssues).toEqual(expect.arrayContaining([
      "Unresolved blocker remains: missing_outcomes",
      "Unsupported metric: Revenue increased by 40%"
    ]));
    expect(result.sections.find((section) => section.id === "research")?.evidenceIds).toContain("artifact_research");
    expect(result.sections.find((section) => section.id === "outcomes")?.unsupportedClaims).toContain("Revenue increased by 40%");
    expect(result.sections.find((section) => section.id === "outcomes")?.content).not.toContain("40%");
  });
});
