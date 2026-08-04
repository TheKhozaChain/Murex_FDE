# Threat Model

| Threat | Control |
|---|---|
| Prompt injection or malicious runbook content | Weighted local retrieval penalises instruction-like content; only approved/trusted citations validate; documents are data, never instructions |
| Data leakage | Synthetic data by default, redaction before providers/logs, no secrets in prompts or traces |
| Hallucinated root causes | Closed evidence set, citation validator, confidence threshold, analyst confirmation |
| Excessive agent autonomy | Explicit state machine, maximum steps, timeouts, retries, absent mutation tools |
| Unauthorised actions | Role checks plus explicit approval gates and append-only decision records |
| Poisoned incident history | Provenance, source trust, recency weighting, contradiction detection |
| Model-provider outage | Deterministic evidence remains available; mock/local fallback; safe error state |
| Cost overruns | Per-run token/cost budgets, rate limits, maximum steps, observability |
| Incomplete audit trails | Idempotent workflow IDs, append-only events, schema validation before transition |

Automated adversarial tests cover fabricated citations, direct market-data mutation, malformed output, early/duplicate approval, injected retrieval content, and consumer attempts to mutate loaded audit events. Residual risk remains because the public demo uses shared D1 state and a labelled demo identity rather than authentication; synthetic evaluation cannot establish production safety; and a future external provider may behave differently. A real deployment requires authenticated tenant isolation, bank security review, model-risk governance, privacy assessment, regulated retention, operational-resilience testing, and controlled shadow-mode evidence.
