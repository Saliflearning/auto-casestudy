# Persona Validation Reports

These reports are generated from synthetic canonical persona packs through the same product engines used by the app. They are intentionally not polished demos.

The live API returns full structured reports:

- `/api/persona-validation`
- `/api/persona-validation?persona=ux-research-student`
- `/api/persona-validation?persona=technical-ux-hybrid`
- `/api/persona-validation?persona=cloud-engineer`
- `/api/persona-validation?persona=junior-product-designer`
- `/api/persona-validation?persona=messy-real-user`

## Latest Local Smoke Results

| Persona | Overall | Status | Readiness | Primary Interpretation |
| --- | ---: | --- | --- | --- |
| UX Research Student | 70 | needs attention | blocked | The research arc is reconstructable, but impact remains weak and reflective. |
| Technical UX Hybrid | 79 | needs attention | blocked | The hybrid story is strongest, but readiness correctly blocks unresolved proof issues. |
| Cloud Engineer | 67 | needs attention | blocked | Technical evidence is usable, but recruiter readability and business outcome proof need work. |
| Junior Product Designer | 61 | needs attention | blocked | Visuals are promising, but weak research documentation lowers trust. |
| Messy Real User | 72 | needs attention | blocked | The system survives messy inputs and keeps ambiguity visible instead of hallucinating certainty. |

## Report Contract

Each API report includes:

- uploaded artifacts
- relationships
- project clusters
- gaps
- understanding backlog
- portfolio strategy plan
- confirmed blueprint
- readiness gate result
- case study draft
- quality report
- revision proposal
- page composition
- portfolio experience plan
- builder draft
- findings
- recruiter observations
- UX observations
- improvement recommendations
- scorecard
