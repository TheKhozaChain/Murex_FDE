# Murex FDE Workbench — Implementation Plan

## Current architecture and milestone boundary

`HVB-2847` is an executable, persisted vertical slice with server-side orchestration, deterministic evidence, retrieval, provider-neutral synthesis, validation, fail-closed policy, D1 persistence, approvals, audits, traces, and one golden evaluation. `HVB-2829` and `HVB-2822` are promoted from previews in this milestone; `HVB-2841` and `HVB-2836` remain previews.

Milestone 3 generalises the same architecture for `HVB-2829` and `HVB-2822`. It must demonstrate three materially different outcomes without redesigning the application or implying that the planned 30-case corpus exists:

1. diagnose a genuine operational fault (`HVB-2847`);
2. explain a legitimate business movement with no remediation (`HVB-2829`);
3. fail closed under critical uncertainty (`HVB-2822`).

## Shared target architecture

1. **Scenario registry (`data/`, `src/investigation/`)** — maps a supported incident to Zod-validated input and scenario-specific deterministic tools. It contains data and execution adapters, not final recommendations.
2. **UI (`app/`)** — retains the current workbench and calls the same investigation, approval, trace, and evaluation routes for all three executable scenarios.
3. **Domain (`src/domain/`)** — discriminated typed inputs for market-data, P&L-explain, and critical-report incidents plus shared evidence, recommendation, policy, approval, audit, and evaluation types.
4. **Deterministic tools (`src/deterministic/`)** — shared typed tool-result contract with scenario-specific calculations behind one dispatcher.
5. **Retrieval (`src/retrieval/`)** — scenario-aware transparent ranking over versioned synthetic guidance; malicious and historical content remains untrusted context and never direct proof.
6. **Synthesis (`src/providers/`)** — one provider interface and one deterministic context-driven mock implementation for all supported scenarios.
7. **Validation and policy (`src/investigation/`, `src/policy/`)** — shared citation/fact validation, no-unnecessary-remediation rules, critical ambiguity rules, and disposition-aware approval transitions.
8. **Persistence (`src/persistence/`, `db/`)** — unchanged repository contract and D1 schema unless implementation proves a normalized field is missing; run snapshots already preserve scenario-specific typed data.
9. **Evaluation (`src/evaluation/`)** — three golden cases run through the production workflow with twelve measured dimensions and persisted results.

## Structured input design

The shared server-side investigation workflow remains validate, gather deterministic evidence, retrieve, synthesise, validate, apply policy, persist, request a human disposition, and append audit events.

### `HVB-2829` — legitimate commodities P&L movement

Prior/current crude prices, reported P&L, desk sensitivity, carry and new-trade contributions, expected/actual trade counts, valuation timestamps, FX conversion controls, report threshold/materiality, batch/dependency state, residual tolerance, and freshness boundary. Deterministic tools derive the market move, explained P&L, residual, control status, and evidence completeness.

### `HVB-2822` — conflicting critical timeout diagnosis

Criticality, regulatory deadline and sign-off window, batch state, current source-reader timeout, expected/received source segments, manifest presence, mapping validation status, historical incidents, required evidence, escalation routes, and minimum confidence. Deterministic tools derive deadline risk, incomplete population, missing evidence, competing hypotheses, and fail-closed disposition. Historical similarity is explicitly classified as context rather than current proof.

## Policy changes

- Reject repair, rerun, or technical-escalation recommendations when P&L is fully explained and every deterministic control passes.
- Require Product Control review and human approval before publishing stakeholder commentary for a legitimate material movement.
- Fail closed for a Critical report when required evidence is missing, current hypotheses compete, population is unknown, or confidence is below threshold.
- For a failed-closed critical case, permit approval only of the escalation disposition; prohibit approval as a confirmed resolution.
- Continue rejecting unknown citations, unsupported mutations, deterministic contradictions, historical-as-proof claims, and malformed output.

## Evaluation expectations

The default evaluation command executes `GOLDEN-HVB-2847-v1`, `GOLDEN-HVB-2829-v1`, and `GOLDEN-HVB-2822-v1`; case selection remains available by incident ID. Each case measures deterministic correctness, outcome classification, root-cause correctness, grounding, citations, action, prohibited-action compliance, escalation, uncertainty, fail-closed behavior, summary completeness, and overall pass/fail.

## Database expectation

No destructive migration is planned. Existing incident, run, tool, evidence, retrieval, recommendation, policy, approval, audit, evaluation-case, and evaluation-result tables are scenario-neutral. New incident and evaluation rows will be seeded through the existing repository interface. Any schema change must be additive, migrated, and justified by an actual query or integrity requirement.

## Files expected to change

- `data/incidents/`, `data/evaluation/`, `data/runbooks/`, `data/scenarios.ts`
- `src/domain/`, `src/deterministic/`, `src/investigation/`, `src/providers/`, `src/retrieval/`, `src/policy/`, `src/evaluation/`
- persistence implementations only where generalized incident/evaluation typing requires it
- investigation, approval, evaluation APIs and executable UI components
- unit, integration, security, rendered-site tests and CI
- `README.md`, `PLAN.md`, `CHANGELOG.md`, and the requested `docs/` material

## Milestone checklist

- [x] Generalise the domain and workflow through a shared scenario registry.
- [x] Add structured synthetic inputs for `HVB-2829` and `HVB-2822` without embedded conclusions.
- [x] Implement and test eight deterministic checks for each new scenario.
- [x] Extend retrieval while keeping malicious instructions inert and history contextual.
- [x] Extend one context-driven mock provider to all three scenarios.
- [x] Add scenario-specific fact, citation, policy, and approval protections.
- [x] Persist, reload, trace, approve/reject, and audit both new scenarios.
- [x] Make three scenarios executable in the existing UI and retain two labelled previews.
- [x] Expand the golden evaluation corpus and dashboard to three measured cases.
- [x] Retain existing tests and add requested unit, integration, security, and UI coverage.
- [x] Update CI and documentation without overstating the 30-case roadmap.
- [x] Push and publish the fully verified milestone.

## Risks and assumptions

- Scenario selection must choose input and tool adapters, never a prewritten final answer keyed only by incident ID.
- Historical documents may rank highly but cannot satisfy direct-current-evidence requirements.
- Approval semantics must distinguish accepting an escalation disposition from confirming a root cause or resolution.
- Synthetic values will be transparent, arithmetically reproducible, and free of proprietary Murex or bank information.
- Hosted persistence remains shared D1 demo state; production authentication, tenant isolation, external providers, integrations, and the 30-case corpus remain planned.
- `demo.support.analyst` remains a clearly labelled demo identity, not authentication.
