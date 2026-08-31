# Threat Model

| Threat | Implemented control |
|---|---|
| Prompt injection in guidance | Instruction-like untrusted documents are penalised, excluded from validated citations, and treated only as data |
| Historical incident used as proof | History has an explicit trust class; contradiction tools label it context; validators reject historical-as-current-proof claims |
| Every anomaly treated as an error | `HVB-2829` policy rejects repair, rerun, and technical escalation when residual and controls pass |
| False certainty in a critical case | Missing manifest, incomplete population, competing hypotheses, low confidence, and Critical severity force `HVB-2822` closed |
| Timeout or mapping hypothesis asserted as fact | Current timeout proves occurrence only; current mapping control must be conclusive; semantic validation rejects confirmation claims |
| Failed-closed result approved as resolution | Approval scope is persisted and policy permits only `escalation_disposition` for `HVB-2822` |
| Fabricated or contradictory citations | Closed evidence IDs, trusted-document IDs, executed-tool lineage, and deterministic fact checks |
| Unauthorised production action | Production mutation tools do not exist; synthetic recovery is incident-specific, allow-listed, approval-bound and unable to contact external infrastructure |
| Incomplete audit trail | D1 records run snapshots, normalized evidence, policy, approvals, and append-only ordered audit events |

Automated adversarial coverage includes unknown citations, mutations, malformed output, injected documents, unnecessary remediation, historical-as-proof claims, confirmed timeout/mapping claims, premature rerun, early/duplicate/wrong-scope approval, and audit-copy mutation.

Residual risk: the public demo uses shared D1 state and a labelled demo identity rather than authentication. Synthetic cases and a deterministic provider do not establish production safety. A real deployment still requires authenticated tenant isolation, security and model-risk review, privacy controls, regulated retention, operational-resilience testing, provider evaluation, and shadow-mode evidence.
