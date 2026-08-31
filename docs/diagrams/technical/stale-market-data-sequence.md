# Technical Stale Market-Data Scenario Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Analyst as Support analyst<br/>(fictional demo identity)
    participant UI as Workbench UI
    participant API as Investigation API
    participant WF as Workflow orchestrator
    participant Tools as Deterministic tools
    participant Retrieval as Trusted retrieval
    participant Provider as Structured synthesis<br/>(deterministic mock)
    participant Guard as Validator and policy
    participant Store as D1 repository
    participant Action as Synthetic action gate
    participant Validate as Deterministic validation

    Analyst->>UI: Start HVB-2847 investigation
    UI->>API: POST incident ID
    API->>WF: Run typed scenario
    WF->>Store: Persist running investigation

    WF->>Tools: Check freshness, exposure,<br/>batch and reconciliation
    Tools-->>WF: Stale USD/JPY<br/>AUD 12.8m affected<br/>batch succeeded
    WF->>Retrieval: Retrieve approved guidance
    Retrieval-->>WF: Runbook, distribution policy<br/>and escalation guidance

    WF->>Provider: Provide structured facts<br/>and attributable guidance
    Provider-->>WF: Versioned cited recommendation
    WF->>Guard: Validate schema, citations,<br/>facts, confidence and policy

    alt Invalid, unsupported or incomplete
        Guard-->>WF: Fail closed
        WF->>Store: Persist errors and escalation state
        WF-->>UI: No action permitted
    else Valid and approval required
        Guard-->>WF: Recommendation may be reviewed
        WF->>Store: Persist evidence, recommendation,<br/>policy and audit events
        WF-->>UI: Present approval packet

        Analyst->>UI: Approve exact recommendation version
        UI->>API: POST approval decision
        API->>WF: Record decision and evidence snapshot
        WF->>Store: Persist approval and audit event

        Analyst->>UI: Execute approved synthetic recovery
        UI->>Action: Request named action with confirmation
        Action->>Store: Reload current run and approval
        Action->>Guard: Recheck version, citations, policy,<br/>evidence, confidence and allow-list

        alt Precondition fails or request is duplicated
            Guard-->>Action: Reject
            Action->>Store: Append rejected-action audit event
            Action-->>UI: Recovery not executed
        else Preconditions pass
            Guard-->>Action: Permit one synthetic capability
            Action->>Action: Simulate approved USD/JPY refresh<br/>and scoped APAC risk rerun
            Action->>Validate: Supply fresh post-action evidence
            Validate->>Validate: Check freshness, rerun, population,<br/>reconciliation and distribution

            alt Every validation control passes
                Validate-->>WF: RESOLVED
                WF->>Store: Persist execution, evidence,<br/>closure and audit trail
                WF-->>UI: Show resolved state
            else Any validation control fails
                Validate-->>WF: VALIDATION_FAILED
                WF->>Store: Keep report held and<br/>persist escalation state
                WF-->>UI: Show requires escalation
            end
        end
    end
```

All names, values, identities, and actions in this sequence are fictional. The remediation step is a controlled simulation and does not contact a production system.
