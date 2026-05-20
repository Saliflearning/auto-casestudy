import { GeneratedCaseStudyDraft, GeneratedCaseStudySection } from "@/lib/case-study-generation-types";
import { artifactEvidenceSummary, evidenceLabels, provenanceForArtifacts } from "@/lib/provenance-section-mapper";
import { sectionConfidence } from "@/lib/section-confidence-evaluator";
import { PortfolioBlueprintRecord } from "@/lib/portfolio-blueprint-types";
import { Artifact } from "@/lib/types";

function includesAny(value: string, words: string[]) {
  const lower = value.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function filterArtifacts(artifacts: Artifact[], words: string[]) {
  return artifacts.filter((artifact) => {
    const haystack = [
      artifact.name,
      artifact.kind,
      artifact.phase,
      artifact.suggestedPlacement,
      artifact.classification?.classification,
      artifact.extractedSignals.join(" "),
      artifact.extractedContent?.text ?? ""
    ].join(" ");
    return includesAny(haystack, words);
  });
}

function buildSection(input: {
  id: string;
  title: string;
  type: GeneratedCaseStudySection["type"];
  content: string;
  artifacts: Artifact[];
  missingEvidence?: string[];
  unsupportedClaims?: string[];
}) {
  const missingEvidence = input.missingEvidence ?? [];
  return {
    id: input.id,
    title: input.title,
    type: input.type,
    content: input.content,
    confidence: sectionConfidence(input.artifacts, missingEvidence),
    editable: true,
    evidenceIds: input.artifacts.map((artifact) => artifact.id),
    provenance: provenanceForArtifacts(input.artifacts, `Supports ${input.title}`),
    missingEvidence,
    unsupportedClaims: input.unsupportedClaims ?? []
  } satisfies GeneratedCaseStudySection;
}

function archetypeSections(archetype: PortfolioBlueprintRecord["archetype"]) {
  if (archetype === "Technical UX Hybrid" || archetype === "Cloud/Technical") {
    return {
      researchTitle: "Discovery and Constraints",
      decisionTitle: "Design and Technical Decisions",
      solutionTitle: "Solution and Implementation Logic",
      includeTechnical: true
    };
  }

  if (archetype === "UX Research" || archetype === "Academic Research") {
    return {
      researchTitle: "Research Method",
      decisionTitle: "Insights and Design Implications",
      solutionTitle: "Recommended Experience",
      includeTechnical: false
    };
  }

  return {
    researchTitle: "Discovery",
    decisionTitle: "Key Decisions",
    solutionTitle: "Final Solution",
    includeTechnical: false
  };
}

export function generateConstrainedCaseStudy(input: {
  workspaceId: string;
  blueprint: PortfolioBlueprintRecord;
  artifacts: Artifact[];
}): GeneratedCaseStudyDraft {
  const { blueprint } = input;
  const approved = blueprint.blueprint;
  const projectId = approved.approvedProjectOrder[0] ?? "project_missing";
  const caseStudyPlan = approved.approvedCaseStudyStructures.find((item) => item.projectId === projectId) ?? approved.approvedCaseStudyStructures[0];
  const projectTitle = caseStudyPlan?.title ?? "Evidence-backed portfolio case study";
  const evidenceIds = new Set([
    ...(caseStudyPlan?.evidence.map((item) => item.artifactId).filter(Boolean) as string[]),
    ...approved.approvedVisualIds,
    approved.approvedHomepageStrategy.heroProofId,
    approved.approvedHomepageStrategy.heroVisualId
  ].filter(Boolean));
  const sourceArtifacts = input.artifacts.filter((artifact) => evidenceIds.has(artifact.id));
  const researchArtifacts = filterArtifacts(sourceArtifacts, ["research", "interview", "survey", "testing", "participant", "finding", "affinity"]);
  const designArtifacts = filterArtifacts(sourceArtifacts, ["figma", "wireframe", "prototype", "design", "screen", "iteration", "visual"]);
  const technicalArtifacts = filterArtifacts(sourceArtifacts, ["architecture", "cloud", "api", "system", "technical", "database", "deployment"]);
  const resumeArtifacts = filterArtifacts(sourceArtifacts, ["resume", "role", "experience", "certification"]);
  const structure = archetypeSections(approved.archetype);
  const allEvidenceLabel = evidenceLabels(sourceArtifacts) || "approved blueprint evidence";
  const unresolvedIssues = [
    ...approved.unresolvedBlockerIds.map((id) => `Unresolved blocker remains: ${id}`),
    ...(caseStudyPlan?.missingSections.map((section) => `Missing case study section evidence: ${section}`) ?? []),
    ...(caseStudyPlan?.unsupportedMetrics.map((metric) => `Unsupported metric: ${metric}`) ?? [])
  ];

  const sections: GeneratedCaseStudySection[] = [
    buildSection({
      id: "overview",
      title: "Project Overview",
      type: "overview",
      artifacts: sourceArtifacts,
      content: `${projectTitle} is framed as a ${approved.archetype} case study using approved evidence from ${allEvidenceLabel}. The draft is intentionally editable and keeps provenance attached before publication.`
    }),
    buildSection({
      id: "role",
      title: "Role",
      type: "role",
      artifacts: resumeArtifacts.length ? resumeArtifacts : sourceArtifacts,
      content: resumeArtifacts.length
        ? `Role evidence appears in ${evidenceLabels(resumeArtifacts)}. The final role statement should be tightened by the user before publishing.`
        : "Role ownership is not strongly evidenced yet. Add a role note or resume/project artifact before treating this as confirmed.",
      missingEvidence: resumeArtifacts.length ? [] : ["Clarify your specific role, team ownership, and responsibilities."]
    }),
    buildSection({
      id: "timeline",
      title: "Timeline",
      type: "timeline",
      artifacts: sourceArtifacts,
      content: "A precise project timeline was not safely detected from the approved evidence. Add dates, course context, sprint timing, or project duration to strengthen this section.",
      missingEvidence: ["Project dates or duration are missing."]
    }),
    buildSection({
      id: "problem",
      title: "Problem",
      type: "problem",
      artifacts: researchArtifacts.length ? researchArtifacts : sourceArtifacts,
      content: researchArtifacts.length
        ? `The problem framing is grounded in ${artifactEvidenceSummary(researchArtifacts[0])}`
        : "The problem is plausible from the selected project, but direct problem evidence is weak. Add a brief problem statement or source artifact.",
      missingEvidence: researchArtifacts.length ? [] : ["Problem statement evidence is weak."]
    }),
    buildSection({
      id: "research",
      title: structure.researchTitle,
      type: "research",
      artifacts: researchArtifacts,
      content: researchArtifacts.length
        ? `Research evidence comes from ${evidenceLabels(researchArtifacts)}. These artifacts should be used to describe methods, participant signals, findings, and what changed because of the research.`
        : "Research or discovery artifacts were not approved for this case study. Keep this section as a follow-up prompt instead of inventing methods.",
      missingEvidence: researchArtifacts.length ? [] : ["Research method, findings, or testing evidence is missing."]
    }),
    buildSection({
      id: "insights",
      title: "Insights",
      type: "insights",
      artifacts: researchArtifacts,
      content: researchArtifacts.length
        ? `Initial insight language should be extracted from the approved research sources, especially ${artifactEvidenceSummary(researchArtifacts[0])}`
        : "No confirmed insight evidence is available yet. Add interview notes, testing findings, survey results, or synthesis artifacts.",
      missingEvidence: researchArtifacts.length ? [] : ["Confirmed insights are missing."]
    }),
    buildSection({
      id: "decisions",
      title: structure.decisionTitle,
      type: "decisions",
      artifacts: designArtifacts.length ? designArtifacts : sourceArtifacts,
      content: designArtifacts.length
        ? `Design decisions should connect research evidence to visuals from ${evidenceLabels(designArtifacts)}. Keep each decision tied to an artifact or user clarification.`
        : "Design decision evidence is not strong enough to describe iterations safely.",
      missingEvidence: designArtifacts.length ? [] : ["Design iteration or decision rationale evidence is missing."]
    }),
    buildSection({
      id: "solution",
      title: structure.solutionTitle,
      type: "solution",
      artifacts: designArtifacts,
      content: designArtifacts.length
        ? `The solution section can use approved visual evidence from ${evidenceLabels(designArtifacts)}. Captions should explain what the viewer is seeing and why it matters.`
        : "Final solution visuals were not approved. Upload or approve final screens before treating this section as complete.",
      missingEvidence: designArtifacts.length ? [] : ["Approved final visuals are missing."]
    }),
    buildSection({
      id: "outcomes",
      title: "Outcomes",
      type: "outcomes",
      artifacts: sourceArtifacts.filter((artifact) => artifact.classification?.outcomes.length),
      content: "Final measurable outcomes were not detected strongly enough to claim impact. Use this section to add learning outcomes, rubric feedback, testing results, or business metrics only if supported.",
      missingEvidence: ["Measurable outcomes or validated learning evidence are missing."],
      unsupportedClaims: caseStudyPlan?.unsupportedMetrics ?? []
    }),
    buildSection({
      id: "reflection",
      title: "Reflection",
      type: "reflection",
      artifacts: sourceArtifacts,
      content: "The reflection should explain what changed in the user's thinking, what evidence was strongest, and what still needs support before publishing."
    })
  ];

  if (structure.includeTechnical) {
    sections.splice(
      8,
      0,
      buildSection({
        id: "technical",
        title: "Technical Credibility",
        type: "technical",
        artifacts: technicalArtifacts,
        content: technicalArtifacts.length
          ? `Technical credibility should be framed through approved implementation evidence from ${evidenceLabels(technicalArtifacts)}. Connect systems constraints to product decisions, not engineering trivia.`
          : "Technical depth was selected, but no approved technical artifact is attached to this project.",
        missingEvidence: technicalArtifacts.length ? [] : ["Technical architecture or implementation artifact is missing."]
      })
    );
  }

  const now = new Date().toISOString();
  return {
    id: `case_study_draft_${projectId}_${blueprint.id}_${blueprint.version}`,
    workspaceId: input.workspaceId,
    blueprintId: blueprint.id,
    blueprintVersion: blueprint.version,
    projectId,
    title: projectTitle,
    archetype: approved.archetype,
    status: unresolvedIssues.length ? "Blocked" : "Draft",
    sections,
    media: sourceArtifacts
      .filter((artifact) => approved.approvedVisualIds.includes(artifact.id) || artifact.id === approved.approvedHomepageStrategy.heroVisualId)
      .map((artifact, index) => ({
        id: `media_${artifact.id}`,
        artifactId: artifact.id,
        placement: index === 0 ? "hero" : artifact.suggestedPlacement.toLowerCase().includes("technical") ? "technical" : "gallery",
        caption: `${artifact.sourceLabel} should be captioned with what it proves, not just what it shows.`,
        provenance: provenanceForArtifacts([artifact], "Approved media placement"),
        private: approved.privateVisualIds.includes(artifact.id)
      })),
    unresolvedIssues,
    generationNotes: [
      "Generated from persisted confirmed blueprint only.",
      "Unsupported outcomes remain visible instead of being invented.",
      "Each section is editable and carries provenance metadata."
    ],
    provenance: caseStudyPlan?.evidence.length ? caseStudyPlan.evidence : approved.provenance,
    createdAt: now,
    updatedAt: now
  };
}
