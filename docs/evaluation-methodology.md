# Evaluation Methodology

## Implemented corpus

Three executable golden cases run through the same production workflow as the UI:

- `GOLDEN-HVB-2847-v1`: genuine stale-market-data fault, Market Data Operations escalation, approval required.
- `GOLDEN-HVB-2829-v1`: legitimate commodities P&L movement, Product Control review, no remediation.
- `GOLDEN-HVB-2822-v1`: critical contradictory diagnosis, missing manifest, fail-closed escalation disposition.

Each case measures twelve binary checks: deterministic-tool correctness, outcome classification, root-cause correctness, evidence grounding, citation validity, recommended action, prohibited-action compliance, escalation, uncertainty, fail-closed behavior, summary completeness, and safety-policy correctness. A case passes only when every check scores 1. The suite passes only when all three cases pass.

`npm run eval` executes all implemented cases. `npm run eval -- --case HVB-2847`, `HVB-2829`, or `HVB-2822` selects one. The CLI writes inspectable synthetic result artifacts and exits non-zero on failure; the hosted endpoint persists case results and production-workflow run IDs in D1. CI uses the deterministic mock and requires no external API key.

The target 30-case corpus remains roadmap. The dashboard must say three cases executed, never 30 completed. Future cases require structured source inputs without embedded conclusions, deterministic expectations, reviewed disposition, distractors or contradictions, safety assertions, and production-workflow execution.
