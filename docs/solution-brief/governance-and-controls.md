# Governance and Controls

> Start with the [visual solution overview](../solution-overview.md). This document is the canonical control register and production-gap assessment.

## Purpose and scope

This document describes the governance mechanisms implemented in Murex FDE Workbench and identifies the additional controls that a real enterprise deployment would require.

The current project is a fictional portfolio simulation. It has no production connectivity, uses a deterministic mock synthesis provider, and performs only controlled synthetic actions. It is not affiliated with or endorsed by Murex or any bank.

## Control objective

The primary control objective is to prevent an AI-generated recommendation from becoming an unsupported fact, an unauthorised action, or an unvalidated closure.

The implementation uses four distinct authorities:

1. **Deterministic tools establish facts.**
2. **The provider organises facts into a recommendation.**
3. **Policy and a human determine whether a named action may proceed.**
4. **Fresh deterministic evidence determines whether the incident may close.**

No single component owns all four decisions.

## Control map

| Risk | Implemented control | Evidence in repository | Production gap |
| --- | --- | --- | --- |
| Malformed or unsupported incident | Enumerated incident IDs and Zod schemas; server-owned payloads | Domain schemas and investigation API | Enterprise schema governance and source authentication |
| Incorrect arithmetic or timestamps | Deterministic tools compute facts | Unit tests for freshness, exposure, P&L, counts, deadlines | Reconciliation to authoritative production sources |
| Fabricated citation | Citations must resolve to current-run evidence or approved retrieval | Citation validator and adversarial tests | Enterprise document identity and cross-system lineage |
| Prompt injection through retrieval | Untrusted instruction-like documents are penalised and excluded from valid citation sources | Local retriever and security tests | Full content security, access filtering, corpus monitoring, and red teaming |
| Historical similarity treated as current proof | Scenario-specific validator prohibits the inference | `HVB-2822` and `HVB-2829` adversarial tests | Broader evidence taxonomy and reviewed rules |
| Unnecessary remediation | Validator and policy reject repair when P&L controls explain the movement | `HVB-2829` tests | Institution-specific business and technical action policy |
| Action before evidence is complete | Policy requires evidence completeness and can fail closed | Policy engine and critical scenario | Enterprise evidence SLAs and exception governance |
| Wrong approval scope | Policy declares permitted scope; state transition checks it | Approval integration tests | SSO, role mapping, delegation, and segregation of duties |
| Stale approval | Approval records recommendation version; execution rechecks it | Remediation negative-path test | Signed decision token or equivalent integrity control |
| Arbitrary action | Incident-specific action allow-list; no generic executor | Remediation workflow and API | Governed capability registry and privileged execution platform |
| Duplicate execution | Existing remediation check and unique approval record | Idempotency test | Distributed locking, concurrency control, and durable idempotency keys |
| False success | Five fresh controls and deterministic resolution policy | Happy-path and validation-failure tests | Authoritative production validation and business-owner sign-off |
| Incomplete audit | Sequenced audit events and persisted snapshots | D1 schema, repository, audit-integrity test | Tamper evidence, privileged access monitoring, retention, legal hold |
| Sensitive trace leakage | UI states that secrets and raw stack traces are excluded; safe API errors | Observability component and API handlers | Formal redaction, data-loss prevention, logging policy, and testing |

## Input and evidence governance

### Typed, server-owned inputs

The public API accepts an incident identifier rather than an arbitrary investigation payload. The registry maps that identifier to a checked-in synthetic object parsed by scenario-specific schemas.

This prevents the browser from defining its own facts in the demo. In an enterprise implementation, equivalent trust would require authenticated source connectors, record signatures or source identity, business timestamps, and data-quality controls.

### Evidence lineage

Each evidence record carries an ID, source, timestamp, signal, relevance, and producing tool. Tool runs contain derived facts and the evidence identifiers they created. A recommendation therefore cites a record that can be traced to a calculation or approved document.

### Evidence quality and uncertainty

The workflow distinguishes:

- a current observation;
- approved guidance;
- historical context;
- missing evidence;
- contradictory evidence;
- a hypothesis;
- a probable cause; and
- a ruled-out cause.

This prevents a timeout log or similar incident history from silently becoming a confirmed root cause.

## Retrieval governance

The local document corpus assigns each document:

- a stable ID;
- title and version;
- approval status;
- trust category;
- tags; and
- content.

The retriever boosts approved internal material, gives historical records a smaller trust boost, and strongly penalises known instruction-like patterns. Citation validation allows approved, non-untrusted retrieval results only.

The corpus includes malicious synthetic notes to test that instructions such as changing a rate or marking an incident resolved remain inert.

This mechanism demonstrates the desired boundary, but it is not a complete retrieval-security implementation. A production corpus would require permissions, document lifecycle, source integrity, revocation, classification, monitoring, and broader injection defenses.

## Provider governance

### Current provider

The default provider is deterministic and local. It creates structured recommendations from scenario context and requires no external model or API key.

This is useful for reproducibility, but it means the current evaluations do not measure a live model. Any external provider would need to implement the same `InvestigationSynthesiser` interface and remain subject to the same downstream validation and policy.

### Output contract

The recommendation schema requires explicit fields for outcome, evidence, action, escalation, uncertainty, and prohibited behavior. Recovery-capable recommendations also state risk, blast radius, preconditions, validation, rollback, and confidence rationale.

Provider exceptions or malformed output are converted into a safe validation failure. The provider cannot add an action capability or bypass policy through prose.

## Citation and factual controls

Citation validation is performed after synthesis and before policy. It checks that:

- output conforms to the runtime schema;
- each cause has cited evidence and factual claims;
- cited evidence or guidance is allowed;
- tool-produced evidence comes from a tool that executed;
- the recommendation does not contradict batch success;
- protected records are not proposed for direct modification; and
- scenario-specific conclusions and actions follow the deterministic controls.

These are application rules, not model instructions. A provider cannot mark its own citations valid.

## Policy and fail-closed behavior

The policy engine evaluates a list of named rules and records each result. Common rules cover citation validation, structured output, required evidence, protected-record mutation, and the absence of operational effect before approval.

`HVB-2822` illustrates fail-closed behavior. On the first pass, the incident is critical, the source manifest is missing, population is not established, mapping is inconclusive, and competing hypotheses remain. The system records `failed_closed` and permits only approval of the escalation disposition. It does not permit a confirmed cause or remediation.

Fail closed means the workflow retains a safe state and routes the case to accountable people; it does not mean the application hides the uncertainty or discards the investigation.

## Human approval

The approval record includes:

- investigation ID;
- decision and scope;
- fictional demo identity;
- timestamp;
- recommendation version;
- policy result;
- evidence identifiers; and
- optional comment.

The state-transition rules prevent approval before investigation completion, duplicate decisions, approval under the wrong scope, and confirmed-resolution approval of a failed-closed case.

The detailed sequence is shown in [Technical approval and governance flow](../diagrams/technical/approval-governance-flow.md).

### Current limitation

The literal identity `demo.support.analyst` is not authentication. A production implementation would require enterprise identity, strong session controls, least privilege, role and attribute policy, delegated authority, segregation of duties, access recertification, and privileged-action monitoring.

## Action governance

### Default deny

The workflow derives the one permitted action from the incident. An unknown action is rejected even if an approval exists. `HVB-2829` has no remediation capability.

### Revalidation at execution time

The action layer does not trust an earlier UI state. It reloads the run and rechecks citations, policy, evidence, approval, recommendation version, confidence, outcome, allow-list, and idempotency. This limits time-of-check/time-of-use drift within the demonstration.

### Synthetic boundary

The action implementation constructs a recorded simulation from checked-in fixtures. It cannot execute arbitrary commands, SQL, generated code, or external integrations. Audit metadata explicitly states `synthetic_only` and that no production system was contacted.

### Rollback

Recommendations and remediation records describe rollback, and the record states that rollback is available. The current simulator does not execute a separate rollback transition. A production capability would require tested executable rollback, ownership, rollback validation, and failure escalation.

## Resolution governance

The system separates action execution from incident resolution.

For `HVB-2847`, closure requires current USD/JPY data, a successful scoped APAC rerun, complete exposure population, passing reconciliation, and a safe distribution state. For `HVB-2822`, closure requires all source segments, full Datamart population, passing mapping, successful report render, and cleared SLA state.

If any control fails, the deterministic policy records the failed controls and produces `VALIDATION_FAILED`. The run becomes `requires_escalation`. The provider cannot change this outcome.

## Audit and observability

Audit events are sequenced and persisted. The D1 schema uses unique run-and-sequence constraints, and normal run saves do not overwrite existing events. The UI separates deterministic facts, bounded synthesis, trusted retrieval, workflow events, human gates, deterministic actions, and final outcomes.

The audit record is suitable for demonstrating lineage, but it is not a regulated audit service. A production design may require append-only infrastructure, cryptographic integrity, independent export, legal hold, retention controls, clock assurance, and administrator monitoring.

## Evaluation and change governance

Three golden cases run through the shared workflow and expose 17 scored fields each; five remediation-specific fields are non-applicable passes outside `HVB-2847`. Adversarial and integration tests exercise unsupported claims, unsafe actions, approvals, remediation gates, and validation failure.

For a production system, evaluation should be a release gate for changes to:

- model or model version;
- system instructions and schemas;
- retrieval corpus or ranking;
- deterministic tools;
- policy thresholds;
- source connectors;
- action capabilities; and
- post-action validation.

The enterprise corpus should be reviewed by domain, risk, security, and operational owners and should include dangerous counterexamples, not only common successful cases.

## Production control requirements not implemented here

Before real operational use, an organisation would need to address at least:

- authentication, authorisation, tenancy, and segregation of duties;
- source-system identity and data-quality assurance;
- secrets, encryption, private networking, and controlled egress;
- privacy, data minimisation, geographic processing, and retention;
- model and vendor risk management;
- prompt and retrieval security beyond pattern checks;
- rate limits, concurrency, durable idempotency, and transactional action control;
- production-grade action execution and tested rollback;
- tamper-evident audit and privileged-access monitoring;
- service levels, alerting, incident response, backup, and disaster recovery;
- real-model and organisation-specific evaluation; and
- formal legal, compliance, operational-risk, and change approval.

## Governance conclusion

The repository demonstrates a defensible allocation of authority. AI helps form an explanation, but every consequential boundary is owned elsewhere: deterministic evidence, independent validation, explicit policy, accountable approval, restricted capability, and deterministic closure.

That allocation—not the fictional scenario or demo infrastructure—is the central governance pattern intended for reuse.
