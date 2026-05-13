# UI/UX Design System Documentation

## Design Principles

- Calm on the surface, intelligent underneath.
- One primary task per screen.
- Upload and evidence review should feel guided, not technical.
- Case studies are one content type inside a full portfolio website.
- Progressive disclosure beats dense explanation.

## Typography System

- UI font: Inter.
- Editorial/portfolio accent font: Newsreader.
- Type scale:
  - Label: 12px uppercase, increased tracking.
  - Small body: 14px, line-height 20-24px.
  - Body: 16px, line-height 26-28px.
  - Section heading: 24-32px.
  - Hero heading: 44-60px depending on viewport.
- Avoid viewport-based font scaling.
- Keep line length around 60-75 characters on desktop and shorter on mobile.

## Color System

- `background`: app base.
- `surface`: page and section surface.
- `panel`: elevated cards and panels.
- `panelHigh`: hover/elevated state.
- `line`: borders and separators.
- `ink`: primary text.
- `muted`: secondary text.
- `faint`: tertiary text.
- `primary`: primary action and key highlights.
- `emerald`: success/confirmed.
- `amber`: warning/needs attention.
- `danger`: error/rejected.
- `paper`: published portfolio preview.

## Spacing System

- Use 4px/8px increments.
- Controls minimum height: 44px.
- Section gaps: 40-80px depending on viewport.
- Card padding: 16-24px.
- Main desktop container: `max-w-7xl` or product-specific wide studio container.

## Motion Rules

- Motion should clarify flow, not decorate.
- Use 180-280ms transitions for hover/focus.
- Use soft fade-in for first screen content.
- Use gentle scan/progress motion for workflow only.
- Respect `prefers-reduced-motion`.
- Avoid flashing, bouncing, or game-like motion.

## Accessibility Guidelines

- Target WCAG 2.1 AA.
- Maintain visible focus states.
- Use semantic navigation and headings.
- Do not rely on color alone; include text labels.
- Keep touch targets at least 44px.
- Preserve keyboard access to upload, nav, buttons, and forms.
- Add alt text for future user-uploaded media.

## Mobile Responsiveness Rules

- Mobile-first single-column layout.
- Keep public nav wrap-safe and readable.
- Avoid dense sidebars on mobile.
- Prioritize: headline, upload action, preview, workflow.
- Advanced intelligence panels should appear after the core task.
- Prevent horizontal scroll.

## Component Patterns

- Primary button: filled primary, clear action verb.
- Secondary button: bordered, visually quieter.
- Upload card: large dashed drop area with explicit file examples.
- Feature card: 8px radius, border, subtle hover lift.
- Placeholder page: honest skeleton with future scope and studio CTA.
- Preview card: paper-like surface that shows portfolio output.

## Interaction States

- Hover: slight lift or stronger panel background.
- Focus: high-contrast outline.
- Loading: disable primary action and show progress copy.
- Error: inline alert near the failed interaction.
- Empty: explain what the user can do next.
- Confirmed/rejected graph decisions: use text labels and semantic color.

## Navigation Standards

- Public product navigation: Home, Projects, Portfolio Studio, Templates, Publish.
- Studio navigation: Ingest, analysis, strategy, editor, preview, publish.
- Routes should map to product concepts, not implementation internals.
- Public pages explain value; studio pages perform tasks.

## HCI Principles

- Match user mental model: portfolio website first, AI pipeline second.
- Reduce cognitive load by revealing advanced mechanics after upload.
- Support recognition over recall with visible workflow steps.
- Prevent errors by requiring user confirmation before trusting inferred evidence.
- Preserve user control with edit, lock, confirm, reject, and override actions.

## Cognitive Load Reduction Strategy

- First screen answers: what is this, what do I upload, what do I get.
- Use short headings and one supporting sentence.
- Avoid showing source signals, evidence coverage, and provenance before the user sees value.
- Prefer examples and previews over abstract explanation.

## Empty, Loading, and Error States

- Empty projects: invite upload and explain future project library.
- Empty templates: explain persona-driven templates.
- Empty publish: show publishing checklist.
- Uploading: show disabled state and upload copy.
- Parser failure: show artifact-specific parser error.
- Missing evidence: show "No evidence found" instead of inventing claims.
