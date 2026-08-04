# Threat Model

| Threat | Control |
|---|---|
| Prompt injection or malicious runbook content | Treat documents as quoted data, strip instructions, trust metadata, closed tools, cite sources |
| Data leakage | Synthetic data by default, redaction before providers/logs, no secrets in prompts or traces |
| Hallucinated root causes | Closed evidence set, citation validator, confidence threshold, analyst confirmation |
| Excessive agent autonomy | Explicit state machine, maximum steps, timeouts, retries, absent mutation tools |
| Unauthorised actions | Role checks plus explicit approval gates and append-only decision records |
| Poisoned incident history | Provenance, source trust, recency weighting, contradiction detection |
| Model-provider outage | Deterministic evidence remains available; mock/local fallback; safe error state |
| Cost overruns | Per-run token/cost budgets, rate limits, maximum steps, observability |
| Incomplete audit trails | Idempotent workflow IDs, append-only events, schema validation before transition |

Residual risk remains because synthetic evaluation cannot establish production safety, business processes may differ from interviews, and provider behavior can change. A real deployment requires bank security review, model risk governance, privacy assessment, operational resilience testing, and controlled shadow-mode evidence.

