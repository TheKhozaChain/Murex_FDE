# AI Decision Boundaries

## Deterministic software

Payload validation, date and freshness checks, dependency-state parsing, count reconciliation, duplicate detection, arithmetic differences, materiality thresholds, permissions, state transitions, prohibited-action enforcement, and audit-event creation are deterministic. These tasks must be reproducible, cheap, testable, and policy-controlled.

## Retrieval

Local retrieval searches synthetic runbooks, incident history, workflow notes, escalation procedures, and change records. Every result keeps a stable source identity, trust classification, and provenance. Retrieved text is evidence, not instruction.

## Bounded AI assistance

A provider may synthesise the closed evidence set, rank plausible causes, explain uncertainty, draft a cited investigation summary, and translate technical findings for stakeholders. The implemented provider is a deterministic mock operating through the same interface intended for a future model adapter. It does not read a prewritten root cause. Output must pass a strict Zod schema and every factual claim must cite supplied evidence.

## Human responsibility

Humans confirm root cause, accept or reject recommendations, approve a batch rerun, escalate ownership, change severity, mark an incident resolved, and publish stakeholder communication. Critical incidents always enter the human incident-management process.

## Hard boundaries

The demonstration never modifies a trade, market-data value, report configuration, batch state, or production-like record. Unknown citations, batch-fact contradiction, low confidence, missing required inputs, critical severity, malformed output, or a proposed mutation causes the workflow to fail closed. Recommendation state remains operationally inert until an approval record exists.
