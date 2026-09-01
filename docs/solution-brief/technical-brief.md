# Murex FDE Workbench: Technical Brief

> Start with the [visual solution overview](../solution-overview.md). This document is the implementation-level reference.

## 1. Document purpose and status

This brief describes the architecture and implemented behavior of Murex FDE Workbench. The intended audience is a technically literate hiring manager, product owner, engineer, security reviewer, or enterprise architect evaluating the repository as a portfolio reference implementation.

Three labels are used throughout:

- **Implemented** means behavior exists in the current repository and is exercised by code or tests.
- **Design choice** means an intentional architectural boundary visible in the implementation.
- **Enterprise vision** means a possible production adaptation that is not present in the current build.

The workbench is a portfolio simulation using fictional data and controlled synthetic actions. It is not a production banking deployment and is not affiliated with or endorsed by Murex or any financial institution.

## 2. System objective

The workbench demonstrates an AI-assisted investigation pattern for capital-markets reporting exceptions. The target problem has several characteristics:

- evidence is distributed across structured controls and unstructured guidance;
- some signals are direct facts while others are only contextual;
- business materiality does not necessarily indicate a technical defect;
- incomplete evidence may require escalation rather than diagnosis;
- consequential actions require accountable approval; and
- action completion does not prove that the business outcome was restored.

The system therefore does not model investigation as a chat conversation. It models it as an explicit stateful workflow with typed inputs, deterministic evidence collection, attributable retrieval, bounded synthesis, independent validation, policy, approval, constrained action, post-action evidence, and auditable resolution.

The complete component view is in [Technical system architecture](../diagrams/technical/system-architecture.md).

## 3. Architectural principles

### 3.1 Deterministic facts before probabilistic interpretation

**Design choice:** arithmetic, timestamps, counts, population checks, materiality thresholds, batch state, evidence completeness, and final resolution are implemented as conventional TypeScript functions. The provider receives those outputs; it does not recreate them from prose.

This reduces the number of claims that depend on model behavior and makes the synthetic cases reproducible.

### 3.2 Retrieval is evidence, not instruction

**Implemented:** local documents retain approval and trust metadata. Instruction-like untrusted content is penalised during ranking and cannot be used as an approved citation. Historical incidents may inform a hypothesis but cannot establish a current cause.

### 3.3 The provider proposes; policy and people authorise

**Implemented:** a valid recommendation has no operational effect. It must pass schema, citation, factual, and policy checks. A human decision is stored against a specific recommendation version and evidence snapshot.

### 3.4 Action capability is explicit and narrow

**Implemented:** only two incident-specific synthetic action identifiers exist. The remediation endpoint cannot run arbitrary code, SQL, shell commands, or model-selected HTTP requests.

### 3.5 Validation owns closure

**Implemented:** a deterministic resolution policy uses fresh post-action evidence to produce `RESOLVED` or `VALIDATION_FAILED`. The provider does not set the final state.

### 3.6 Uncertainty is represented in state

**Implemented:** recommendations have explicit missing evidence, contradictory evidence, confidence, and uncertainty fields. Policy can move the run to `failed_closed`; a critical failed-closed case permits only an escalation disposition, not confirmed resolution.

## 4. Technology and runtime

The current application uses:

- TypeScript 5.9;
- React 19 and Next-compatible application conventions;
- Vinext and Vite for the Cloudflare-oriented build;
- Zod for runtime schemas;
- Cloudflare Workers runtime bindings;
- Cloudflare D1 / SQLite-style storage;
- Drizzle schema definitions and migrations;
- Node's test runner through `tsx`; and
- ESLint and TypeScript compiler checks.

The package requires Node.js 22.13 or later. The default synthesis implementation is local and deterministic; no API key is required.

## 5. Component responsibilities

| Component | Primary files | Responsibility |
| --- | --- | --- |
| Domain schemas | `src/domain/models.ts` | Defines executable incident inputs, evidence, tool runs, recommendations, policy, approval, remediation, audit, and evaluation records |
| Scenario registry | `src/investigation/scenario-registry.ts` | Maps one of three accepted incident IDs to typed, server-owned synthetic inputs |
| Scenario inputs | `data/incidents/*.ts` | Stores structured facts and policies for each executable case |
| Deterministic tools | `src/deterministic/tools.ts` | Validates inputs and computes scenario facts such as freshness, exposure, residual, population, contradictions, and deadlines |
| Retrieval | `src/retrieval/local-retriever.ts`, `data/runbooks/documents.ts` | Ranks a local corpus and preserves provenance, trust, approval, and relevance metadata |
| Provider contract | `src/providers/synthesiser.ts` | Defines the interface for producing a structured recommendation from investigation context |
| Default provider | `src/providers/mock-synthesiser.ts` | Produces deterministic, scenario-aware structured recommendations for repeatable demonstration and testing |
| Recommendation validation | `src/investigation/citation-validator.ts` | Enforces runtime schema, valid citations, executed-tool provenance, and scenario-specific factual/action constraints |
| Policy | `src/policy/policy-engine.ts` | Applies evidence, confidence, severity, mutation, approval-scope, and fail-closed rules |
| Orchestrator | `src/investigation/workflow.ts` | Coordinates investigation, evidence expansion, approval, remediation, validation, persistence, audit, and state transitions |
| Persistence contract | `src/persistence/repository.ts` | Decouples workflow behavior from storage |
| Persistence implementations | `src/persistence/memory-repository.ts`, `src/persistence/d1-repository.ts` | Supports isolated tests and persisted demo runs |
| Runtime repository | `src/persistence/runtime-repository.ts` | Binds the application runtime to Cloudflare D1 |
| APIs | `app/api/*/route.ts` | Exposes investigation, approval, remediation, and evaluation operations with input validation and safe errors |
| User experience | `app/components/Executable*.tsx`, `app/page.tsx` | Presents evidence, diagnosis, approval, remediation, validation, audit, evaluations, and traces |
| Evaluation | `src/evaluation/runner.ts`, `data/evaluation/*.ts` | Runs three golden cases through the shared workflow and exposes 17 scored fields per case; five remediation fields are non-applicable outside `HVB-2847` |
| Tests | `tests/unit`, `tests/integration`, `tests/security` | Exercises calculations, state transitions, adversarial provider behavior, recovery controls, build, and rendered output |

## 6. Domain model

### 6.1 Executable incident inputs

`incidentInputSchema` is a discriminated union keyed by incident ID. Each scenario contains common fields—title, report, area, severity, business date, owner, description, and batch—and scenario-specific data.

`HVB-2847` includes market-data observations, position exposures, reconciliation data, a recovery fixture, and freshness/materiality policy. `HVB-2829` includes market prices, sensitivity, carry, new trades, reported P&L, population, valuation, conversion controls, and thresholds. `HVB-2822` includes deadline data, segment state, mapping state, history, supplemental evidence, escalation routes, and a critical-evidence policy.

**Security property:** the investigation API accepts only the three enumerated IDs. The detailed payload comes from the server-side registry rather than an arbitrary client request.

### 6.2 Evidence and tools

An evidence record includes:

- a stable identifier;
- evidence kind;
- title and detail;
- source;
- whether it supports, contradicts, or contextualises a claim;
- producing tool, where applicable;
- observation time; and
- a statement of relevance.

A tool execution records status, derived facts, evidence IDs, warnings, timestamps, duration, and any safe error. Evidence is therefore linked to the deterministic calculation that produced it.

### 6.3 Recommendations

Recommendations are versioned structured records. They include outcome, candidate causes, cited factual claims, confidence, uncertainty, contradictions, missing evidence, action, action citations, escalation, prohibited actions, and two summaries. The richer recovery cases also include diagnosis, observed facts, risk, blast radius, preconditions, validation plan, rollback, and confidence rationale.

The schema supports a separation among observed facts, hypotheses, probable cause, and ruled-out causes. This is important in `HVB-2822`, where a timeout is observed but does not initially prove why the report is incomplete.

### 6.4 Policy, approval, remediation, and audit

A policy decision stores every rule and its result, prohibited actions, permitted approval scope, and an explicit operational effect of `none` before approval.

An approval stores decision, scope, fictional identity, timestamp, recommendation version, policy result, evidence IDs, and an optional comment.

A remediation record stores the action ID, approving and executing actors, trace linkage, timestamps, preconditions, ordered simulated steps, validation results, rollback availability, and deterministic resolution.

Audit events are sequenced records with event type, summary, time, and metadata. They cover investigation, tools, retrieval, synthesis, citation validation, policy, recommendation, evidence expansion, approval, action gates, execution, post-action evidence, validation, closure, and escalation.

## 7. Investigation workflow

The implementation state path is shown in [Technical high-level workflow](../diagrams/technical/high-level-workflow.md).

### 7.1 Start and persistence

`runInvestigation` resolves the scenario from the registry, initialises the repository, seeds the incident, creates a run in `running` state, and persists an `investigation.started` event.

### 7.2 Deterministic evidence collection

The shared dispatcher selects the appropriate tool set by discriminated incident type. It returns a list of tool executions; the workflow flattens their evidence records and appends a `tools.completed` event.

The dispatcher is shared, but the facts are scenario-specific:

| Scenario | Principal deterministic checks |
| --- | --- |
| `HVB-2847` | payload validation, market-data freshness, exposure, reconciliation, materiality, batch dependencies, evidence completeness |
| `HVB-2829` | market movement, sensitivity contribution, P&L residual, trade population, valuation timestamp, currency conversion, materiality, batch dependencies, evidence completeness |
| `HVB-2822` | manifest, segments, timeout, mapping, regulatory deadline, severity, evidence contradiction, batch dependencies, evidence completeness |

### 7.3 Retrieval

The retriever uses a scenario-specific query against the local document corpus. It tokenises text, counts query and tag matches, adds a trust boost, subtracts a strong penalty for instruction-like content, and returns the top relevant documents.

This is intentionally simple. It demonstrates provenance and trust handling rather than production semantic search. An enterprise implementation might use a governed search or vector service, but it would still need document ownership, approval status, access filtering, versioning, and citation identity.

### 7.4 Synthesis

The workflow constructs `InvestigationContext` from the incident, tool runs, evidence, and retrieval results. It calls the provider interface and catches provider failure by passing malformed output into validation, which causes a safe failure.

The default provider constructs recommendations deterministically from the context. This makes the application runnable and the evaluation stable without implying that a live model has been integrated or benchmarked.

### 7.5 Citation and fact validation

`validateRecommendation` first applies the Zod recommendation schema. It then builds an allow-set from current-run evidence and approved, non-untrusted retrieved documents.

It rejects:

- unknown or untrusted citations;
- candidates without evidence or factual claims;
- evidence attributed to a tool that did not execute;
- claims that contradict deterministic batch success;
- direct modification of protected records;
- technical remediation for a fully explained P&L movement;
- misuse of historical incidents as current proof;
- confirmation of unsupported timeout or mapping causes;
- premature reruns before required evidence; and
- an incomplete evidence basis for the confirmed liquidity diagnosis.

The validation result is independent of the provider and is persisted with the recommendation.

### 7.6 Policy

`applySafetyPolicy` checks common rules for citation validity, structured output, required evidence, protected-record mutation, and no operational effect before approval.

Scenario policy then adds relevant constraints:

- `HVB-2847` requires the confidence threshold and prevents critical auto-resolution;
- `HVB-2829` requires a legitimate-movement classification and prohibits unnecessary remediation when all controls pass; and
- `HVB-2822` fails closed under critical ambiguity, then applies a higher evidence threshold and scoped-recovery rule after supplemental evidence is gathered.

The result is either `approval_required` or `fail_closed`. A failed-closed critical recommendation permits only `escalation_disposition` approval; it cannot be approved as a confirmed resolution.

### 7.7 Recommendation presentation

The workflow persists `synthesis.completed`, `citation.validated`, `policy.decided`, and `recommendation.presented`. The run becomes `completed` only if policy passes; otherwise it becomes `failed_closed`.

The interface exposes evidence, diagnosis, recommendation, approval, remediation, validation, and audit views. The observability view labels deterministic facts, bounded synthesis, trusted retrieval, human gates, deterministic actions, and final outcomes separately.

## 8. Progressive evidence expansion

`HVB-2822` demonstrates that a failed-closed result can be a safe intermediate state rather than a dead end.

`requestMoreInvestigation` is allowed only for the initial `HVB-2822` run before an approval or previous evidence expansion. It gathers synthetic manifest, transfer, mapping, configuration, and volume evidence; reconstructs the investigation context; reruns synthesis; reruns citation validation; and reruns policy.

The transition is explicitly audited. The updated recommendation is version 2 and can become approvable only when current evidence supports upstream interface non-delivery above the configured confidence threshold.

This is an example of evidence-driven workflow progression, not conversational retry. The source packet changes, so the recommendation and policy are recomputed.

## 9. Approval model

The approval state flow is documented in [Technical approval and governance flow](../diagrams/technical/approval-governance-flow.md).

`decideApproval` requires an existing recommendation and policy decision. `canApprove` checks:

- the investigation is in a decision-ready state;
- an approval decision does not already exist;
- the requested scope matches the policy-permitted scope; and
- a failed-closed recommendation is not being approved as confirmed resolution.

Rejection is always permitted once the run is decision-ready. A successful decision records the evidence identifiers and recommendation version. Persistence enforces one approval per investigation.

**Current limitation:** the identity is the literal fictional user `demo.support.analyst`. This demonstrates record shape and state transitions, not authentication or authorisation.

## 10. Controlled remediation

### 10.1 Capability model

The remediation API requires a UUID run ID, a named action ID, and explicit confirmation that the action is synthetic. The workflow derives the sole allowed action from the incident:

- `HVB-2847`: `refresh_fx_market_data_and_rerun_risk_controls`;
- `HVB-2822`: `reingest_liquidity_segment_and_resume_datamart`; and
- `HVB-2829`: no remediation action.

No generic tool execution interface is exposed.

### 10.2 Precondition checks

Immediately before execution, the workflow checks that:

- no remediation already exists;
- the requested action matches the incident allow-list;
- the run is completed and required records exist;
- citations and policy still pass;
- required evidence is complete;
- an approved recommendation exists with the correct scope;
- approval matches the current recommendation version;
- confidence meets the action threshold; and
- the recommendation outcome supports the incident action.

For `HVB-2847`, the persisted precondition list also records source confirmation and the distribution hold. For `HVB-2822`, the current implementation relies on the shared evidence-completeness, policy, approval, outcome, and allow-list gates; manifest and duplicate checks are described in the recommendation and recorded as part of the simulated execution rather than modelled as separate persisted precondition flags.

Rejected attempts append `remediation.precondition_rejected` before returning an error.

### 10.3 Synthetic execution

The simulator records ordered steps rather than contacting an external system. For `HVB-2847`, it simulates source confirmation, an isolated USD/JPY refresh, a scoped APAC market-data and risk run, and collection of validation evidence. For `HVB-2822`, it simulates validation and re-ingestion of one missing segment, resume from a named recovery point, and downstream checks.

The execution record includes incident, action, actors, recommendation version, trace, timestamps, preconditions, steps, validation, rollback, and resolution.

### 10.4 Post-action validation

Each action creates five fresh evidence records. The deterministic resolution policy gathers failed controls and permits closure only when the list is empty.

On success, the run becomes `resolved`, the result is `RESOLVED`, and `incident.closed` is recorded. On validation failure, the run becomes `requires_escalation`, the result is `VALIDATION_FAILED`, report or workflow holds remain active in the simulated result, and `incident.escalated` is recorded.

The negative-path tests can deliberately produce validation failure to verify this behavior.

## 11. Persistence and auditability

The workflow depends on `InvestigationRepository`, which has in-memory and D1 implementations. This keeps workflow tests isolated while exercising the same persistence contract.

D1 stores:

- incidents;
- investigation run snapshots;
- tool executions;
- evidence records;
- retrieved documents;
- recommendations and citation validation;
- policy decisions;
- approval decisions;
- audit events;
- evaluation cases; and
- evaluation results.

Unique indexes prevent duplicate evidence identifiers within a run, duplicate retrieved documents within a run, multiple approvals for one run, and duplicate audit sequence numbers. The repository uses insert-or-ignore for existing audit events so normal snapshot saves do not rewrite earlier events.

**Current limitation:** the application demonstrates logical audit integrity in code and schema. It does not implement cryptographic immutability, write-once storage, enterprise archival, legal hold, or a privileged-administrator threat model.

## 12. API surface

| Endpoint | Method | Implemented behavior |
| --- | --- | --- |
| `/api/investigations` | `POST` | Accepts one of three incident IDs and starts the controlled workflow |
| `/api/investigations` | `GET` | Returns the latest persisted run for an executable incident |
| `/api/approvals` | `POST` | Approves, rejects, or requests more investigation within policy constraints |
| `/api/remediations` | `POST` | Executes one named, confirmed synthetic action after all gates pass |
| `/api/evaluations` | `POST` | Runs one or all golden evaluations through the shared workflow |
| `/api/evaluations` | `GET` | Returns the latest persisted evaluation result for each golden case |

Request bodies are parsed with Zod. Error responses expose a small set of safe transition messages rather than raw internal errors.

**Current limitation:** the endpoints do not implement production authentication, rate limiting, tenancy, entitlements, CSRF controls, service-to-service identity, or an enterprise API gateway policy.

## 13. Evaluation design

The evaluation runner does not compare static example text. It invokes the same workflow used by the UI and persists the resulting run ID.

The implemented golden corpus contains three cases. Each case produces 17 binary scores:

1. deterministic tool correctness;
2. outcome classification correctness;
3. root-cause correctness;
4. evidence-grounding correctness;
5. citation validity;
6. recommended-action correctness;
7. prohibited-action compliance;
8. escalation correctness;
9. uncertainty correctness;
10. fail-closed correctness;
11. summary completeness;
12. safety-policy correctness;
13. remediation allow-list correctness;
14. remediation precondition correctness;
15. post-action evidence correctness;
16. deterministic resolution correctness; and
17. remediation audit completeness.

The remediation-specific checks apply substantively to the `HVB-2847` golden path; non-applicable cases receive a passing score by design. A case passes only when all 17 scores equal 1. The suite passes only when all three cases pass.

The 30-case corpus referenced in the UI and roadmap is not implemented. Provider comparison, real-model evaluation, latency, cost, analyst acceptance, and production-quality measures remain future work.

## 14. Test strategy

The current `npm test` command runs 48 TypeScript tests, builds the application, starts the rendered application for smoke checks, and runs two rendered-output tests.

### Unit tests

Unit tests verify scenario calculations and policy behavior, including stale timestamps, exposure, materiality, P&L residual, population, valuation, currency conversion, missing manifests, contradictory evidence, retrieval ranking, and state-transition rules.

### Integration tests

Integration tests verify complete persistence, approval and rejection, duplicate approval, the three scenario outcomes, progressive evidence expansion, both recovery paths, and deterministic closure.

### Security and adversarial tests

Adversarial providers attempt fabricated citations, malformed output, direct record modification, unnecessary remediation, false confirmation of timeout or mapping defects, historical evidence misuse, and premature rerun. The tests assert that the workflow fails closed or records the correct safe outcome.

### Remediation negative paths

The `HVB-2847` suite verifies missing approval, stale approval after recommendation supersession, disallowed action, duplicate execution, validation failure, and invalid citation or policy state.

### What the tests do not prove

The suite does not prove behavior under real model nondeterminism, real enterprise data, malicious authenticated insiders, production network failures, high concurrency, disaster recovery, regulated retention, or operational scale.

## 15. Current deployment model

The public demonstration is designed for zero-credential access. It uses a shared Cloudflare D1 resource, a fictional demo identity, synthetic scenarios, and the deterministic mock provider. Local development uses Vinext/Vite and a local D1 binding.

This is appropriate for an inspectable portfolio demonstration because a reviewer can execute the complete state machine without sharing an API key or production access.

It is not an enterprise deployment topology. Shared demo state, absent identity controls, and public synthetic actions would not be acceptable for real operational data.

## 16. Enterprise adaptation vision

An enterprise implementation would retain the control pattern while replacing every demo adapter with institution-owned evidence, identity, retrieval, policy, action and operational services. The canonical phased design, organisation-specific decisions and deployment gates are documented in [Enterprise deployment vision](enterprise-deployment-vision.md).

## 17. Known limitations and extension points

| Area | Current implementation | Credible next step |
| --- | --- | --- |
| Synthesis | Deterministic local mock | Add one provider adapter behind the existing interface and evaluate it against an expanded corpus |
| Retrieval | Closed keyword-ranked local corpus | Add access-controlled enterprise search with document lifecycle and version ownership |
| Identity | Literal demo analyst identity | Integrate SSO, service identity, RBAC/ABAC, and segregation of duties |
| Actions | Two synthetic incident-specific simulations | Define a governed capability registry with environment, owner, approval, rollback, and validation contracts |
| Storage | Shared D1 demo store | Add tenant isolation, encryption policy, backup, retention, archival, and evidence export |
| Audit | Append-oriented application records | Add tamper-evident storage, privileged access monitoring, and regulated retention where required |
| Evaluation | Three golden cases | Expand reviewed cases, failure fixtures, model comparisons, calibration, latency, cost, and human-quality measures |
| Operations | Demo UI and safe errors | Add SLOs, tracing export, alerting, runbooks, incident recovery, and capacity tests |
| Security | Application-level adversarial checks | Perform threat modelling, dependency scanning, penetration testing, privacy review, and model red teaming |

## 18. Repository navigation

Recommended entry points for a reviewer:

1. `docs/solution-overview.md` for the visual product and enterprise story;
2. `docs/solution-brief/scenario-walkthrough.md` for behavior by scenario;
3. `src/investigation/workflow.ts` for orchestration and state transitions;
4. `src/deterministic/tools.ts` for fact collection;
5. `src/investigation/citation-validator.ts` and `src/policy/policy-engine.ts` for controls;
6. `src/evaluation/runner.ts` for measured assertions; and
7. `tests/` for positive, negative, and adversarial evidence.

## 19. Conclusion

Murex FDE Workbench is best understood as a production-shaped control demonstration rather than a production product. Its central contribution is the separation of responsibilities:

- deterministic tools establish facts;
- retrieval provides attributable context;
- a bounded provider prepares a recommendation;
- validators and policy constrain that recommendation;
- a human owns the consequential decision;
- a minimal simulator performs only an approved synthetic capability; and
- fresh deterministic evidence owns closure.

That separation is the reusable design pattern the repository is intended to communicate.
