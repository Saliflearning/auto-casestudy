import { Artifact, ArtifactKind, CaseStudySection, Gap, Persona } from "@/lib/types";
import { uid } from "@/lib/utils";

const phaseRules: Array<[RegExp, string, ArtifactKind, string[]]> = [
  [/interview|survey|participant|research|notes/i, "Research", "Notes", ["qualitative research", "participant evidence"]],
  [/affinity|synthesis|journey|persona/i, "Synthesis", "Image", ["pattern finding", "research synthesis"]],
  [/sketch|wireframe|flow|figma|prototype|frame/i, "Design Exploration", "Figma", ["interaction design", "visual progression"]],
  [/test|usability|maze|userzoom|feedback/i, "Validation", "PDF", ["usability testing", "decision evidence"]],
  [/cloud|aws|azure|architecture|system|diagram|code/i, "Technical Implementation", "Code", ["systems thinking", "technical credibility"]],
  [/resume|cv|experience/i, "Professional Identity", "Resume", ["role clarity", "career positioning"]],
  [/cert|certificate|credential/i, "Professional Identity", "Certification", ["validated skill", "credibility signal"]]
];

const extensionKinds: Record<string, ArtifactKind> = {
  pdf: "PDF",
  doc: "DOCX",
  docx: "DOCX",
  png: "Image",
  jpg: "Photo",
  jpeg: "Photo",
  webp: "Image",
  ppt: "Slide Deck",
  pptx: "Slide Deck",
  key: "Slide Deck",
  md: "Notes",
  txt: "Notes",
  ts: "Code",
  tsx: "Code",
  js: "Code",
  jsx: "Code"
};

export function classifyArtifact(name: string): Artifact {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const matched = phaseRules.find(([rule]) => rule.test(name));
  const kind = matched?.[2] ?? extensionKinds[ext] ?? "Notes";
  const phase = matched?.[1] ?? "Unsorted Evidence";
  const signals = matched?.[3] ?? ["portfolio evidence", "needs review"];
  const confidenceScore = matched ? 88 : ext ? 72 : 48;

  return {
    id: uid("artifact"),
    name,
    kind,
    phase,
    confidence: confidenceScore > 82 ? "High" : confidenceScore > 58 ? "Medium" : "Low",
    confidenceScore,
    evidenceStrength: matched ? 82 : 50,
    extractedSignals: signals,
    suggestedPlacement:
      phase === "Technical Implementation"
        ? "System Design"
        : phase === "Professional Identity"
          ? "Profile Evidence"
          : phase,
    risk: confidenceScore < 60 ? "Agent needs your confirmation before using this claim." : "Ready for draft generation.",
    sourceLabel: name.replace(/\.[^/.]+$/, "")
  };
}

export function inferPersona(artifacts: Artifact[]): Persona {
  const text = artifacts.map((artifact) => `${artifact.name} ${artifact.phase} ${artifact.extractedSignals.join(" ")}`).join(" ");
  if (/cloud|aws|azure|system|code|architecture/i.test(text) && /research|figma|ux|usability/i.test(text)) {
    return "Technical UX Hybrid";
  }
  if (/research|interview|survey|participant|usability/i.test(text)) return "UX Researcher";
  if (/figma|prototype|wireframe|visual|interaction/i.test(text)) return "Product Designer";
  if (/cloud|aws|azure|it|system/i.test(text)) return "Cloud/IT Hybrid";
  return "HCI Master's Student";
}

export function generateSections(artifacts: Artifact[], persona: Persona): CaseStudySection[] {
  const evidence = (phase: string) => artifacts.filter((artifact) => artifact.phase === phase).map((artifact) => artifact.id);
  const researchLanguage =
    persona === "UX Researcher" || persona === "HCI Master's Student"
      ? "The narrative foregrounds methodology, limitations, participant evidence, and traceable findings."
      : "The narrative translates research evidence into fast recruiter-readable product decisions.";

  return [
    {
      id: "section_overview",
      title: "Portfolio Positioning",
      type: "overview",
      content: `Auto-CaseStudy frames this body of work as a persona-aware portfolio for a ${persona}. It turns fragmented artifacts into a coherent professional story while keeping every strong claim tied to source evidence.`,
      evidenceIds: artifacts.slice(0, 3).map((artifact) => artifact.id),
      locked: false
    },
    {
      id: "section_research",
      title: "Research Evidence",
      type: "research",
      content: `${researchLanguage} Uploaded notes, study materials, and testing records are grouped into a research spine before design decisions are written.`,
      evidenceIds: evidence("Research").concat(evidence("Validation")),
      locked: false
    },
    {
      id: "section_process",
      title: "Reconstructed Process",
      type: "process",
      content:
        "The agent reconstructs a chronology from research through synthesis, ideation, testing, iteration, final design, and reflection. Low-confidence jumps are flagged instead of invented.",
      evidenceIds: artifacts.filter((artifact) => artifact.phase !== "Professional Identity").map((artifact) => artifact.id),
      locked: false
    },
    {
      id: "section_design",
      title: "Design Story",
      type: "design",
      content:
        "Visual artifacts are placed where they support the story: sketches and sticky notes in synthesis, wireframes in exploration, polished screens in final design, and captions written from visible evidence.",
      evidenceIds: evidence("Design Exploration").concat(evidence("Synthesis")),
      locked: false
    },
    {
      id: "section_technical",
      title: "Technical Credibility",
      type: "technical",
      content:
        "Technical files, cloud diagrams, and implementation notes become credibility signals without overpowering the UX story. Claims are separated into proven evidence and follow-up prompts.",
      evidenceIds: evidence("Technical Implementation"),
      locked: false
    },
    {
      id: "section_outcome",
      title: "Outcome And Gaps",
      type: "outcome",
      content:
        "The draft asks for measurable outcomes when evidence is missing, recommends stronger role clarity, and prepares recruiter-friendly summaries for quick portfolio scans.",
      evidenceIds: [],
      locked: false
    }
  ];
}

export function detectGaps(artifacts: Artifact[], sections: CaseStudySection[]): Gap[] {
  const hasTesting = artifacts.some((artifact) => /Validation|test|usability/i.test(`${artifact.phase} ${artifact.name}`));
  const hasOutcomeEvidence = artifacts.some((artifact) => /metric|outcome|result|analytics|impact/i.test(artifact.name));
  const hasTechnical = artifacts.some((artifact) => artifact.phase === "Technical Implementation");
  const lowConfidence = artifacts.filter((artifact) => artifact.confidence === "Low").length;
  const unlockedUnsupported = sections.filter((section) => section.evidenceIds.length === 0 && !section.locked).length;

  return [
    !hasTesting && {
      id: "gap_testing",
      severity: "Critical",
      title: "No usability testing evidence found",
      detail: "A portfolio can still publish, but the agent should ask for testing notes or clearly state the limitation.",
      action: "Ask: did you test this with users, peers, or instructors?"
    },
    !hasOutcomeEvidence && {
      id: "gap_outcome",
      severity: "Important",
      title: "Impact is not yet measurable",
      detail: "Recruiters scan for outcomes. The system should prompt for qualitative or quantitative impact before export.",
      action: "Add before/after metrics, rubric results, stakeholder feedback, or learning outcomes."
    },
    hasTechnical && {
      id: "gap_hybrid",
      severity: "Suggestion",
      title: "Hybrid credibility detected",
      detail: "Technical artifacts can differentiate the user, but they need to be translated into product value.",
      action: "Generate a technical credibility sidebar for the portfolio."
    },
    lowConfidence > 0 && {
      id: "gap_confidence",
      severity: "Important",
      title: `${lowConfidence} item needs human review`,
      detail: "Low-confidence artifacts should not drive claims until the user confirms classification.",
      action: "Review classification and placement."
    },
    unlockedUnsupported > 0 && {
      id: "gap_evidence",
      severity: "Critical",
      title: "Unsupported claims are visible",
      detail: "Sections without evidence must use careful language or show “no evidence found.”",
      action: "Attach evidence or downgrade claims."
    }
  ].filter(Boolean) as Gap[];
}
