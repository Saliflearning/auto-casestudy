# Step 022.5 - Production Schema Sync and Live Orchestration QA

## Goal

Validate production persistence for the Step 021 and Step 022 orchestration layers before building the editable portfolio builder shell.

## Production Schema Sync

Production Prisma schema sync completed successfully with `prisma db push`.

Synced models:

- `PortfolioPageComposition`
- `PortfolioExperiencePlan`

Result:

- Database: Neon Postgres production database
- Schema status: in sync with Prisma schema
- Prisma Client regenerated locally
- No schema sync errors reported

## Live QA Target

- Production URL: `https://i-have-a-project-design-on.vercel.app`
- Expected deployed commit: `fa4946d`
- QA workspace: `qa_step0225_1779343610389`
- Isolation workspace: `qa_step0225_other_1779343610389`
- Result artifact: `.data/qa-step0225-results.json`

## QA Matrix

| Area | Check | Result |
| --- | --- | --- |
| Upload | Upload real QA artifacts | Pass |
| Upload | Artifact records returned | Pass |
| Upload | Image artifact available for media placement | Pass |
| Upload | Proof artifact available for hero evidence | Pass |
| Blueprint | Persist confirmed blueprint | Pass |
| Readiness | Readiness gate ready | Pass |
| Generation | Case study generation from persisted blueprint | Pass |
| Guardrails | Rejected visuals excluded from draft media | Pass |
| Quality | Quality evaluation persists | Pass |
| Guardrails | Unsupported or weak evidence fields visible | Pass |
| Layout | Layout composition created | Pass |
| Layout | Responsive metadata exists for desktop/tablet/mobile | Pass |
| Layout | Media placement persists | Pass |
| Layout | Archetype layout strategy persists | Pass |
| Layout | Latest layout composition reloads after refresh | Pass |
| Layout | Region regeneration works | Pass |
| Layout | Region regeneration preserves provenance | Pass |
| Orchestration | Portfolio experience plan created | Pass |
| Orchestration | Homepage strategy persists | Pass |
| Orchestration | Recruiter journey metadata persists | Pass |
| Orchestration | Navigation hierarchy persists | Pass |
| Orchestration | Visual rhythm metadata persists | Pass |
| Orchestration | Archetype remains Technical UX Hybrid | Pass |
| Orchestration | Weak project starts demoted | Pass |
| Guardrails | Unresolved warnings remain visible | Pass |
| Persistence | Portfolio experience reloads after refresh | Pass |
| Editing Prep | Project resequencing persists | Pass |
| Isolation | Layout composition blocked across workspace | Pass |
| Isolation | Portfolio plan blocked across workspace | Pass |
| Failure State | Invalid composition ID fails safely | Pass |
| Failure State | Invalid resequence request fails safely | Pass |

Final result:

- Passed: 31
- Failed: 0

## Created Production QA Records

- Draft: `case_study_draft_qa-live-project_portfolio_blueprint_767ca37d-89ea-4b89-98e3-24de94f42041_1`
- Layout composition: `portfolio_page_composition_case_study_draft_qa-live-project_portfolio_blueprint_767ca37d-89ea-4b89-98e3-24de94f42041_1_1ef84f6b-0084-44c3-9d6e-1be5af44f036`
- Portfolio experience plan: `portfolio_experience_d1015afb-c2fa-449c-8a57-2bc233406c50`

## Persistence Verification Notes

- Layout composition persisted and reloaded through `/api/layout/composition/latest`.
- Region regeneration persisted against the same composition record.
- Portfolio experience plan persisted and reloaded through `/api/portfolio/experience/latest`.
- Project resequencing persisted and returned the updated order.
- Cross-workspace reads for composition and experience plan returned `404`.
- Invalid IDs and invalid resequencing requests returned safe `404` / `422` responses.

## Security and Workspace Notes

- Production uses signed workspace sessions.
- Current MVP workspace behavior can create a signed workspace session from a workspace header or cookie.
- Object access is workspace-scoped; QA confirmed a second workspace could not read the first workspace's composition or portfolio plan.
- Full user authentication and role-based collaboration remain future hardening work before public multi-user usage.

## Bugs and Observations

1. An initial mixed synthetic upload fixture returned `500`.
   - Follow-up single PNG upload passed.
   - Follow-up two-PNG upload passed.
   - Follow-up single synthetic PDF upload returned `200` with artifact status `Failed` and a safe parser error.
   - No code fix was required in this checkpoint.

2. The generated quality report correctly remained `needs revision`.
   - This is expected because the QA artifacts were minimal.
   - The system preserved missing/weak evidence signals instead of claiming publish readiness.

3. No screenshots were captured in this checkpoint.
   - The required validation was persistence/API integrity.
   - Visual browser QA should be repeated after Step 023 adds the editable builder shell.

## Failure Modes Verified

- Invalid composition IDs fail safely.
- Invalid resequence payloads fail safely.
- Cross-workspace object access fails safely.
- Weak supporting project remains lower value until evidence improves.
- Rejected visuals are excluded from generated draft media.
- Unresolved warnings remain visible in portfolio experience metadata.

## Next Step Recommendation

Proceed to Step 023 only after production deployment for commit `fa4946d` remains healthy.

Step 023 should build the editable portfolio builder shell on top of:

- persisted `PortfolioPageComposition`
- persisted `PortfolioExperiencePlan`
- confirmed blueprint
- source provenance
- visible unresolved blockers

Do not bypass the persisted orchestration layer when implementing builder editing.
