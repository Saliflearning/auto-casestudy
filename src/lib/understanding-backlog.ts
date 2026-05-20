import { Artifact, CaseStudySection, Gap, ProjectCluster, UnderstandingBacklogItem } from "@/lib/types";

function byPhase(artifacts: Artifact[], phase: RegExp) {
  return artifacts.filter((artifact) => phase.test(`${artifact.phase} ${artifact.name} ${artifact.classification?.classification ?? ""}`));
}

function priorityFromSeverity(severity: Gap["severity"]): UnderstandingBacklogItem["priority"] {
  if (severity === "Critical") return "Critical";
  if (severity === "Important") return "High";
  return "Medium";
}

function statusFromPriority(priority: UnderstandingBacklogItem["priority"]): UnderstandingBacklogItem["status"] {
  if (priority === "Critical") return "Blocked";
  if (priority === "High") return "Needs evidence";
  return "Needs review";
}

function strongestArtifacts(artifacts: Artifact[], count: number) {
  return [...artifacts]
    .sort((a, b) => b.evidenceStrength + b.confidenceScore - (a.evidenceStrength + a.confidenceScore))
    .slice(0, count);
}

export function buildUnderstandingBacklog(input: {
  artifacts: Artifact[];
  sections: CaseStudySection[];
  gaps: Gap[];
  clusters: ProjectCluster[];
}): UnderstandingBacklogItem[] {
  const { artifacts, sections, gaps, clusters } = input;
  const researchArtifacts = byPhase(artifacts, /research|synthesis|validation|testing|interview|survey/i);
  const designArtifacts = byPhase(artifacts, /design|figma|prototype|wireframe|image|photo/i);
  const technicalArtifacts = byPhase(artifacts, /technical|cloud|architecture|code|system/i);
  const resumeArtifacts = byPhase(artifacts, /professional|resume|profile|certification|experience/i);
  const confirmedClusters = clusters.filter((cluster) => cluster.status === "Confirmed");
  const suggestedClusters = clusters.filter((cluster) => cluster.status === "Suggested" || cluster.status === "Needs Review");
  const unsupportedSections = sections.filter((section) => section.evidenceIds.length === 0 && !section.locked);
  const strongest = strongestArtifacts(artifacts, 4);

  const backlog: UnderstandingBacklogItem[] = [];

  if (suggestedClusters.length) {
    backlog.push({
      id: "understand_confirm_clusters",
      category: "Project reconstruction",
      priority: "Critical",
      status: "Needs review",
      title: "Confirm project boundaries before planning pages",
      rationale: "The system has possible project groups, but the user-confirmed evidence graph is the trusted source for generation.",
      suggestedAction: "Confirm, reject, rename, or adjust the suggested project clusters.",
      sourceArtifactIds: suggestedClusters.flatMap((cluster) => cluster.artifactIds).slice(0, 8),
      relatedClusterIds: suggestedClusters.map((cluster) => cluster.id),
      outputTarget: "Projects"
    });
  }

  if (!confirmedClusters.length && artifacts.length >= 3) {
    backlog.push({
      id: "understand_project_candidates",
      category: "Project reconstruction",
      priority: "High",
      status: "Needs review",
      title: "Identify the strongest project candidate",
      rationale: "A portfolio needs project-level stories, not only an artifact tray. The agent should decide what can become a project page.",
      suggestedAction: "Use shared project names, course/job clues, dates, and tools to nominate one primary project.",
      sourceArtifactIds: strongest.map((artifact) => artifact.id),
      relatedClusterIds: [],
      outputTarget: "Projects"
    });
  }

  if (strongest.length) {
    backlog.push({
      id: "understand_homepage_proof",
      category: "Portfolio planning",
      priority: "High",
      status: "Ready for planning",
      title: "Choose homepage-worthy proof",
      rationale: "The homepage should feature the clearest evidence-backed identity and strongest work signal.",
      suggestedAction: "Promote the highest-confidence artifacts into homepage proof, featured work, and professional positioning.",
      sourceArtifactIds: strongest.map((artifact) => artifact.id),
      relatedClusterIds: confirmedClusters.slice(0, 2).map((cluster) => cluster.id),
      outputTarget: "Home"
    });
  }

  if (designArtifacts.length) {
    backlog.push({
      id: "understand_media_placement",
      category: "Media placement",
      priority: "Medium",
      status: "Needs review",
      title: "Plan where visuals belong in the portfolio",
      rationale: "Visual artifacts should support the story rather than sit in a gallery without context.",
      suggestedAction: "Place sketches and synthesis visuals in process sections, prototypes in design sections, and polished screens near outcomes.",
      sourceArtifactIds: designArtifacts.slice(0, 6).map((artifact) => artifact.id),
      relatedClusterIds: confirmedClusters.map((cluster) => cluster.id),
      outputTarget: "Case Study"
    });
  } else {
    backlog.push({
      id: "understand_missing_visuals",
      category: "Media placement",
      priority: "High",
      status: "Needs evidence",
      title: "Portfolio lacks strong visual evidence",
      rationale: "Recruiters expect project pages to show process images, screens, diagrams, or prototypes.",
      suggestedAction: "Ask for screenshots, wireframes, Figma exports, sketches, diagrams, or final UI images.",
      sourceArtifactIds: [],
      relatedClusterIds: confirmedClusters.map((cluster) => cluster.id),
      outputTarget: "Case Study"
    });
  }

  if (researchArtifacts.length) {
    backlog.push({
      id: "understand_research_spine",
      category: "Portfolio planning",
      priority: "Medium",
      status: "Ready for planning",
      title: "Build the research-to-decision spine",
      rationale: "Research artifacts can explain why design decisions were made and prevent generic case study writing.",
      suggestedAction: "Connect methods, findings, design decisions, and validation evidence into a chronological project narrative.",
      sourceArtifactIds: researchArtifacts.slice(0, 6).map((artifact) => artifact.id),
      relatedClusterIds: confirmedClusters.map((cluster) => cluster.id),
      outputTarget: "Case Study"
    });
  }

  if (technicalArtifacts.length) {
    backlog.push({
      id: "understand_technical_credibility",
      category: "Recruiter readability",
      priority: "Medium",
      status: "Ready for planning",
      title: "Translate technical depth into product credibility",
      rationale: "Technical artifacts are differentiators only when they are connected to feasibility, reliability, constraints, or collaboration.",
      suggestedAction: "Create a technical credibility sidebar or skills proof block without overpowering the UX story.",
      sourceArtifactIds: technicalArtifacts.slice(0, 5).map((artifact) => artifact.id),
      relatedClusterIds: confirmedClusters.map((cluster) => cluster.id),
      outputTarget: "Skills"
    });
  }

  if (resumeArtifacts.length) {
    backlog.push({
      id: "understand_resume_alignment",
      category: "Recruiter readability",
      priority: "Medium",
      status: "Ready for planning",
      title: "Align professional profile with project evidence",
      rationale: "Resume/profile artifacts should support the About, Experience, Skills, and project positioning pages.",
      suggestedAction: "Cross-check role claims, tools, certifications, and experience bullets against project evidence.",
      sourceArtifactIds: resumeArtifacts.slice(0, 4).map((artifact) => artifact.id),
      relatedClusterIds: [],
      outputTarget: "Resume"
    });
  }

  for (const gap of gaps.slice(0, 5)) {
    const priority = priorityFromSeverity(gap.severity);
    backlog.push({
      id: `understand_${gap.id}`,
      category: gap.severity === "Critical" ? "Guardrail" : "Evidence gap",
      priority,
      status: statusFromPriority(priority),
      title: gap.title,
      rationale: gap.detail,
      suggestedAction: gap.action,
      sourceArtifactIds: [],
      relatedClusterIds: confirmedClusters.map((cluster) => cluster.id),
      outputTarget: gap.id.includes("outcome") ? "Publish Readiness" : "Case Study"
    });
  }

  if (unsupportedSections.length) {
    backlog.push({
      id: "understand_unsupported_sections",
      category: "Guardrail",
      priority: "Critical",
      status: "Blocked",
      title: "Downgrade or source unsupported generated sections",
      rationale: "Generation must remain downstream of evidence. Unsupported sections cannot become confident portfolio claims.",
      suggestedAction: "Attach source artifacts, rewrite as a limitation, or ask the user for missing evidence.",
      sourceArtifactIds: [],
      relatedClusterIds: confirmedClusters.map((cluster) => cluster.id),
      outputTarget: "Publish Readiness"
    });
  }

  return backlog
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .sort((a, b) => {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return order[a.priority] - order[b.priority];
    });
}
