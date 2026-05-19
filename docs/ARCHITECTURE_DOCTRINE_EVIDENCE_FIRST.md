# Architecture Doctrine - Evidence First, Generation Second

Auto-CaseStudy is not a generic AI portfolio generator or template-based site builder.

The core product philosophy is:

> Generation is downstream of understanding.

The system must first prove that it can ingest, read, classify, organize, and understand messy professional evidence before attempting to generate portfolio pages.

## Why This Matters

The real value is not AI writing. The real value is reconstructing meaningful professional narratives from fragmented artifacts:

- PDFs
- screenshots
- research notes
- Figma exports
- presentations
- technical documents
- project files
- resumes
- certifications

If the system writes before it understands, it becomes a generic content generator. If it understands before it writes, it becomes professional evidence intelligence.

## Architecture Sequence

```mermaid
flowchart LR
  A["Messy artifacts"] --> B["Ingestion"]
  B --> C["Parsing / extraction"]
  C --> D["Classification"]
  D --> E["Relationship mapping"]
  E --> F["User-confirmed evidence graph"]
  F --> G["Professional agent review"]
  G --> H["Portfolio planning"]
  H --> I["Generation"]
  I --> J["Editable publishable portfolio"]
```

## Why The Evidence Graph Comes Before Generation

The system should think before it writes. It needs to understand:

- project boundaries
- timelines
- methods
- visuals
- evidence quality
- missing information
- audience needs
- recruiter relevance
- academic rigor
- technical credibility

Only after that should it decide what belongs on a homepage, what becomes a featured project, which images belong in a case study, or which claims are safe to publish.

## Specialized Agents Are Not Agent Theater

Specialized agents exist because different professional perspectives interpret the same evidence differently.

| Agent | Interprets Evidence For |
| --- | --- |
| UX Research Agent | Methodology, research quality, findings, limitations, evidence gaps. |
| UX Designer Agent | Visual hierarchy, flows, iteration, accessibility, media placement. |
| Recruiter Agent | Scanability, impact, role clarity, strongest projects, hiring signal. |
| Portfolio Strategist Agent | Site hierarchy, project order, narrative flow, audience fit. |
| Technical Agent | Architecture, implementation depth, systems thinking, feasibility. |

These agents must operate on the same trusted evidence graph. They should not hallucinate independently.

## Guardrails

Auto-CaseStudy affects professional identity and career opportunities. Therefore:

- Do not invent unsupported claims.
- Do not invent fake metrics.
- Do not invent research findings.
- Do not invent citations.
- Do not invent outcomes.
- Ground important statements in evidence, provenance, or explicit user confirmation.
- Ask follow-up questions when information is missing.
- Separate extracted evidence from inferred strategy.

## Portfolio Reference Intelligence

Portfolio references are internal intelligence infrastructure. They are not a primary end-user feature, a visual inspiration gallery, or traditional deep-learning model training at this stage.

They function as:

- reference intelligence
- structural guidance
- archetype understanding
- storytelling pattern memory
- layout strategy guidance
- recruiter-readable portfolio analysis

Portfolio references are not collected for copying. They are collected to build a structured understanding of what excellent portfolios look like across professional archetypes:

- portfolio archetypes
- storytelling structures
- recruiter-readable layouts
- media hierarchy
- research-heavy vs visual-heavy patterns
- technical depth signals
- strong and weak project page patterns

Examples include UX Research portfolios, Product Design portfolios, Technical UX Hybrid portfolios, Cloud/Engineering portfolios, and Academic Research portfolios.

The system should learn:

- project storytelling patterns
- case study structures
- section hierarchy
- media placement patterns
- recruiter-readable layouts
- visual rhythm
- navigation patterns
- evidence presentation styles

This allows future generation systems to create portfolios that feel intentional, structured, believable, recruiter-friendly, and professionally designed rather than generic AI-generated pages.

References guide agents. They do not replace user evidence, they do not become templates to copy, and they must not be copied directly.

The two intelligence streams remain separate until planning:

```mermaid
flowchart LR
  A["External portfolio references"] --> B["Reference intelligence dataset"]
  B --> C["Layout and storytelling guidance"]
  D["User professional evidence"] --> E["Evidence graph"]
  E --> F["Grounded portfolio content"]
  C --> G["Master portfolio planner"]
  F --> G
  G --> H["Editable portfolio website"]
```

The user-facing experience remains:

```mermaid
flowchart LR
  A["User uploads messy professional evidence"] --> B["Agent understands it"]
  B --> C["System reconstructs projects"]
  C --> D["System generates editable portfolio experiences"]
```

## Product Target

The final output target is a fully publishable professional portfolio website with:

- structured pages
- project index
- nested case-study detail pages
- responsive layouts
- media placement
- provenance-aware claims
- recruiter-ready storytelling
- user-editable sections
- publish/export flow
