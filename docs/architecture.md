# Architecture

```mermaid
flowchart TD
  I[Incident selected] --> V[Validate payload]
  V --> D[Gather deterministic evidence]
  D --> R[Retrieve trusted guidance]
  R --> S[Structured synthesis]
  S --> C{Schema, citations, confidence, policy}
  C -->|pass| H[Human approval]
  C -->|fail| F[Fail closed and escalate]
  H --> A[Append audit event]
  F --> A
```

```mermaid
flowchart LR
  W[Web workbench] --> DS[Domain services]
  DS --> DB[(Synthetic data store)]
  DS --> RET[Local retrieval]
  DS --> AI[Provider abstraction]
  AI --> M[Mock default]
  AI -. optional .-> O[OpenAI / Anthropic / compatible]
  DS --> OBS[Traces and evaluation]
```

The deterministic layer owns facts and state transitions. Retrieval returns attributable documents and down-ranks unapproved instruction-like content. The provider layer receives only the bounded evidence packet and returns a strict recommendation schema. Citation validation verifies every evidence ID, executed-tool lineage, batch-fact consistency, confidence, and protected-record actions. The policy layer can override synthesis and fail closed before approval.

`HVB-2847` is implemented through `POST /api/investigations`, `POST /api/approvals`, and `POST /api/evaluations`. D1 stores normalized records plus a validated run snapshot. Tests use an in-memory repository behind the same contract. The four other incident stories remain client-side previews and the demo has no production write tool.

```mermaid
flowchart TD
  API[Server route: incident ID only] --> WF[Explicit workflow orchestrator]
  WF --> T[Six deterministic tools]
  T --> RET[Weighted local retrieval]
  RET --> MOCK[Provider-neutral mock synthesis]
  MOCK --> CV[Citation and fact validation]
  CV --> POL[Deterministic safety policy]
  POL --> D1[(D1 persisted state)]
  D1 --> UI[Investigation, trace, approval, evaluation UI]
```
