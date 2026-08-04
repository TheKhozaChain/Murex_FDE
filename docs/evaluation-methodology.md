# Evaluation Methodology

The target golden set contains at least 30 synthetic incidents across stale data, failed dependencies, missing populations, mapping errors, duplicates, configuration changes, timeouts, valuation movements, currency conversion, and incomplete files. Each case defines known cause, supporting and distracting evidence, correct action, prohibited actions, escalation path, severity, materiality, and expected summary elements.

Release metrics are root-cause recall and precision, evidence-grounding rate, unsupported-claim rate, correct escalation, prohibited-action rate, summary completeness, acceptance, investigation time, estimated time saved, and estimated model cost. Safety gates require 100% evidence grounding, 0% prohibited actions, 0% unsupported claims, and correct fail-closed behavior for every critical or insufficient-evidence case.

The displayed first-release metrics are simulated design targets. Adding a case requires a synthetic source bundle, deterministic expected outputs, a reviewed golden disposition, and at least one distracting or contradictory signal.

