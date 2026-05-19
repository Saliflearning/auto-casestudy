# Agent Skills Usage

The `addyosmani/agent-skills` pack has been installed locally for Codex. These skills should be used as quality lenses during Auto-CaseStudy development.

## Required Skill Lenses By Work Type

| Work Type | Skill Lens |
| --- | --- |
| API routes, contracts, upload endpoints, reference ingestion | `api-and-interface-design` |
| Browser QA, local app checks, visual verification | `browser-testing-with-devtools` |
| GitHub Actions, Vercel previews, release automation | `ci-cd-and-automation` |
| Pull-request review, regression risk, maintainability | `code-review-and-quality` |
| Removing unnecessary complexity | `code-simplification` |
| Agent memory, prompt context, evidence graph design | `context-engineering` |
| Upload/parser/runtime errors | `debugging-and-error-recovery` |
| Framework or dependency upgrades | `deprecation-and-migration` |
| ADRs, step docs, product/architecture records | `documentation-and-adrs` |
| Architecture uncertainty and evidence-first decisions | `doubt-driven-development` |
| Studio UI, editor, preview, responsive layouts | `frontend-ui-engineering` |
| Branching, commits, releases, rollback | `git-workflow-and-versioning` |
| Early product shaping and feature tradeoffs | `idea-refine` |
| MVP sequencing and small safe steps | `incremental-implementation` |
| User discovery and follow-up question design | `interview-me` |
| Build/runtime performance and payload size | `performance-optimization` |
| Sprint planning and task breakdown | `planning-and-task-breakdown` |
| File upload, private artifacts, auth, abuse risks | `security-and-hardening` |
| Production readiness and launch checks | `shipping-and-launch` |
| Evidence-first implementation and source grounding | `source-driven-development` |
| Formal feature specs and acceptance criteria | `spec-driven-development` |
| Parser/API/frontend workflow test design | `test-driven-development` |

## Auto-CaseStudy Priority

These skills should not override the product doctrine. They should reinforce it:

> Generation is downstream of understanding.

Use the installed skills to strengthen:

- evidence ingestion
- provenance
- security
- UI consistency
- API contracts
- testing discipline
- reference intelligence
- production deployment quality

Do not use them to justify unrelated features, marketplace logic, fintech infrastructure, or generic portfolio-builder scope creep.

## Practical Rule

Before major changes, choose the smallest relevant set of lenses:

- Product uncertainty: `idea-refine`, `planning-and-task-breakdown`, `doubt-driven-development`
- New API/data flow: `api-and-interface-design`, `security-and-hardening`, `test-driven-development`
- UI/editor/preview change: `frontend-ui-engineering`, `browser-testing-with-devtools`, `code-review-and-quality`
- Release/deployment change: `ci-cd-and-automation`, `shipping-and-launch`, `git-workflow-and-versioning`
- Documentation/architecture step: `documentation-and-adrs`, `source-driven-development`, `spec-driven-development`
