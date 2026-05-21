import { ArtifactKind, Persona } from "@/lib/types";

export type CanonicalPersonaPackId =
  | "ux-research-student"
  | "technical-ux-hybrid"
  | "cloud-engineer"
  | "junior-product-designer"
  | "messy-real-user";

export type CanonicalArtifactSeed = {
  id: string;
  fileName: string;
  kind: ArtifactKind;
  mimeType: string;
  phase: string;
  extractedText: string;
  evidenceStrength: number;
  expectedUse: string;
};

export type CanonicalPersonaPack = {
  id: CanonicalPersonaPackId;
  title: string;
  persona: Persona;
  profileHeadline: string;
  validationFocus: string[];
  expectedWeaknesses: string[];
  artifacts: CanonicalArtifactSeed[];
};

export const canonicalPersonaPacks: CanonicalPersonaPack[] = [
  {
    id: "ux-research-student",
    title: "UX Research Student",
    persona: "UX Researcher",
    profileHeadline: "HCI student translating class research into portfolio-ready product stories",
    validationFocus: ["research reconstruction", "academic-to-professional translation", "weak metrics handling"],
    expectedWeaknesses: ["business metrics are weak", "role ownership needs tightening", "final impact is mostly reflective"],
    artifacts: [
      {
        id: "uxrs-interviews",
        fileName: "Campus_Dining_Interview_Notes.pdf",
        kind: "PDF",
        mimeType: "application/pdf",
        phase: "Research",
        evidenceStrength: 88,
        expectedUse: "primary research source",
        extractedText:
          "Project: Campus Dining Accessibility Redesign. Course: HCI 530. March 2026. Interview notes from 6 students. Methods: interview, thematic analysis. Participants described menu confusion, dietary filter anxiety, and long lines. Tool: Dovetail."
      },
      {
        id: "uxrs-affinity",
        fileName: "Affinity_Map_Studio_Photo.png",
        kind: "Photo",
        mimeType: "image/png",
        phase: "Synthesis",
        evidenceStrength: 80,
        expectedUse: "synthesis visual",
        extractedText:
          "Project: Campus Dining Accessibility Redesign. Affinity map photo. Themes: access needs, nutrition labels, dining hall navigation, time pressure. Method: affinity map. Tool: FigJam."
      },
      {
        id: "uxrs-usability",
        fileName: "Usability_Findings_Round1.docx",
        kind: "DOCX",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        phase: "Validation",
        evidenceStrength: 84,
        expectedUse: "testing evidence",
        extractedText:
          "Project: Campus Dining Accessibility Redesign. Usability test with 4 classmates. Findings: filter labels unclear, route to allergy info took too long, participants missed the compare menu action. Outcome: validated navigation issue but no business metric."
      },
      {
        id: "uxrs-figma",
        fileName: "Figma_Menu_Filter_Frames.png",
        kind: "Image",
        mimeType: "image/png",
        phase: "Design Exploration",
        evidenceStrength: 73,
        expectedUse: "prototype visual",
        extractedText:
          "Project: Campus Dining Accessibility Redesign. Figma frames for menu filters, dietary tags, and dining hall status cards. Tool: Figma. Prototype iteration from research insight."
      },
      {
        id: "uxrs-report",
        fileName: "Final_Class_Project_Report.pdf",
        kind: "PDF",
        mimeType: "application/pdf",
        phase: "Reflection",
        evidenceStrength: 76,
        expectedUse: "academic reflection",
        extractedText:
          "Project: Campus Dining Accessibility Redesign. Course: HCI 530. Reflection-heavy final report. Limitations: small participant pool, no deployment, learning outcome focused on evidence-based design decisions."
      }
    ]
  },
  {
    id: "technical-ux-hybrid",
    title: "Technical UX Hybrid",
    persona: "Technical UX Hybrid",
    profileHeadline: "UX researcher and technical builder connecting product decisions to implementation constraints",
    validationFocus: ["hybrid storytelling", "technical credibility", "cross-functional narrative"],
    expectedWeaknesses: ["resume role claims conflict", "cloud evidence can overpower UX story", "metrics are partial"],
    artifacts: [
      {
        id: "tuxh-research",
        fileName: "Clinic_Onboarding_User_Research.docx",
        kind: "DOCX",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        phase: "Research",
        evidenceStrength: 86,
        expectedUse: "research spine",
        extractedText:
          "Project: Clinic Onboarding Portal. Role: UX researcher and implementation support. Interviews with intake coordinators. Methods: interview, journey map, usability test. Tools: Figma, Jira. Pain points: duplicate forms, unclear eligibility status, handoff delays."
      },
      {
        id: "tuxh-prototype",
        fileName: "Figma_Intake_Dashboard_Prototype.png",
        kind: "Image",
        mimeType: "image/png",
        phase: "Design Exploration",
        evidenceStrength: 82,
        expectedUse: "design proof",
        extractedText:
          "Project: Clinic Onboarding Portal. Figma prototype frames for intake dashboard, eligibility status, task queue, and handoff notes. Iteration connected to usability testing."
      },
      {
        id: "tuxh-architecture",
        fileName: "AWS_System_Architecture_Diagram.png",
        kind: "Image",
        mimeType: "image/png",
        phase: "Technical Implementation",
        evidenceStrength: 88,
        expectedUse: "technical credibility",
        extractedText:
          "Project: Clinic Onboarding Portal. AWS architecture diagram. Services: AWS, API Gateway, Lambda, PostgreSQL, S3. Shows secure file upload, audit logging, background task processing, and role-based access."
      },
      {
        id: "tuxh-github",
        fileName: "GitHub_Readme_Implementation.md",
        kind: "Code",
        mimeType: "text/markdown",
        phase: "Technical Implementation",
        evidenceStrength: 78,
        expectedUse: "implementation proof",
        extractedText:
          "Project: Clinic Onboarding Portal. GitHub README. React, Next.js, FastAPI prototype, PostgreSQL schema, deployment notes, and accessibility checklist. Outcome: improved prototype handoff clarity, no production launch metric."
      },
      {
        id: "tuxh-resume",
        fileName: "Resume_UX_Cloud_Hybrid_v3.pdf",
        kind: "Resume",
        mimeType: "application/pdf",
        phase: "Professional Identity",
        evidenceStrength: 68,
        expectedUse: "role cross-check",
        extractedText:
          "Resume. Claims: designed and tested onboarding workflow, supported AWS architecture documentation, collaborated with engineering. Inconsistent role title: UX researcher, product designer, cloud support analyst."
      }
    ]
  },
  {
    id: "cloud-engineer",
    title: "Cloud Engineer",
    persona: "Cloud/IT Hybrid",
    profileHeadline: "Cloud engineer turning infrastructure evidence into recruiter-readable project proof",
    validationFocus: ["technical portfolio generation", "infrastructure explanation", "weak visual storytelling"],
    expectedWeaknesses: ["few user-facing visuals", "business impact needs confirmation", "project story can become too technical"],
    artifacts: [
      {
        id: "cloud-terraform",
        fileName: "Claims_Migration_Terraform_Main.tf",
        kind: "Code",
        mimeType: "text/plain",
        phase: "Technical Implementation",
        evidenceStrength: 84,
        expectedUse: "infrastructure proof",
        extractedText:
          "Project: Legacy Claims Migration. Terraform for AWS VPC, RDS, S3, IAM, and deployment pipeline. Tools: AWS, Terraform, GitHub. Role: cloud engineer."
      },
      {
        id: "cloud-architecture",
        fileName: "Target_Architecture_Screenshot.png",
        kind: "Image",
        mimeType: "image/png",
        phase: "Technical Implementation",
        evidenceStrength: 82,
        expectedUse: "architecture visual",
        extractedText:
          "Project: Legacy Claims Migration. Architecture screenshot showing legacy batch intake, API Gateway, RDS PostgreSQL, S3 document archive, monitoring dashboard, and backup flow."
      },
      {
        id: "cloud-deployment",
        fileName: "Deployment_Notes_Runbook.docx",
        kind: "DOCX",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        phase: "Technical Implementation",
        evidenceStrength: 79,
        expectedUse: "implementation explanation",
        extractedText:
          "Project: Legacy Claims Migration. Deployment notes. Steps: blue/green release, rollback plan, smoke tests, monitoring alerts. Outcome: reduced manual deployment risk; exact percentage not verified."
      },
      {
        id: "cloud-monitoring",
        fileName: "CloudWatch_Monitoring_Dashboard.jpg",
        kind: "Image",
        mimeType: "image/jpeg",
        phase: "Validation",
        evidenceStrength: 70,
        expectedUse: "operational proof",
        extractedText:
          "Project: Legacy Claims Migration. Monitoring dashboard screenshot. Metrics: latency, error rate, RDS CPU, queue depth. No before and after baseline attached."
      }
    ]
  },
  {
    id: "junior-product-designer",
    title: "Junior Product Designer",
    persona: "Product Designer",
    profileHeadline: "Junior product designer turning visual-heavy work into clear process stories",
    validationFocus: ["process reconstruction", "visual hierarchy", "weak documentation handling"],
    expectedWeaknesses: ["research documentation is thin", "outcomes vague", "visuals need captions and rationale"],
    artifacts: [
      {
        id: "jpd-screens",
        fileName: "Study_Planner_Final_UI_Screens.png",
        kind: "Image",
        mimeType: "image/png",
        phase: "Design Exploration",
        evidenceStrength: 84,
        expectedUse: "final visual proof",
        extractedText:
          "Project: Study Planner App. Figma final UI screens. Tools: Figma. Includes dashboard, calendar, task detail, and progress states."
      },
      {
        id: "jpd-prototype",
        fileName: "Prototype_Flow_Export.pdf",
        kind: "PDF",
        mimeType: "application/pdf",
        phase: "Design Exploration",
        evidenceStrength: 76,
        expectedUse: "interaction flow",
        extractedText:
          "Project: Study Planner App. Prototype export. Flow: onboarding, goal setup, weekly plan, reminder preferences. Limited rationale notes."
      },
      {
        id: "jpd-notes",
        fileName: "Scattered_Process_Notes.txt",
        kind: "Notes",
        mimeType: "text/plain",
        phase: "Research",
        evidenceStrength: 54,
        expectedUse: "weak research source",
        extractedText:
          "Project: Study Planner App. Notes: students forget deadlines, need less clutter, maybe gamify. Mentioned two informal peer conversations but no structured interview protocol."
      },
      {
        id: "jpd-critique",
        fileName: "Design_Critique_Feedback.docx",
        kind: "DOCX",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        phase: "Validation",
        evidenceStrength: 66,
        expectedUse: "iteration trigger",
        extractedText:
          "Project: Study Planner App. Critique feedback from class. Improved visual hierarchy and reduced sidebar complexity after critique. No measurable outcome."
      }
    ]
  },
  {
    id: "messy-real-user",
    title: "Messy Real User",
    persona: "Technical UX Hybrid",
    profileHeadline: "Early-career hybrid professional with scattered school, work, and technical evidence",
    validationFocus: ["resilience", "evidence disambiguation", "hallucination prevention"],
    expectedWeaknesses: ["duplicate files", "conflicting project names", "vague outcomes", "missing final visuals", "mixed school/work evidence"],
    artifacts: [
      {
        id: "messy-foodshare-notes",
        fileName: "notes_final_FINAL2.docx",
        kind: "DOCX",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        phase: "Research",
        evidenceStrength: 52,
        expectedUse: "ambiguous research notes",
        extractedText:
          "Project: FoodShare App. Course: HCI capstone. Interview notes maybe from 3 users. People said pantry pickup is confusing. Outcome: better? no metrics. Tool: Figma."
      },
      {
        id: "messy-foodshare-copy",
        fileName: "copy_of_notes_final.docx",
        kind: "DOCX",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        phase: "Research",
        evidenceStrength: 38,
        expectedUse: "duplicate/low confidence evidence",
        extractedText:
          "Project: Food Share redesign. Duplicate-ish interview notes. Some parts conflict: 5 users maybe, or classmates. Need review before claiming participant count."
      },
      {
        id: "messy-bad-screenshot",
        fileName: "IMG_4472_blurry.png",
        kind: "Photo",
        mimeType: "image/png",
        phase: "Design Exploration",
        evidenceStrength: 32,
        expectedUse: "weak visual",
        extractedText:
          "Project: FoodShare App. Blurry phone photo of sticky notes and rough wireframe. Visual parsing pending. Not enough to prove final design quality."
      },
      {
        id: "messy-cloud",
        fileName: "aws-diagram-old.png",
        kind: "Image",
        mimeType: "image/png",
        phase: "Technical Implementation",
        evidenceStrength: 58,
        expectedUse: "separate technical project clue",
        extractedText:
          "Project: HelpDesk Cloud Migration. AWS diagram with S3, Lambda, IAM, logging. Work project, not the HCI capstone. Outcome unclear."
      },
      {
        id: "messy-resume-a",
        fileName: "resume_new.pdf",
        kind: "Resume",
        mimeType: "application/pdf",
        phase: "Professional Identity",
        evidenceStrength: 50,
        expectedUse: "conflicting resume",
        extractedText:
          "Resume version A. Claims product designer, UX researcher, AWS support. Designed FoodShare onboarding and migrated help desk assets. No dates."
      },
      {
        id: "messy-resume-b",
        fileName: "resume_latest_real.pdf",
        kind: "Resume",
        mimeType: "application/pdf",
        phase: "Professional Identity",
        evidenceStrength: 48,
        expectedUse: "conflicting resume",
        extractedText:
          "Resume version B. Claims cloud support analyst and UX volunteer. Same projects as version A but different titles. Needs user confirmation."
      }
    ]
  }
];
