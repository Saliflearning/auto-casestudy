# Feature Specification: Agentic Portfolio Readiness

## Objective

Turn `Agentic_portfolio` into a secure, reproducible, recruiter-ready candidate while preserving its independent history and accurately describing deterministic intelligence versus future model-backed AI.

## User stories

1. A recruiter can understand the problem, architecture, implemented workflow, engineering decisions, and limitations in under two minutes.
2. An engineer can install, lint, type-check, test, audit, and build the project from documented commands.
3. The owner can evaluate publication without exposing credentials, personal records, private artifacts, or unsupported claims.
4. Future assistants can compare this repository with `hci-portfolio-agent` without mixing their code or histories.

## Requirements

- R1: Upgrade vulnerable dependencies until full and production npm audits report zero known vulnerabilities.
- R2: Replace deprecated `next lint` with deterministic ESLint CLI configuration.
- R3: Add a type-check script and automated tests for evidence classification, parsing boundaries, constrained generation, and workspace/session safety.
- R4: CI must run clean install, audit, lint, type check, tests, and production build.
- R5: Optional Vercel preview automation must skip cleanly when not enabled and must not create failed empty runs.
- R6: README and metadata must distinguish real parsing/storage/orchestration from deterministic rules, demo state, incomplete authentication, and unimplemented hosted publishing.
- R7: Current-tree and history scans must record redacted results only.
- R8: Architecture and readiness documents must identify trust boundaries and known limitations.
- R9: No public visibility, rename, or canonical declaration occurs before HCI comparison and final independent review.

## Success criteria

- SC1: `npm ci`, lint, type check, tests, and production build pass.
- SC2: `npm audit` and `npm audit --omit=dev` report zero vulnerabilities.
- SC3: At least three core domains have meaningful automated behavior tests.
- SC4: GitHub pull-request checks are green.
- SC5: Privacy report contains no secret or personal values and clearly states the visibility verdict.
- SC6: HCI/Agentic overlap matrix identifies unique strengths, duplication, blockers, and migration candidates with provenance.
