# Enterprise Deployment Vision

> Start with the [visual solution overview](../solution-overview.md). This document is the canonical illustrative adoption and target-design reference.

## Status of this document

This document describes how the control pattern demonstrated by Murex FDE Workbench could be adapted inside an organisation. It is a future deployment vision, not a description of the current public demo.

The repository currently uses fictional data, a deterministic mock synthesis provider, a labelled demo identity, a shared demonstration database, and controlled simulated actions. It has no production connectivity and no official affiliation with Murex or any bank.

## What this could look like at your organisation

An organisation could use the same basic pattern for its own support investigations: collect operational facts with conventional software, retrieve approved internal guidance, use AI to organise the evidence into a cited recommendation, apply local policy, require an accountable human decision, and validate any approved action independently.

What stays constant is the control structure. What changes is the institution's data, systems, ownership, policies, and permitted actions.

| Pattern that should remain constant | Organisation-specific implementation |
| --- | --- |
| Explicit investigation states | Incident taxonomy, severity model, queues, and service-management integration |
| Deterministic fact collection | Batch schedulers, data-quality controls, reporting platforms, observability tools, and source-system APIs |
| Evidence identity and provenance | Record identifiers, data classifications, source ownership, timestamps, and lineage standards |
| Attributable retrieval | Approved runbooks, known-error records, change history, control procedures, and document permissions |
| Structured AI output | Institution-specific diagnosis, risk, action, escalation, and communication schemas |
| Independent validation | Local factual rules, prohibited claims, materiality, evidence thresholds, and model-risk controls |
| Policy before action | Severity rules, confidence thresholds, segregation of duties, risk acceptance, and approval scope |
| Human accountability | Named roles, delegations, on-call ownership, control-owner sign-off, and exception handling |
| Minimal action capabilities | Approved recovery procedures, environment restrictions, change tickets, rollback, and execution identities |
| Post-action evidence | Control reruns, reconciliation, business validation, report release, and incident closure criteria |
| Persistent audit and evaluation | Retention, legal hold, export, monitoring, assurance review, and model-performance reporting |

## Target operating concept

A production implementation would sit alongside existing incident, observability, control, and reporting systems. It would not replace the authoritative sources or bypass established ownership.

The workbench would assemble a case file containing:

- incident metadata and business impact;
- current system and control evidence;
- retrieved procedures and relevant context;
- separated facts, hypotheses, and unknowns;
- a cited recommendation with confidence rationale;
- the proposed decision owner and escalation path;
- action scope, risk, rollback, and validation; and
- a complete record of decisions and outcomes.

The case file would move through a policy-controlled state machine. The AI component would have no implicit authority. Every external read or action would be mediated by an owned connector or capability with a documented contract.

## Recommended adoption phases

### Phase 0: operating-model discovery

Before deploying AI, document how investigations currently work:

- which teams own evidence and decisions;
- which systems are authoritative;
- where analysts rely on informal knowledge;
- which actions are reversible;
- where approvals or control evidence are missing; and
- which outcomes would be unsafe to automate.

This phase often reveals process ambiguity that should be resolved before automation.

### Phase 1: read-only evidence assembly

Connect only to approved read sources. Build a case view that brings together batch status, data-quality controls, reconciliations, changes, and runbooks. Use deterministic calculations for counts, timestamps, thresholds, and comparisons.

The output should improve analyst visibility without producing a model recommendation or taking action. Establish source ownership, access control, data minimisation, retention, and evidence lineage at this stage.

### Phase 2: shadow recommendations

Introduce a model behind a structured provider contract. Run it in shadow mode: the model prepares a diagnosis and recommendation, but analysts continue the existing process and do not see or depend on the output until the organisation has enough evaluation evidence.

Compare model output with reviewed analyst decisions. Measure factual accuracy, citation validity, uncertainty, safe escalation, and the rate of unnecessary action—not only whether the top diagnosis matches.

### Phase 3: human-reviewed assistance

Expose cited recommendations to authorised users. Keep the system read-only. Require the user to approve, reject, correct, or request more evidence. Capture reasons for disagreement so evaluation and operating guidance can improve.

At this stage, approval should authorise a business disposition or communication, not a production action.

### Phase 4: narrowly scoped action capability

Add one low-blast-radius, reversible action only after the organisation has:

- a named owner;
- an authoritative procedure;
- clear preconditions;
- a change and approval model;
- an execution identity;
- idempotency and concurrency protection;
- tested rollback;
- independent post-action validation; and
- incident response for action failure.

The action should be represented as a typed capability, not an open prompt or general command runner.

### Phase 5: scaled production operation

Expand only when individual capabilities have evidence of safety and value. Add production SLOs, capacity planning, model and retrieval monitoring, audit review, periodic access recertification, disaster recovery, retention, vendor management, privacy review, and operational ownership.

## Integration boundaries

### Evidence connectors

Potential connectors could include incident management, batch scheduling, application observability, data-quality platforms, reference or market-data controls, reporting repositories, and change management. Each connector should return a typed record with source identity, retrieval time, business time, authority, and data classification.

Read access should be scoped to the case and user. The model should not receive raw secrets, unrelated client data, or unrestricted query access.

### Knowledge retrieval

An enterprise retrieval service would need more than semantic similarity. It should enforce:

- document-level permissions;
- approved versus draft status;
- current version and effective date;
- owning team and review date;
- data classification;
- provenance and stable citation identifiers;
- retention and deletion policy; and
- defenses against instruction-like content in retrieved text.

### Model provider

The provider adapter should receive only the minimum structured context required for the task. The organisation would choose hosting and routing based on data classification, contractual terms, geographic requirements, model risk, latency, and availability.

Structured output, timeout, retry, token, and cost limits should sit outside the prompt. Provider failures should produce a safe workflow state rather than an unstructured error or partial action.

### Action capabilities

An action catalogue should record, for every capability:

- unique action ID and version;
- system and environment;
- business and technical owner;
- permitted actor roles;
- required approval type;
- required evidence and preconditions;
- maximum scope and blast radius;
- execution identity;
- idempotency key;
- timeout and retry behavior;
- rollback procedure;
- post-action evidence; and
- closure criteria.

The catalogue should default to deny. A model-proposed string should never create a new capability.

## Identity and decision ownership

The public demo's literal analyst identity would need to be replaced by enterprise identity and authorisation. A production design should distinguish:

- the person viewing the case;
- the person approving a recommendation;
- the service authorising an action;
- the service identity executing it;
- the business owner validating the outcome; and
- administrators managing policy or connectors.

Segregation of duties may require the investigator, approver, action owner, and validator to be different people or roles. Delegation, emergency access, and override should be explicit, time-limited, and audited.

## Data and security model

A deployment assessment should classify every input and output. Controls may include:

- regional processing and storage constraints;
- encryption in transit and at rest;
- private networking and controlled egress;
- secrets management outside prompts and logs;
- field-level minimisation or tokenisation;
- environment and tenant isolation;
- retention and deletion schedules;
- privileged-access monitoring;
- secure export for audit or incident review; and
- vendor and subprocessor review.

Prompt injection is only one threat. The organisation must also consider poisoned evidence, stale documents, excessive connector access, model-provider outage, replayed approvals, action races, incomplete audit, insider misuse, and incorrect success criteria.

## Evaluation before and after deployment

The repository's three synthetic golden cases illustrate the structure of an evaluation, not an enterprise benchmark. An organisation-specific corpus should include:

- representative resolved and unresolved incidents;
- legitimate anomalies where no technical repair is required;
- incomplete and contradictory cases;
- multiple severities and business deadlines;
- retrieval distractors and stale guidance;
- prohibited-action attempts;
- provider outages and malformed output;
- approval, replay, and duplicate-action failures; and
- post-action validation failures.

Evaluation should measure more than diagnosis accuracy. Useful measures include citation validity, unsupported-claim rate, uncertainty calibration, safe escalation, unnecessary-action rate, evidence completeness, reviewer disagreement, time to an evidence-complete case, action success, validation success, and rollback quality.

Production monitoring should detect changes in case mix, retrieval quality, model behavior, approval patterns, overrides, failure rates, latency, and cost. Material model, policy, corpus, connector, or action changes should trigger regression evaluation.

## Deployment decision gates

Before moving from one phase to the next, an accountable group should be able to answer:

1. Are the source systems and control owners identified?
2. Can each important claim be traced to current evidence?
3. Does uncertainty stop the workflow safely?
4. Are user and service permissions least-privileged?
5. Can approval be tied to an exact recommendation and evidence snapshot?
6. Is each action predefined, bounded, reversible, and idempotent?
7. Does independent evidence determine success?
8. Are audit, retention, monitoring, and incident response adequate?
9. Does the evaluation corpus represent both common and dangerous cases?
10. Is there evidence of operational benefit without unacceptable risk?

## What should not be copied directly

Several demo choices are intentionally unsuitable for production:

- the shared public database;
- the fictional fixed analyst identity;
- local keyword-ranked retrieval;
- the deterministic mock provider as a substitute for real-model evaluation;
- embedded synthetic action fixtures;
- application-level audit without tamper-evident storage;
- public zero-credential execution; and
- illustrative time-saving assumptions.

The reusable asset is the controlled architecture and its explicit boundaries, not the demo infrastructure.
