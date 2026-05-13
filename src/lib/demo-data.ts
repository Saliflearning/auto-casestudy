import { Artifact, CaseStudySection, Persona } from "@/lib/types";

export const initialArtifacts: Artifact[] = [
  {
    id: "artifact_interviews",
    name: "Interview_Notes_HCI_Onboarding.pdf",
    kind: "PDF",
    phase: "Research",
    confidence: "High",
    confidenceScore: 94,
    evidenceStrength: 91,
    extractedSignals: ["participant pain points", "workflow friction", "qualitative research"],
    suggestedPlacement: "Research Evidence",
    risk: "Ready for draft generation.",
    sourceLabel: "Interview Notes"
  },
  {
    id: "artifact_affinity",
    name: "Affinity_Map_Studio_Photo.png",
    kind: "Photo",
    phase: "Synthesis",
    confidence: "High",
    confidenceScore: 89,
    evidenceStrength: 84,
    extractedSignals: ["pattern grouping", "sticky-note synthesis", "decision rationale"],
    suggestedPlacement: "Synthesis",
    risk: "Ready for draft generation.",
    sourceLabel: "Affinity Map"
  },
  {
    id: "artifact_figma",
    name: "Figma_Onboarding_Prototype_Link",
    kind: "Figma",
    phase: "Design Exploration",
    confidence: "Medium",
    confidenceScore: 78,
    evidenceStrength: 74,
    extractedSignals: ["prototype frames", "interaction flow", "visual iteration"],
    suggestedPlacement: "Design Story",
    risk: "Frame names should be confirmed before publishing.",
    sourceLabel: "Figma Prototype"
  },
  {
    id: "artifact_testing",
    name: "Usability_Testing_Findings.docx",
    kind: "DOCX",
    phase: "Validation",
    confidence: "High",
    confidenceScore: 92,
    evidenceStrength: 88,
    extractedSignals: ["task success", "testing feedback", "iteration trigger"],
    suggestedPlacement: "Validation",
    risk: "Ready for draft generation.",
    sourceLabel: "Testing Findings"
  },
  {
    id: "artifact_cloud",
    name: "AWS_System_Architecture_Diagram.png",
    kind: "Image",
    phase: "Technical Implementation",
    confidence: "Medium",
    confidenceScore: 81,
    evidenceStrength: 77,
    extractedSignals: ["cloud architecture", "system design", "technical credibility"],
    suggestedPlacement: "Technical Credibility",
    risk: "Translate technical claims into user or product value.",
    sourceLabel: "AWS Architecture"
  },
  {
    id: "artifact_resume",
    name: "Resume_UX_Cloud_Hybrid.pdf",
    kind: "Resume",
    phase: "Professional Identity",
    confidence: "High",
    confidenceScore: 90,
    evidenceStrength: 86,
    extractedSignals: ["role claims", "skills", "experience"],
    suggestedPlacement: "Professional Identity",
    risk: "Cross-link resume claims to project proof.",
    sourceLabel: "Resume"
  }
];

export const initialPersona: Persona = "Technical UX Hybrid";

export const initialSections: CaseStudySection[] = [
  {
    id: "section_overview",
    title: "Hybrid Portfolio Thesis",
    type: "overview",
    content:
      "A technical UX hybrid who can move from research ambiguity to product decisions and explain the system constraints behind the final experience.",
    evidenceIds: ["artifact_interviews", "artifact_resume", "artifact_cloud"],
    locked: false
  },
  {
    id: "section_research",
    title: "Research Foundation",
    type: "research",
    content:
      "Interview notes and usability evidence show where users struggled, which decisions were grounded in observation, and which claims need more support before publishing.",
    evidenceIds: ["artifact_interviews", "artifact_testing"],
    locked: false
  },
  {
    id: "section_process",
    title: "Reconstructed Design Process",
    type: "process",
    content:
      "The agent reconstructs the project arc from research to synthesis, prototype iteration, usability testing, and final design narrative.",
    evidenceIds: ["artifact_interviews", "artifact_affinity", "artifact_figma", "artifact_testing"],
    locked: false
  },
  {
    id: "section_technical",
    title: "Technical Credibility Layer",
    type: "technical",
    content:
      "Architecture evidence is translated into product credibility: reliability, feasibility, implementation awareness, and cross-functional communication.",
    evidenceIds: ["artifact_cloud"],
    locked: false
  },
  {
    id: "section_outcome",
    title: "Impact And Missing Proof",
    type: "outcome",
    content:
      "The portfolio is export-ready after the user adds measurable outcomes or explicitly labels the result as a learning outcome rather than a business metric.",
    evidenceIds: [],
    locked: false
  }
];
