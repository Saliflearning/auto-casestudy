# Auto-CaseStudy

Auto-CaseStudy is an agentic portfolio builder for HCI students, UX students, and early-career professionals.

It turns scattered school, work, and project evidence into polished, editable portfolio stories.

## Core Documentation

The project now uses formal product and engineering documents as the source of truth for future development:

- `docs/PRD_PRODUCT_REQUIREMENTS.md`
- `docs/TRD_TECHNICAL_REQUIREMENTS.md`
- `docs/UI_UX_DESIGN_SYSTEM.md`
- `docs/APP_FLOW.md`
- `docs/BACKEND_SCHEMA.md`
- `docs/IMPLEMENTATION_PLAN.md`

Read these before making product, UX, architecture, schema, or release changes.

## MVP Wedge

The current build proves the first workflow:

1. Upload or add messy artifacts.
2. Let the agent group and interpret evidence.
3. Generate one editable case study.
4. Revise manually or with AI-style commands.
5. Prepare the case study for publish/share.

This is not a generic portfolio page builder. The core product is professional evidence intelligence: artifact understanding, relationship mapping, gap detection, persona-aware narrative construction, and provenance.

## Current Status

This prototype uses local simulated intelligence. It does not yet truly parse PDFs, DOCX files, slides, images, Figma files, GitHub repos, or transcripts.

The app is structured so those capabilities can be added behind the current intelligence layer later.

## Roadmap

- Phase 1: Proof of workflow with demo/manual intelligence.
- Phase 2: Real parsing for PDFs, DOCX, slides, images, and links.
- Phase 3: Agent reasoning, relationship mapping, gap detection, and follow-up questions.
- Phase 4: Editable case study and portfolio builder with templates and structure control.
- Phase 5: Hosted publishing first, PDF/export later.

## Major Step Documentation Standard

Every major Auto-CaseStudy step should include:

1. High-level diagram or map.
2. Tech stack used.
3. What each part does.
4. How to reproduce it.
5. What comes next.

Use `docs/STEP_TEMPLATE.md` for new implementation milestones.

Completed step notes:

- `docs/STEP_001_FOUNDATION.md`
- `docs/STEP_002_REAL_ARTIFACT_INGESTION_SKELETON.md`
- `docs/STEP_003_DURABLE_STORAGE_METADATA_FOUNDATION.md`
- `docs/STEP_004_PARSING_QUEUE_EXTRACTED_TEXT_LAYER.md`
- `docs/STEP_005_ARTIFACT_CLASSIFICATION_EVIDENCE_TAGS.md`
- `docs/STEP_006_ARTIFACT_RELATIONSHIP_MAPPING.md`
- `docs/STEP_007_USER_CONFIRMED_EVIDENCE_GRAPH.md`
- `docs/STEP_007_5_UI_DIRECTION_CORRECTION.md`
- `docs/STEP_007_6_CLEAN_UI_MOTION_DIRECTION.md`
- `docs/STEP_007_7_PORTFOLIO_PRODUCT_MODEL_HCI_REVIEW.md`
- `docs/STEP_007_8_PRODUCT_ENGINEERING_DOCUMENTATION_FOUNDATION.md`
- `docs/STEP_007_9_PRODUCT_SCOPE_ISOLATION.md`

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run start
```

## Vercel

This project is Vercel-ready as a Next.js app.

Important: Step 003 supports Vercel Blob and PostgreSQL when environment variables are configured. If they are missing, the app falls back to local `.data` storage for development only.

Recommended early deployment path:

1. Push this repo to GitHub.
2. Import the repo in Vercel.
3. Let Vercel create preview deployments on pull requests.
4. Add production domain only after the MVP workflow feels credible.

Optional GitHub preview deployment is configured in `.github/workflows/vercel-preview.yml` and requires these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
