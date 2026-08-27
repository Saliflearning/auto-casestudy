# Implementation Plan: Agentic Portfolio Readiness

1. Preserve the privacy baseline and document the current publication verdict.
2. Upgrade Next.js/tooling and resolve dependency advisories without changing product semantics.
3. Adopt ESLint CLI, explicit type-check/test scripts, and focused unit tests for core deterministic engines.
4. Strengthen GitHub CI and repair optional Vercel preview gating.
5. Rewrite recruiter documentation from verified code and add architecture/readiness evidence.
6. Run clean-install verification, security scan, five-axis review, Graphify refresh, and GitHub PR checks.
7. Compare with HCI, record provenance decisions in the D: coordination hub, and only then decide canonical/public direction.

## Risks

- Next.js major upgrade may affect middleware conventions and React compatibility.
- Repository modules rely on local demo state alongside durable APIs; documentation must not imply complete account/publishing production readiness.
- Broad UI screenshot work is deferred until runtime verification uses synthetic data and the canonical direction is selected.
