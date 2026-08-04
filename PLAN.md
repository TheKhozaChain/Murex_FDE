# Murex FDE Workbench — Implementation Plan

## Objective

Build an independent, open-source educational simulation of a Forward Deployed Engineering engagement at fictional HarbourView Bank. The first release proves one controlled workflow end to end: select an incident, gather deterministic evidence, retrieve guidance, produce a cited recommendation, request human approval, and record an audit trail.

## Repository assessment

- The repository began as a new Sites/Next.js TypeScript starter.
- No pre-existing application logic, product decisions, or user-authored source files were present.
- The runtime targets a Cloudflare-compatible worker and supports a local browser preview.
- The default demo must remain useful without a paid model or proprietary data.

## Architecture

1. **Presentation** — role-aware React workbench with engagement, investigation, evaluation, governance, architecture, and value views.
2. **Domain** — typed incidents, reports, evidence, runbooks, recommendations, approvals, traces, and ROI assumptions.
3. **Deterministic workflow** — payload validation, dependency checks, stale-data checks, count reconciliation, duplicate detection, variance/materiality calculations, permission checks, and state transitions.
4. **Retrieval** — local synthetic runbooks and incident history with source identity and trust metadata.
5. **Synthesis** — mock provider by default; structured recommendation output, claim-to-evidence citations, confidence, contradictions, and safe fallback.
6. **Governance** — fail-closed gates, prohibited-action enforcement, explicit human approval, redaction, idempotent execution, and audit records.
7. **Evaluation** — synthetic golden cases, safety/quality metrics, and case-level failure inspection.

## Initial domain model

Institution, Team, User, Report, BatchJob, Dependency, Trade, MarketDatum, Incident, Evidence, Runbook, Investigation, RootCauseCandidate, Recommendation, Approval, Feedback, EvaluationCase, TraceSpan, GovernancePolicy, ROIAssumption.

## Milestones

- [x] Assess repository and record assumptions.
- [x] Establish product shell and synthetic HarbourView Bank context.
- [x] Implement five scenario-backed incident records.
- [x] Implement deterministic evidence and local retrieval demonstration.
- [x] Produce a schema-shaped recommendation with evidence citations.
- [x] Enforce explicit approval and preserve an audit trail.
- [ ] Extract workflow into server-side services and persistent D1/PostgreSQL storage.
- [ ] Expand the golden evaluation corpus to 30+ versioned cases.
- [ ] Add provider adapters for OpenAI, Anthropic, and OpenAI-compatible models.
- [ ] Add API, permission, injection, integration, and end-to-end test suites.
- [ ] Complete all open-source governance documents and ADRs.

## Decisions made safely without user input

- TypeScript end to end for a small, inspectable first slice.
- Mock-model mode as the default so the demonstration has no paid dependency.
- Synthetic, Murex-like concepts with deliberately fictional names and identifiers.
- Conservative materiality and confidence thresholds.
- Support Analyst as the default persona; other views remain selectable.
- Device-local demo state for approvals until durable storage is introduced.

## Assumptions

- This portfolio prototype prioritises a credible, runnable vertical slice over production connectivity.
- “Murex” is used only to describe the practitioner context; no proprietary schema or documentation is represented.
- Financial values are illustrative AUD-equivalent estimates.
- Evaluation and ROI results shown in the first UI are clearly labelled simulated.
- Production data mutation is out of scope and prohibited by design.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Demo mistaken for a real integration | Persistent fictional-data and non-affiliation notices |
| Hallucinated evidence | Closed evidence set; every claim cites an evidence ID |
| Excessive autonomy | Explicit state machine, step limit, prohibited actions, approval gates |
| Conflicting or incomplete evidence | Confidence threshold and fail-closed escalation path |
| Prompt injection in retrieved text | Treat documents as data, trust labels, instruction stripping, schema validation |
| Weak business credibility | Discovery artefacts, decision boundaries, evaluation, governance, and ROI in the product |
| Optimistic value claims | Conservative assumptions and measured/simulated/projected labels |

