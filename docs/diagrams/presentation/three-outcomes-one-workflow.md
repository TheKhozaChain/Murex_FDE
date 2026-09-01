# Three Outcomes, One Workflow

```mermaid
flowchart TB
    START["Typed incident"] --> FACTS["Deterministic facts"]
    START --> GUIDE["Attributable guidance"]
    FACTS --> REC["Structured cited recommendation"]
    GUIDE --> REC
    REC --> GATE{"Validation, policy<br/>and human review"}

    GATE --> FAULT["GENUINE FAULT<br/><b>HVB-2847</b><br/>Approve one scoped recovery<br/>then validate before closure"]
    GATE --> EXPLAIN["LEGITIMATE MOVEMENT<br/><b>HVB-2829</b><br/>Explain and obtain review<br/>no technical remediation"]
    GATE --> UNCERTAIN["INSUFFICIENT EVIDENCE<br/><b>HVB-2822 first pass</b><br/>Fail closed, gather evidence<br/>and escalate safely"]

    PRINCIPLE["Safe assistance means knowing when to<br/><b>repair · explain · or stop</b>"]
    FAULT --> PRINCIPLE
    EXPLAIN --> PRINCIPLE
    UNCERTAIN --> PRINCIPLE

    classDef shared fill:#e9eef5,stroke:#4d6780,color:#1d3141,stroke-width:1.5px
    classDef decision fill:#fff1d6,stroke:#a76e12,color:#523604,stroke-width:1.5px
    classDef fault fill:#e4f2ef,stroke:#17766c,color:#133d38,stroke-width:1.5px
    classDef explain fill:#eee9f8,stroke:#7356a3,color:#34244d,stroke-width:1.5px
    classDef uncertain fill:#f8e3e3,stroke:#aa4545,color:#522020,stroke-width:1.5px
    classDef principle fill:#edf1f4,stroke:#687884,color:#2b363e,stroke-width:2px
    class START,FACTS,GUIDE,REC shared
    class GATE decision
    class FAULT fault
    class EXPLAIN explain
    class UNCERTAIN uncertain
    class PRINCIPLE principle
```

The scenario registry selects inputs and deterministic adapters. The three cases still share orchestration, validation, policy, approval, audit, persistence and evaluation layers.
