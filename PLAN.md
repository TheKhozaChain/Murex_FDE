# Murex FDE Workbench — Implementation Plan

## Current architecture and honest boundary

The first release is a polished client-side simulation. Five scenarios, their evidence, conclusions, recommendation copy, confidence, and guardrails are static. React state currently simulates execution, approvals, audit events, traces, and evaluation. The D1 schema is empty and the existing smoke tests primarily verify rendering and portfolio wording.

Milestone 2 converts only `HVB-2847` into a real executable vertical slice while preserving the existing product narrative and four remaining scenario previews.

## Target architecture

1. **UI (`app/`)** — retains the current role-aware workbench and calls server routes for executable investigation, approval, traces, and evaluation.
2. **Domain (`src/domain/`)** — Zod-validated types for incidents, structured inputs, evidence, tool executions, recommendation, policy, approval, audit, and evaluation.
3. **Deterministic tools (`src/deterministic/`)** — freshness, exposure, dependency, severity/materiality, and completeness checks.
4. **Retrieval (`src/retrieval/`)** — transparent weighted-token ranking over local, versioned synthetic documents; retrieved text is never instruction.
5. **Synthesis (`src/providers/`)** — provider-neutral interface with a deterministic mock implementation.
6. **Validation and policy (`src/investigation/`, `src/policy/`)** — citation, fact-consistency, prohibited-action, confidence, approval, and fail-closed rules.
7. **Persistence (`src/persistence/`, `db/`)** — repository interface, D1 implementation for hosted state, and in-memory implementation for deterministic tests.
8. **Evaluation (`src/evaluation/`)** — one executable golden case that runs through the same workflow and persists measured scores.

## D1 schema

`incidents`, `investigation_runs`, `tool_executions`, `evidence_records`, `retrieved_documents`, `recommendations`, `policy_decisions`, `approval_decisions`, `audit_events`, `evaluation_cases`, and `evaluation_results`. Structured snapshots use JSON text; indexes support incident/run, audit/run, and evaluation/case lookup. A unique approval index prevents duplicate decisions.

## Server-side investigation workflow

1. Accept only a validated incident ID.
2. Create and persist a running investigation.
3. Execute typed deterministic tools over the server-owned synthetic input.
4. Persist tool outputs and derived evidence.
5. Retrieve and persist attributable guidance.
6. Synthesise a strict recommendation through the configured provider interface.
7. Validate schema, evidence IDs, executed-tool references, and fact consistency.
8. Apply deterministic safety policy and fail closed when necessary.
9. Persist recommendation, policy decision, audit events, and completed state.
10. Return a redacted safe view to the browser.

## Testing approach

- Unit: payload, freshness, exposure, dependency, materiality, evidence completeness, citations, policy, approval transitions, and evaluation scoring.
- Integration: complete workflow, reload from repository, approval/rejection, duplicate approval, and persisted evaluation.
- Security: malicious retrieved instructions, fabricated citation, direct market-data mutation, malformed output, early approval, and immutable audit behavior.
- UI: retain rendered-worker smoke tests.
- CI: install, lint, type-check, full test suite, build, and executable mock evaluation without API keys.

## Milestone checklist

- [x] Preserve the five-scenario enterprise UI and IP boundaries.
- [x] Record the client-simulation starting point honestly.
- [x] Extract typed domain models and synthetic structured input.
- [x] Implement and test all six deterministic checks for `HVB-2847`.
- [x] Implement transparent local retrieval with malicious-document handling.
- [x] Implement provider interface and deterministic mock synthesis.
- [x] Implement citation validation and deterministic policy engine.
- [x] Add D1 schema, migration, repository, seed/reset support, and API routes.
- [x] Connect investigation, approval, audit, trace, and evaluation UI to persisted state.
- [x] Add and run the executable golden evaluation.
- [x] Add adversarial tests and update CI/documentation.
- [x] Publish the validated milestone.

## Assumptions and risks

- Hosted persistence is D1; tests use an in-memory adapter behind the identical repository contract.
- Demo identity is `demo.support.analyst` and is not authentication.
- Only `HVB-2847` is measured/executable now; all other scenarios and 30-case visualisations remain labelled previews.
- The mock provider is deterministic and free; external providers remain planned.
- No production read/write integration, bank deployment, or proprietary Murex artefact exists.
- D1 schema initialization is idempotent for the public demo; formal migration files remain the deployment record.
- The public demo is shared state. A production design would require authenticated tenant/user isolation and regulated retention controls.
