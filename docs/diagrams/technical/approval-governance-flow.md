# Technical Approval and Governance Flow

```mermaid
flowchart TB
    REC["Versioned recommendation<br/>with cited evidence snapshot"] --> V{"Recommendation valid?"}
    V -->|"No"| FC["FAIL CLOSED"]
    V -->|"Yes"| P{"Policy result"}

    P -->|"fail_closed"| ES["Only escalation disposition<br/>may be approved"]
    P -->|"approval_required"| PACK["Review packet<br/>action · risk · blast radius<br/>preconditions · validation · rollback"]

    ES --> EH{"Human decision"}
    EH -->|"Approve escalation"| OPEN["Keep incident open<br/>and escalate"]
    EH -->|"Reject"| OPEN
    EH -->|"Request more evidence<br/>when supported"| MORE["Gather additional evidence<br/>and reassess"]
    MORE --> REC

    PACK --> H{"Human decision"}
    H -->|"Reject"| OPEN
    H -->|"Approve current version"| LOOKUP{"Execution-time revalidation"}

    LOOKUP --> C1["Approval matches recommendation version"]
    C1 --> C2["Citations and policy still pass"]
    C2 --> C3["Required evidence is complete"]
    C3 --> C4["Action is allow-listed and not duplicated"]
    C4 --> C5["Scenario preconditions pass"]

    C1 -->|"Fail"| REJECT["Reject action and append audit event"]
    C2 -->|"Fail"| REJECT
    C3 -->|"Fail"| REJECT
    C4 -->|"Fail"| REJECT
    C5 -->|"Fail"| REJECT
    C5 -->|"Pass"| EXEC["Execute named synthetic capability"]

    EXEC --> POST["Collect fresh validation evidence"]
    POST --> R{"All required controls pass?"}
    R -->|"Yes"| CLOSED["RESOLVED"]
    R -->|"No"| OPEN

    AUDIT[("Persist evidence, policy, decision,<br/>actors, action and outcome")]
    REC -.-> AUDIT
    H -.-> AUDIT
    EH -.-> AUDIT
    REJECT -.-> AUDIT
    EXEC -.-> AUDIT
    R -.-> AUDIT

    classDef record fill:#edf1f4,stroke:#687884,color:#2b363e,stroke-width:1.5px
    classDef decision fill:#fff1d6,stroke:#a76e12,color:#523604,stroke-width:1.5px
    classDef action fill:#e4f2ef,stroke:#17766c,color:#133d38,stroke-width:1.5px
    classDef success fill:#e0f2e7,stroke:#2d7d53,color:#173e2b,stroke-width:2px
    classDef failure fill:#f8e3e3,stroke:#aa4545,color:#522020,stroke-width:2px

    class REC,PACK,C1,C2,C3,C4,C5,POST,AUDIT record
    class V,P,EH,H,LOOKUP,R decision
    class MORE,EXEC action
    class CLOSED success
    class FC,ES,OPEN,REJECT failure
```

Approval is necessary but not sufficient. The action layer reloads persisted state and repeats the relevant checks before executing the named synthetic capability.
