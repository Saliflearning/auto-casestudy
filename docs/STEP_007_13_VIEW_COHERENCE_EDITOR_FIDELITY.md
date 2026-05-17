# Step 007.13 - View Coherence and Editor Fidelity

## High-Level Map

```mermaid
flowchart LR
  A["Inbox: import"] --> B["Review: verify evidence"]
  B --> C["Strategy: choose story"]
  C --> D["Editor: build case study"]
  D --> E["Preview: inspect site"]
  E --> F["Publish: package"]
```

## What Changed

- Reduced duplicate headers across the studio views.
- Moved persona editing into Strategy; the top bar now shows persona as status.
- Removed repeated child titles from Inbox, Preview, and Publish.
- Rebuilt Editor as a case-study workspace:
  - left outline,
  - center story canvas,
  - right evidence inspector.
- Kept existing section ordering, locking, evidence links, and prompt editing behavior.

## Design Rationale

Each view now has a clearer job:

- Inbox imports artifacts.
- Review checks what the system found.
- Strategy decides the portfolio structure and audience.
- Editor builds the case-study narrative.
- Preview shows the public-facing portfolio.
- Publish checks export readiness.

The Editor is no longer just a raw textarea stack. It is closer to the intended product model: an evidence-backed portfolio story builder.

## What Comes Next

- Add structured fields per section: problem, role, process, decision, outcome, reflection.
- Add visual/media slots per section.
- Add claim-level evidence checking in the inspector.
- Add route-backed studio views so each mode can be shared and refreshed directly.
