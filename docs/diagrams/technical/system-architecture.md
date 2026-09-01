# Technical System Architecture

```mermaid
flowchart TB
    subgraph EXPERIENCE["User experience"]
        UI["React workbench<br/>evidence · diagnosis · approval<br/>remediation · validation · audit"]
        OBS["Evaluation and observability views"]
    end

    subgraph API["Validated API boundary"]
        INVEST["Investigations API"]
        APPROVE["Approvals API"]
        REMEDIATE["Remediations API"]
        EVALUATE["Evaluations API"]
    end

    subgraph ORCHESTRATION["Workflow and control plane"]
        WF["Explicit investigation state machine"]
        REG["Typed scenario registry"]
        VALIDATOR["Schema, citation and fact validator"]
        POLICY["Deterministic safety policy"]
        ACTION["Incident-specific action gate"]
        RESOLUTION["Deterministic resolution policy"]
    end

    subgraph EVIDENCE["Evidence and reasoning"]
        TOOLS["Deterministic tools<br/>timestamps · counts · exposure<br/>reconciliation · deadlines"]
        RETRIEVER["Local attributable retrieval<br/>trust · version · provenance"]
        PROVIDER["Structured synthesis provider<br/>deterministic mock by default"]
        SIMULATOR["Bounded synthetic recovery simulator"]
    end

    subgraph DATA["Synthetic data and persistence"]
        INPUTS["Checked-in fictional incidents"]
        DOCS["Fictional runbooks and policies"]
        REPO["Repository interface"]
        D1[("Cloudflare D1")]
        MEMORY[("In-memory test repository")]
    end

    subgraph ASSURANCE["Assurance"]
        GOLDEN["Three golden evaluation cases<br/>17 scored fields per case<br/>5 remediation fields N/A outside HVB-2847"]
        TESTS["Unit · integration · security<br/>build and rendered-output tests"]
        AUDIT["Evidence, approval, action<br/>audit and trace records"]
    end

    UI --> INVEST
    UI --> APPROVE
    UI --> REMEDIATE
    OBS --> INVEST
    OBS --> EVALUATE

    INVEST --> WF
    APPROVE --> WF
    REMEDIATE --> WF
    EVALUATE --> WF

    WF --> REG
    REG --> INPUTS
    WF --> TOOLS
    TOOLS --> INPUTS
    WF --> RETRIEVER
    RETRIEVER --> DOCS
    TOOLS --> PROVIDER
    RETRIEVER --> PROVIDER
    PROVIDER --> VALIDATOR
    VALIDATOR --> POLICY
    POLICY --> ACTION
    ACTION --> SIMULATOR
    SIMULATOR --> RESOLUTION

    WF --> REPO
    REPO --> D1
    REPO --> MEMORY
    WF --> AUDIT
    GOLDEN --> EVALUATE
    TESTS -. "exercise shared workflow" .-> WF

    PROD["No bank, Murex, market-data,<br/>scheduler or production connection"]
    SIMULATOR -. "explicit boundary" .-> PROD

    classDef ui fill:#e9eef5,stroke:#4d6780,color:#1d3141,stroke-width:1.5px
    classDef control fill:#fff1d6,stroke:#a76e12,color:#523604,stroke-width:1.5px
    classDef deterministic fill:#e4f2ef,stroke:#17766c,color:#133d38,stroke-width:1.5px
    classDef ai fill:#eee9f8,stroke:#7356a3,color:#34244d,stroke-width:1.5px
    classDef data fill:#edf1f4,stroke:#687884,color:#2b363e,stroke-width:1.5px
    classDef boundary fill:#f8e3e3,stroke:#aa4545,color:#522020,stroke-width:2px

    class UI,OBS ui
    class INVEST,APPROVE,REMEDIATE,EVALUATE,WF,REG,VALIDATOR,POLICY,ACTION,RESOLUTION control
    class TOOLS,RETRIEVER,SIMULATOR deterministic
    class PROVIDER ai
    class INPUTS,DOCS,REPO,D1,MEMORY,GOLDEN,TESTS,AUDIT data
    class PROD boundary
```

The public runtime uses D1. Tests use the same repository contract with an in-memory implementation. The default provider is deterministic and local, not an external language model.
