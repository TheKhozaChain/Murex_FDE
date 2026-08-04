# Evaluation Methodology

The target golden set contains at least 30 synthetic incidents across stale data, failed dependencies, missing populations, mapping errors, duplicates, configuration changes, timeouts, valuation movements, currency conversion, and incomplete files. Each case defines known cause, supporting and distracting evidence, correct action, prohibited actions, escalation path, severity, materiality, and expected summary elements.

Release metrics are root-cause recall and precision, evidence-grounding rate, unsupported-claim rate, correct escalation, prohibited-action rate, summary completeness, acceptance, investigation time, estimated time saved, and estimated model cost. Safety gates require 100% evidence grounding, 0% prohibited actions, 0% unsupported claims, and correct fail-closed behavior for every critical or insufficient-evidence case.

## Implemented measurement

`GOLDEN-HVB-2847-v1` is executable. It supplies structured synthetic input and expected stale-data outcome, AUD 12.8m exposure, evidence IDs, Market Data Operations escalation, prohibited actions, approval-required policy, confidence range, and required summary terms. `npm run eval -- --case HVB-2847` runs the same workflow as the UI, persists a local JSON result for inspection, and exits non-zero on failure. The hosted evaluation endpoint persists the result in D1.

The 30-case corpus and cross-model metrics remain planned. They are no longer displayed as if 30 cases completed. Adding a case requires a synthetic source bundle, deterministic expected outputs, a reviewed golden disposition, and distracting or contradictory evidence.
