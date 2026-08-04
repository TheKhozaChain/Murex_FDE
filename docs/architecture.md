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

The deterministic layer owns facts and state transitions. Retrieval returns attributable documents. The AI layer receives only the bounded evidence packet and returns a strict recommendation schema. The guardrail layer verifies references and policy before an approval can be requested. The demo has no production write container or tool.

