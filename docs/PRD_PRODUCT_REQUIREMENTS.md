# Product Requirements Document: Auto-CaseStudy

## Product Vision

Auto-CaseStudy is an agentic portfolio website builder that turns messy career, academic, research, design, and technical evidence into a complete editable portfolio website.

The product starts with the question: "Show me what you have done." It then organizes artifacts into projects, builds evidence-backed portfolio pages, and helps users publish a credible professional identity.

## Target Users

- HCI and UX students with project artifacts spread across courses.
- UX researchers who need evidence-heavy case studies.
- Product designers who need polished project storytelling.
- Technical UX hybrids with cloud, software, IT, or data artifacts.
- Early-career professionals turning school, work, and independent projects into a portfolio.
- Future: mentors, reviewers, academic programs, recruiters, and team admins.

## Business Goals

- Help users create a publishable portfolio website faster than manual writing and layout tools.
- Differentiate through evidence intelligence, provenance, and professional cognition modes.
- Build toward hosted portfolio publishing and paid creator workflows.
- Maintain trust by preventing unsupported AI claims.

## Core Workflows

1. User creates or opens a portfolio workspace.
2. User uploads messy artifacts.
3. System stores metadata and extracts raw content where possible.
4. System classifies artifacts and tags evidence.
5. System maps relationships into project clusters.
6. User confirms the evidence graph.
7. System generates portfolio site structure, project pages, and case studies.
8. User edits manually or with agent-assisted commands.
9. User previews and publishes the portfolio website.

## Feature Definitions

- Public product site: explains the product and routes users into the studio.
- Portfolio studio: authenticated-style workspace for upload, review, editing, and publishing.
- Artifact ingestion: accepts PDFs, DOCX, PPTX, images, and future links/integrations.
- Parsing layer: extracts raw text from supported documents.
- Classification layer: labels artifact type, tools, methods, dates, projects, outcomes.
- Evidence graph: maps artifacts to project clusters and lets users confirm/reject assumptions.
- Portfolio composer: future engine that generates home, about, projects, case studies, resume, skills, and contact sections.
- Publishing hub: future hosted portfolio, share links, exports, and domains.

## User Stories

- As an HCI student, I want to upload course files so the system can identify projects and produce portfolio-ready stories.
- As a UX researcher, I want claims linked to source artifacts so I can trust and defend generated case studies.
- As a product designer, I want visuals placed into project pages so my process and final design are easy to scan.
- As a technical hybrid, I want technical documents and cloud diagrams represented without losing UX storytelling.
- As a portfolio creator, I want to edit or override AI assumptions before publishing.
- As a future admin, I want auditability and permission control for user data.

## Functional Requirements

- Upload and store artifact metadata.
- Parse text from PDF, DOCX, and PPTX; mark images as visual parsing pending.
- Classify artifacts with deterministic MVP rules.
- Generate relationship clusters from shared tags, tools, courses/jobs, and project clues.
- Let users rename, confirm, reject, and edit project clusters.
- Show public product navigation: Home, Projects, Portfolio Studio, Templates, Publish.
- Distinguish public marketing pages from the creation studio.
- Show a full portfolio website preview, not only one case study.
- Preserve source/evidence links for generated claims.

## Non-Functional Requirements

- WCAG 2.1 AA target.
- Mobile-first responsive layout.
- 44px minimum interactive targets.
- Production deploys must pass build checks.
- Durable storage required before real production upload usage.
- No hallucinated metrics, findings, users, citations, or outcomes.
- User edits and confirmed graph decisions must not be overwritten without consent.

## Success Metrics

- User understands the product creates a full portfolio website within 5 seconds.
- User can complete upload-to-first-portfolio-draft in under 30 minutes.
- User can correct wrong clusters or classifications easily.
- Generated claims are traceable to source artifacts.
- Recruiters can scan the published portfolio in under 3 minutes.
- Researchers can identify source evidence for major claims.

## MVP Scope

- Public product site.
- Portfolio studio skeleton.
- File upload and metadata.
- Local/Vercel-ready storage abstraction.
- Raw text extraction.
- Deterministic classification.
- Relationship mapping.
- User-confirmed evidence graph.
- Editable preview surfaces and placeholder publishing.

## Future Roadmap

- Real multimodal AI parsing and OCR.
- Full portfolio site model generation.
- Auth, accounts, organizations, and permissions.
- PostgreSQL production schema expansion.
- Vercel Blob or S3 file storage.
- Hosted portfolio publishing.
- Figma, Google Drive, GitHub, LinkedIn, Notion, Webflow integrations.
- Reviewer/mentor collaboration.
- Analytics, custom domains, and export formats.

## Platform Scope

In scope: portfolio website creation, artifact intelligence, project/case-study generation, evidence traceability, publishing workflow.

Out of scope for current MVP: booking, payments, marketplace transactions, recruiter analytics, institutional dashboards, real-time collaboration.
