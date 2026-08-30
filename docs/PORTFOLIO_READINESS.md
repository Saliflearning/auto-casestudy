# Portfolio Readiness Assessment

Last verified: 2026-08-30

## Recruiter-facing assessment

Auto-CaseStudy is a public code-portfolio showcase. It demonstrates a substantial Next.js application, server-side document processing, evidence-oriented domain modeling, durable-storage adapters, security-aware defaults, and an end-to-end product workflow.

The repository must be presented as an **evidence-first deterministic portfolio studio**, not as a production AI SaaS or a deployed multi-user platform.

## Verified engineering gates

- `npm audit --audit-level=high`: zero known vulnerabilities
- `npm run lint`: passes with zero warnings
- `npm run typecheck`: passes
- `npm test`: 15 tests across 7 focused suites pass
- `npm run build`: Next.js 16 production build passes across 34 pages and routes

## Privacy and secret review

The current tree and Git history were scanned for credential-shaped values, phone-number patterns, non-synthetic email addresses, and obvious personal-data artifacts. No reportable matches were found. Test and demo identities are synthetic.

Ignored local-only paths include `.env`, `.env*.local`, `.data/`, Vercel metadata, logs, build outputs, and TypeScript build metadata. Environment-variable names are documented; values must remain in local or managed secret stores.

Before changing visibility, run the scans again against the final commit and inspect GitHub Actions output. Automated pattern scans reduce risk but cannot prove that arbitrary prose contains no sensitive context.

## Security model

- Workspace sessions are HMAC-signed and emitted as HttpOnly, SameSite=Lax cookies.
- A signing secret is mandatory in production.
- Studio/API Basic authentication is optional and activates only when `AUTOCASESTUDY_STUDIO_PASSWORD` is configured.
- Artifact URLs remain private unless public URLs are explicitly enabled.
- Portfolio-reference probes and screenshots revalidate DNS destinations at the network boundary, reject non-public IP ranges and credentials, validate redirects, cap HTML responses, and block browser subrequests to private or reserved networks.
- Local JSON persistence is development-only, uses application-owned constant paths under ignored `.data/`, and stores JSON-serialized records that are never loaded as executable code. Durable hosted operation requires PostgreSQL and, for files, Blob storage.
- GitHub Actions use explicit read-only repository permissions. CodeQL, secret scanning with push protection, Dependabot alerts, automated security fixes, and private vulnerability reporting are enabled on GitHub.

## Known limitations and publication guardrails

1. There is no real user-account authentication or per-user authorization system yet.
2. Image and screenshot text extraction is pending.
3. Hosted publishing is represented in the product flow but is not implemented.
4. The generation engine is deterministic; no external LLM is integrated.
5. Browser profile context may be stored in local storage and should not contain sensitive information on shared devices.
6. Optional Vercel previews are disabled unless a repository variable explicitly enables them.
7. ESLint 9 is the newest version accepted by all current Next.js lint-plugin peer ranges; revisit ESLint 10 when those plugins declare compatibility.

## Continuous public-release checklist

- Re-run current-tree and all-history privacy/secret scans.
- Confirm all CI checks pass on the pull request.
- Use screenshots containing synthetic demo data only.
- Add an accurate GitHub description and topics.
- Confirm CodeQL has no unexplained open findings; document any evidence-based false-positive dismissal.
- Keep the stable repository name, deployment URL, and shared AI coordination hub synchronized after any rename or location change.
