# Step Title

## High-Level Architecture Diagram

```mermaid
flowchart LR
  User["User"]
  App["Auto-CaseStudy App"]
  Agent["Agentic Intelligence Layer"]
  Output["Editable Portfolio Story"]

  User --> App
  App --> Agent
  Agent --> Output
Output --> User
```

## Data Flow Map

```mermaid
sequenceDiagram
  participant User
  participant UI
  participant API
  participant Storage
  participant Database
  User->>UI: Initiates workflow
  UI->>API: Sends validated request
  API->>Storage: Stores durable files when needed
  API->>Database: Stores metadata and status
  Database-->>UI: Returns updated state
```

## Tech Stack Used

- Frontend:
- State:
- Data/parsing:
- Agent/AI:
- Deployment:

## Why This Stack Was Chosen

- Choice 1:
- Choice 2:
- Trade-off:

## What Each Part Does

- Part 1:
- Part 2:
- Part 3:

## How To Reproduce It

```bash
npm install
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Security / Privacy Notes

- File/data exposure risk:
- Authentication or access-control impact:
- Environment variables or secrets touched:
- Failure/abuse case considered:

## QA Checklist

- Build passes:
- Main happy path tested:
- Empty/loading/error states tested:
- Broken/dead buttons checked:
- Mobile/responsive behavior checked:
- Accessibility basics checked:

## Failure Modes

- Failure mode:
- User-visible response:
- Recovery path:

## Feasibility Notes

- Data required:
- Storage location:
- Failure behavior:
- MVP necessity:

## What Comes Next

- Next improvement:
- Known limitation:
- Decision needed:
