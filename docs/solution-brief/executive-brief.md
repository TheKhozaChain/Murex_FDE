# Murex FDE Workbench: Executive Brief

**Controlled AI-assisted investigation for capital-markets production support**

An APAC risk report shows an **18.4% FX movement**. The overnight batch is green, but the report remains held. A freshness check identifies a stale USD/JPY observation, and deterministic calculations show **AUD 12.8m** in affected exposure.

The operational question is not simply “What does the AI think?” It is: **What happened, what evidence supports it, who is authorised to decide, and how will the organisation prove that any recovery worked?**

Murex FDE Workbench is a portfolio reference implementation of that controlled process. It uses fictional data, a deterministic synthesis provider and synthetic actions. It has no production Murex or bank connectivity. The enterprise design described below is illustrative future architecture, not a deployed capability.

## The capability

The workbench brings evidence, guidance, recommendation, approval and validation into one auditable case:

1. Conventional software establishes timestamps, counts, exposure, population, reconciliation and batch state.
2. A bounded synthesis component organises that evidence into a structured, cited diagnosis and recommendation.
3. Independent validation checks schema, citations, facts, evidence completeness and policy.
4. An accountable human approves, rejects or requests more investigation.
5. If permitted, only one named synthetic capability can execute.
6. Fresh deterministic controls—not the provider—decide whether the case resolves or escalates.

This differs from a chatbot because AI does not own facts, permission, execution scope or closure.

## Three outcomes, one controlled workflow

| Scenario | Business question | Safe outcome |
| --- | --- | --- |
| Stale FX data | Did a green batch use an invalid input? | Approve one scoped recovery and validate before closure |
| Large commodities P&L | Does a material movement imply a technical fault? | Explain the movement and avoid unnecessary remediation |
| Liquidity population shortfall (first pass) | Does a timeout or similar history prove the cause? | Fail closed and gather evidence; recovery requires a second pass and review |

The scenarios demonstrate that useful assistance must distinguish among **repair, explain and stop**.

## Governance and evidence

The reference implementation requires evidence, citation validation, policy validation, version-bound approval, an action allow-list, duplicate-execution protection and post-action validation.

It includes three executable synthetic scenarios, 17 scored fields per golden case—with five remediation fields treated as non-applicable passes outside `HVB-2847`—48 TypeScript tests, a production build and two rendered-output tests. Negative tests cover fabricated citations, unnecessary remediation, historical evidence misused as proof, stale approval, disallowed or duplicate action and validation failure.

These checks support the implemented synthetic workflow. They do not prove live-model accuracy, production safety, regulatory compliance, measured ROI or performance on real institutional data.

## What enterprise adaptation would require

The control pattern could remain constant, but each institution would supply its own authoritative connectors, document governance, identity and segregation of duties, policy service, action catalogue, observability, retention and validation criteria.

Adoption should progress from operating-model discovery to read-only evidence assembly, shadow AI, human-reviewed assistance, one bounded action and only then scaled governed operation.

> **Authority increases only after evidence, evaluation, ownership, and operational controls increase.**

## Review the capability

- [Visual solution overview](../solution-overview.md)
- [Public portfolio simulation](https://murex-fde-workbench.thekhoza.chatgpt.site)
- [Enterprise deployment vision](enterprise-deployment-vision.md)
- [Governance and controls](governance-and-controls.md)

Murex is a trademark of its respective owner. This independent educational project is not affiliated with or endorsed by Murex or any financial institution.
