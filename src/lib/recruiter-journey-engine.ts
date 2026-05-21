import { RecruiterJourneyStep } from "@/lib/portfolio-experience-types";
import { PortfolioArchetype } from "@/lib/portfolio-strategy-types";

export function buildRecruiterJourney(archetype: PortfolioArchetype, hasProjects: boolean): RecruiterJourneyStep[] {
  return [
    {
      id: "identity-scan",
      label: "Identity scan",
      expectedQuestion: "Who is this person professionally?",
      portfolioAnswer: archetype === "Technical UX Hybrid" ? "A hybrid who connects research, design, and systems constraints." : `A ${archetype.toLowerCase()} candidate with evidence-backed work.`,
      targetPage: "Home",
      proofType: "identity"
    },
    {
      id: "first-project-click",
      label: "First project click",
      expectedQuestion: "What is the strongest proof of ability?",
      portfolioAnswer: hasProjects ? "The featured project is placed first with role, problem, evidence, and outcome visibility." : "The portfolio must add a featured project before recruiter review.",
      targetPage: "Projects",
      proofType: "project"
    },
    {
      id: "credibility-check",
      label: "Credibility check",
      expectedQuestion: "Can I trust the claims?",
      portfolioAnswer: "Major claims stay linked to source artifacts or remain marked as missing evidence.",
      targetPage: "Case Study",
      proofType: "evidence"
    },
    {
      id: "fit-scan",
      label: "Fit scan",
      expectedQuestion: "Does this person fit the role I am hiring for?",
      portfolioAnswer: "Skills and experience are grouped around the approved archetype and strongest project evidence.",
      targetPage: "Skills",
      proofType: "skills"
    },
    {
      id: "handoff",
      label: "Recruiter handoff",
      expectedQuestion: "How do I contact or save this candidate?",
      portfolioAnswer: "Contact, resume, and share actions remain visible in navigation and final page flow.",
      targetPage: "Contact",
      proofType: "contact"
    }
  ];
}
