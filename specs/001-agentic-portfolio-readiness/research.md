# Research: Agentic Portfolio Readiness

Reviewed: 2026-08-27

## Baseline

- Private, non-fork repository; default branch `main`; no description or topics.
- Next.js 15.5.18, React 18, Prisma/PostgreSQL schema, local JSON fallback, and Vercel Blob support.
- Production build and TypeScript pass; deprecated `next lint` passes; no test files or test script.
- CI runs only install and build.
- Optional Vercel preview workflow creates failed runs with no jobs because its job condition is invalid/unusable in current configuration.
- Full npm audit reports seven high-severity dependency groups, including direct Next.js and PostCSS findings.
- Redacted current-tree/history scan found no secret, phone, or non-synthetic email pattern matches.

## Implemented reality

- PDF, DOCX, and PPTX text parsing are implemented; image visual parsing remains pending.
- Classification and case-study generation are deterministic rules, not external-LLM inference.
- Artifact metadata can persist to PostgreSQL or local JSON; file storage uses local disk or Vercel Blob.
- Evidence graphs, blueprint review, constrained drafting, revisions, quality evaluation, layout composition, and portfolio orchestration have concrete modules and API routes.
- Workspace sessions are signed HTTP-only cookies, but the application creates a default demo owner session and does not implement real account authentication.
- Hosted publishing remains a gated placeholder.

## Initial comparison signal

`Agentic_portfolio` has the cleaner publication history and broader portfolio-planning architecture. `hci-portfolio-agent` has real model-provider integrations and conventional user authentication but an unsafe historical database and larger backend typing debt. Canonical status remains undecided until remediation and a formal matrix are complete.
