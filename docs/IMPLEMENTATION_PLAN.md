# Implementation Plan

## Milestone Breakdown

### Milestone 1: Product Model Foundation

- Public product site.
- Portfolio studio route.
- Navigation skeleton.
- Portfolio preview and placeholder product pages.
- Documentation foundation.

Definition of done:
- Production URL verified.
- Product reads as full portfolio website builder.
- Docs exist for product, tech, UX, flow, schema, implementation.

### Milestone 2: Durable Artifact Pipeline

- Production storage configured.
- PostgreSQL metadata enabled.
- Upload limits and validation.
- Parser status persistence.
- Artifact library empty/loading/error states.

Definition of done:
- Uploads survive deployment.
- Failed parser states are visible.
- No local `.data` dependency in production.

### Milestone 3: Trusted Evidence Graph

- Relationship persistence in database.
- Cluster editing and manual graph corrections.
- Project entity creation from confirmed clusters.
- Audit log for user overrides.

Definition of done:
- Agent generation only uses confirmed or needs-review evidence.
- Rejected clusters are excluded.

### Milestone 4: Portfolio Composer

- Generate full portfolio site model.
- Home/about/project/resume/skills/contact pages.
- Multiple case studies.
- Page/section editor.

Definition of done:
- User can generate a full editable portfolio site from artifacts.

### Milestone 5: Publishing

- Hosted public portfolio URLs.
- SEO/social metadata.
- Accessibility checks.
- Publish/unpublish lifecycle.

Definition of done:
- User can publish and share a portfolio website.

## Development Phases

1. Foundation and docs.
2. Storage and parsing.
3. Evidence graph and project model.
4. Constrained agent reasoning.
5. Portfolio composition.
6. Publishing and exports.
7. Integrations and collaboration.

## Feature Dependencies

- Agent reasoning depends on confirmed evidence graph.
- Portfolio composer depends on project model.
- Publishing depends on portfolio page model.
- Real AI depends on durable storage and extraction.
- Integrations depend on auth and ownership.

## QA Requirements

- `npm run build` must pass.
- Browser QA for desktop and mobile.
- Verify production content after every deploy.
- Upload flow smoke test.
- API route smoke test.
- Accessibility review for focus, contrast, labels, and keyboard access.
- Regression check for public routes and studio route.

## Production Deployment Checkpoints

1. Commit to GitHub.
2. Confirm Git author is allowed to deploy on Vercel.
3. Wait for Vercel build status `Ready`.
4. Verify production URL content.
5. Verify key route responses.
6. Record deployment commit in final update.

## Technical Debt Management

- Track local fallback code that must be replaced before production upload usage.
- Keep simulated intelligence clearly labeled.
- Avoid adding deep AI features before schema and storage are stable.
- Refactor repeated UI patterns into components as they stabilize.
- Keep docs updated when product direction changes.

## Rollback Strategy

- Vercel can promote a previous ready deployment.
- Git can revert a bad commit with a new revert commit.
- Database migrations must be backward-compatible where possible.
- Feature flags should gate risky AI or publishing changes.

## Release Strategy

- Main branch deploys to production for early MVP.
- Future: PR previews and release branches.
- Use draft PRs for larger changes.
- Ship in small verified steps with documentation updates.

## Definition of Done by Stage

- Product change: docs updated, local build passed, browser QA passed, production verified.
- API change: schema/types updated, error states handled, smoke tested.
- UI change: responsive, accessible, focused, and no critical overlap.
- AI/intelligence change: source-grounded, user-overridable, and never overwrites protected user edits.
- Publishing change: public URL verified, rollback path known, SEO/accessibility basics checked.
