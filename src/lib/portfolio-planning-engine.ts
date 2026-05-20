import { evaluatePortfolioReadiness } from "@/lib/portfolio-readiness-evaluator";
import {
  CaseStudyPlan,
  GenerationBlocker,
  MediaPlacementSuggestion,
  PortfolioArchetype,
  PortfolioStrategyPlan,
  ProvenanceReference,
  RankedProjectPlan
} from "@/lib/portfolio-strategy-types";
import { Artifact, CaseStudySection, Gap, Persona, ProjectCluster, UnderstandingBacklogItem } from "@/lib/types";

function includesAny(value: string, terms: string[]) {
  const lower = value.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function artifactText(artifact: Artifact) {
  return `${artifact.name} ${artifact.phase} ${artifact.kind} ${artifact.classification?.classification ?? ""} ${artifact.extractedSignals.join(" ")}`;
}

function inferArchetype(persona: Persona, artifacts: Artifact[]): PortfolioArchetype {
  const text = artifacts.map(artifactText).join(" ");
  if (persona === "UX Researcher" || includesAny(text, ["interview", "survey", "usability", "research"])) return "UX Research";
  if (persona === "Product Designer" || includesAny(text, ["figma", "prototype", "wireframe", "interaction"])) return "Product Design";
  if (persona === "Technical UX Hybrid") return "Technical UX Hybrid";
  if (persona === "Cloud/IT Hybrid" || includesAny(text, ["aws", "cloud", "architecture", "system"])) return "Cloud/Technical";
  if (persona === "HCI Master's Student" || includesAny(text, ["hci", "academic", "course", "study"])) return "Academic Research";
  return "Recruiter-Optimized";
}

function artifactsForCluster(cluster: ProjectCluster, artifacts: Artifact[]) {
  const ids = new Set(cluster.artifactIds);
  return artifacts.filter((artifact) => ids.has(artifact.id));
}

function scoreGroup(artifacts: Artifact[], cluster?: ProjectCluster) {
  const evidenceQuality = artifacts.length
    ? Math.round(artifacts.reduce((sum, artifact) => sum + artifact.confidenceScore + artifact.evidenceStrength, 0) / (artifacts.length * 2))
    : 0;
  const visualStrength = Math.min(96, artifacts.filter((artifact) => includesAny(artifactText(artifact), ["image", "photo", "figma", "prototype", "wireframe", "design"])).length * 24);
  const researchDepth = Math.min(96, artifacts.filter((artifact) => includesAny(artifactText(artifact), ["research", "interview", "survey", "testing", "validation", "synthesis"])).length * 22);
  const technicalDepth = Math.min(96, artifacts.filter((artifact) => includesAny(artifactText(artifact), ["technical", "cloud", "aws", "architecture", "system", "code"])).length * 22);
  const phases = new Set(artifacts.map((artifact) => artifact.phase));
  const completeness = Math.min(96, phases.size * 16 + artifacts.length * 6 + (cluster?.status === "Confirmed" ? 14 : 0));
  const readinessScore = Math.round(evidenceQuality * 0.35 + visualStrength * 0.18 + researchDepth * 0.16 + technicalDepth * 0.12 + completeness * 0.19);

  return { evidenceQuality, visualStrength, researchDepth, technicalDepth, completeness, readinessScore };
}

function evidenceForArtifacts(artifacts: Artifact[], reason: string): ProvenanceReference[] {
  return artifacts.slice(0, 5).map((artifact) => ({
    artifactId: artifact.id,
    label: artifact.sourceLabel,
    reason
  }));
}

function buildProjectCandidates(artifacts: Artifact[], clusters: ProjectCluster[]): RankedProjectPlan[] {
  const usableClusters = clusters.filter((cluster) => cluster.status !== "Rejected" && cluster.artifactIds.length);
  const candidates = usableClusters.length
    ? usableClusters.map((cluster) => ({ id: cluster.id, title: cluster.label, cluster, artifacts: artifactsForCluster(cluster, artifacts) }))
    : [
        {
          id: "project_candidate_primary",
          title: artifacts[0]?.sourceLabel ?? "Primary portfolio project",
          cluster: undefined,
          artifacts: artifacts.slice(0, 6)
        }
      ];

  return candidates
    .map((candidate) => {
      const scores = scoreGroup(candidate.artifacts, candidate.cluster);
      const blockers = [
        scores.visualStrength < 25 ? "Project lacks final or process visuals." : "",
        scores.completeness < 45 ? "Project timeline and phase coverage are incomplete." : "",
        scores.evidenceQuality < 55 ? "Evidence confidence is weak and needs review." : ""
      ].filter(Boolean);

      return {
        id: candidate.id,
        title: candidate.title,
        rank: 0,
        recruiterValue: scores.readinessScore >= 76 ? "High" : scores.readinessScore >= 52 ? "Medium" : "Low",
        reasoning: `${candidate.artifacts.length} source artifact${candidate.artifacts.length === 1 ? "" : "s"} with ${scores.evidenceQuality}% evidence quality and ${scores.completeness}% completeness.`,
        artifactIds: candidate.artifacts.map((artifact) => artifact.id),
        blockers,
        ...scores
      } satisfies RankedProjectPlan;
    })
    .sort((a, b) => b.readinessScore - a.readinessScore)
    .map((project, index) => ({ ...project, rank: index + 1 }));
}

function sectionOrderFor(archetype: PortfolioArchetype) {
  const shared = ["Overview", "Problem", "Role", "Evidence", "Process", "Outcome", "Reflection"];
  if (archetype === "UX Research") return ["Overview", "Research Context", "Methods", "Participants", "Findings", "Design Implications", "Limitations", "Reflection"];
  if (archetype === "Product Design") return ["Overview", "Problem", "Role", "Research Inputs", "Flows", "Iterations", "Final Design", "Outcome"];
  if (archetype === "Technical UX Hybrid") return ["Overview", "Problem", "Research Evidence", "Design Decisions", "System Constraints", "Implementation Credibility", "Outcome"];
  if (archetype === "Cloud/Technical") return ["Overview", "Problem", "Architecture", "Implementation", "Reliability/Security", "Result", "Reflection"];
  if (archetype === "Academic Research") return ["Abstract", "Research Question", "Method", "Findings", "Design/Prototype", "Limitations", "Future Work"];
  return shared;
}

function buildCaseStudyPlans(projects: RankedProjectPlan[], artifacts: Artifact[], archetype: PortfolioArchetype, sections: CaseStudySection[]): CaseStudyPlan[] {
  return projects.slice(0, 3).map((project) => {
    const projectArtifacts = artifacts.filter((artifact) => project.artifactIds.includes(artifact.id));
    const visuals = projectArtifacts.filter((artifact) => includesAny(artifactText(artifact), ["image", "photo", "figma", "prototype", "wireframe", "diagram"]));
    const hasOutcome = projectArtifacts.some((artifact) => includesAny(artifactText(artifact), ["outcome", "impact", "metric", "result"]));
    const hasResearch = projectArtifacts.some((artifact) => includesAny(artifactText(artifact), ["research", "interview", "survey", "testing", "method"]));
    const unsupported = sections.filter((section) => section.evidenceIds.length === 0).map((section) => section.title);

    return {
      projectId: project.id,
      title: project.title,
      archetype,
      sectionOrder: sectionOrderFor(archetype),
      missingSections: [!hasResearch ? "Research evidence" : "", !hasOutcome ? "Outcome / impact" : "", !visuals.length ? "Visual proof" : ""].filter(Boolean),
      strongestVisualIds: visuals.slice(0, 4).map((artifact) => artifact.id),
      weakClaims: unsupported,
      unsupportedMetrics: hasOutcome ? [] : ["No measurable outcome detected."],
      evidence: evidenceForArtifacts(projectArtifacts, "Supports case-study planning.")
    };
  });
}

function buildMediaPlacements(artifacts: Artifact[]): MediaPlacementSuggestion[] {
  return artifacts
    .filter((artifact) => includesAny(artifactText(artifact), ["image", "photo", "figma", "prototype", "wireframe", "diagram", "architecture"]))
    .slice(0, 8)
    .map((artifact, index) => {
      const text = artifactText(artifact);
      const placement = includesAny(text, ["architecture", "cloud", "system"])
        ? "Technical sidebar"
        : includesAny(text, ["research", "affinity", "synthesis"])
          ? "Research section"
          : includesAny(text, ["prototype", "figma", "wireframe"])
            ? "Case study hero"
            : index === 0
              ? "Homepage hero"
              : "Gallery";
      return {
        id: `media_${artifact.id}`,
        artifactId: artifact.id,
        label: artifact.sourceLabel,
        placement,
        reason: `${artifact.kind} evidence can strengthen ${placement.toLowerCase()} without inventing unsupported claims.`
      };
    });
}

function blockersFrom(backlog: UnderstandingBacklogItem[], gaps: Gap[], projects: RankedProjectPlan[]): GenerationBlocker[] {
  const blockers: GenerationBlocker[] = [];

  for (const item of backlog.filter((entry) => entry.priority === "Critical" || entry.status === "Blocked").slice(0, 5)) {
    blockers.push({
      id: `blocker_${item.id}`,
      severity: "Blocker",
      title: item.title,
      detail: item.rationale,
      followUpQuestion: item.suggestedAction,
      evidence: item.sourceArtifactIds.map((artifactId) => ({ artifactId, label: "Source artifact", reason: "Referenced by understanding backlog." }))
    });
  }

  for (const gap of gaps.filter((entry) => entry.severity !== "Suggestion").slice(0, 4)) {
    blockers.push({
      id: `blocker_gap_${gap.id}`,
      severity: gap.severity === "Critical" ? "Blocker" : "Warning",
      title: gap.title,
      detail: gap.detail,
      followUpQuestion: gap.action,
      evidence: []
    });
  }

  if (!projects[0]?.artifactIds.length) {
    blockers.push({
      id: "blocker_no_project_evidence",
      severity: "Blocker",
      title: "No project evidence available",
      detail: "The system cannot plan a credible portfolio without project artifacts.",
      followUpQuestion: "Upload project documents, screenshots, research notes, prototypes, or reports.",
      evidence: []
    });
  }

  return blockers.filter((blocker, index, items) => items.findIndex((candidate) => candidate.id === blocker.id) === index);
}

export function buildPortfolioStrategyPlan(input: {
  persona: Persona;
  artifacts: Artifact[];
  sections: CaseStudySection[];
  clusters: ProjectCluster[];
  gaps: Gap[];
  backlog: UnderstandingBacklogItem[];
}): PortfolioStrategyPlan {
  const { persona, artifacts, sections, clusters, gaps, backlog } = input;
  const archetype = inferArchetype(persona, artifacts);
  const projects = buildProjectCandidates(artifacts, clusters);
  const mediaPlacements = buildMediaPlacements(artifacts);
  const blockers = blockersFrom(backlog, gaps, projects);
  const topProject = projects[0];
  const strongestProof = [...artifacts].sort((a, b) => b.confidenceScore + b.evidenceStrength - (a.confidenceScore + a.evidenceStrength)).slice(0, 4);
  const strongestVisuals = mediaPlacements.slice(0, 3).map((placement) => placement.artifactId);
  const missingEvidence = Array.from(
    new Set([
      ...backlog.filter((item) => item.status === "Needs evidence" || item.status === "Blocked").map((item) => item.title),
      ...gaps.map((gap) => gap.title),
      !strongestVisuals.length ? "Strong project visuals" : "",
      !topProject || topProject.readinessScore < 55 ? "Complete featured project evidence" : ""
    ].filter(Boolean))
  );
  const readiness = evaluatePortfolioReadiness({ projects, blockers, backlog, missingEvidenceCount: missingEvidence.length });
  const provenance = evidenceForArtifacts(strongestProof, "Supports homepage and portfolio planning recommendations.");

  return {
    archetype,
    persona,
    readinessScore: readiness.score,
    readinessLabel: readiness.label,
    homepage: {
      positioning: `${persona} portfolio planned as a ${archetype} story with evidence-backed project proof.`,
      featuredProjectId: topProject?.id,
      featuredProjectTitle: topProject?.title ?? "No featured project ready",
      heroCandidates: [
        topProject ? `${topProject.title}: strongest project candidate` : "Upload project evidence before choosing a hero",
        strongestProof[0] ? `${strongestProof[0].sourceLabel}: proof-of-skill candidate` : "Add proof-of-skill evidence"
      ],
      strongestProofIds: strongestProof.map((artifact) => artifact.id),
      strongestVisualIds: strongestVisuals,
      reasoning: topProject
        ? `Feature ${topProject.title} first because it currently has the strongest combined evidence, completeness, and recruiter value.`
        : "Homepage planning is blocked until project evidence exists.",
      evidence: provenance
    },
    projectRanking: projects,
    caseStudies: buildCaseStudyPlans(projects, artifacts, archetype, sections),
    mediaPlacements,
    missingEvidence,
    generationBlockers: blockers,
    recruiterValueReasoning: [
      topProject ? `${topProject.title} is ranked first for recruiter scanability because it has ${topProject.readinessScore}% planning readiness.` : "No recruiter-ready project yet.",
      strongestVisuals.length ? "Visual candidates exist for richer project presentation." : "Visual evidence is weak; project pages may feel text-heavy.",
      blockers.length ? "Generation should pause on blockers rather than inventing claims." : "No critical blockers detected for draft planning."
    ],
    provenance,
    nextReviewActions: [
      "Review the featured project recommendation.",
      "Confirm whether the homepage proof matches the user's target identity.",
      "Resolve blockers before publish-ready generation.",
      "Approve or adjust media placement suggestions."
    ]
  };
}
