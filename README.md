# Murex FDE Workbench

**Controlled AI-assisted investigation for capital-markets production support**

An APAC risk report shows an **18.4% FX movement**. The overnight batch is green, yet its USD/JPY observation is stale. Deterministic calculations identify **AUD 12.8m** in affected exposure, and report distribution remains held.

Murex FDE Workbench demonstrates how a support team could turn that fragmented exception into an evidence-backed case: establish facts, prepare a cited recommendation, apply policy, obtain accountable approval, run only a named simulated action and validate the outcome independently.

> **Portfolio reference implementation:** All data, institutions, users, documents and actions are fictional or synthetic. The current provider is deterministic. There is no real bank deployment or production Murex connectivity. Enterprise diagrams describe illustrative future architecture.

## See the product story

**[Read the visual solution overview](docs/solution-overview.md)** for the two-minute enterprise story, authority model, three outcomes, governance gates and deployment journey.

**[Open the public portfolio simulation](https://murex-fde-workbench.thekhoza.chatgpt.site)** and select `HVB-2847`, or [run the demo locally](#run-locally).

![Flagship APAC FX scenario in six frames](docs/diagrams/presentation/rendered/flagship-six-frame.svg)

## What the workbench does

The application models a controlled investigation workflow rather than an open-ended chat:

1. **Gather evidence.** Conventional TypeScript tools calculate timestamps, exposure, populations, reconciliations, materiality and batch state.
2. **Retrieve guidance.** Approved fictional runbooks retain source, version, trust and relevance metadata.
3. **Prepare a recommendation.** The provider separates facts, hypotheses, uncertainty, risk, action scope, validation and rollback, with citations.
4. **Validate independently.** Schema, citation, factual, confidence and policy checks can fail closed.
5. **Require a human decision.** Approval is tied to the exact recommendation version and evidence snapshot.
6. **Limit execution.** Only an incident-specific synthetic capability can run; arbitrary commands, SQL, generated code and external integrations are unavailable.
7. **Prove the outcome.** Fresh deterministic controls—not provider confidence—decide whether the case resolves or escalates.

## What AI assistance can—and cannot—do

AI assistance may organise evidence, propose hypotheses, explain uncertainty and draft a cited recommendation.

It does **not** establish source facts, validate its own citations, approve a decision, create an action capability, determine execution scope or mark an incident resolved. Those responsibilities remain with deterministic software, policy controls and accountable people.

[See the authority matrix](docs/solution-overview.md#5-who-controls-what).

## Three scenarios, three safe outcomes

All executable cases use the same orchestrator, provider contract, validation, policy, approval, audit, persistence and evaluation layers.

| Scenario | What it demonstrates | Safe outcome |
| --- | --- | --- |
| `HVB-2847` — unexpected FX delta | A successful batch used stale USD/JPY data affecting AUD 12.8m exposure | Approve one scoped synthetic recovery, then close only after five controls pass |
| `HVB-2829` — large commodities P&L | A material AUD 6.1m movement reconciles to market and position effects | Explain the movement, request Product Control review and avoid remediation |
| `HVB-2822` — liquidity population shortfall | A timeout and similar historical incident do not prove the current cause | First pass: fail closed and gather evidence; scoped recovery becomes available only after evidence expansion and review |

Two additional incidents in the interface are labelled previews rather than executable workflows.

## Governance and evidence

The reference implementation includes:

- evidence lineage and attributable retrieval;
- structured recommendation validation;
- scenario-specific policy and fail-closed behavior;
- recommendation-version-bound approval;
- action allow-lists and duplicate-execution protection;
- post-action evidence and deterministic resolution;
- persisted audit events and safe traces;
- three executable golden cases with 17 scored fields each—five remediation fields are non-applicable passes outside `HVB-2847`; and
- 48 TypeScript tests, a production build and two rendered-output tests.

Meaningful negative tests reject fabricated citations, unnecessary remediation, historical evidence presented as current proof, missing or stale approval, disallowed or duplicate action and failed validation.

This evidence supports the checked-in synthetic workflow. It does not establish live-model accuracy, production safety, regulatory compliance, operational scale or measured ROI. The [planned 30-case corpus](PLAN.md#evaluation-expectations) is not yet implemented.

## Run locally

Requirements: Node.js 22.13 or later and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by the development server. The local Cloudflare preview uses the `DB` D1 binding. Recreate and seed it with:

```bash
npm run db:reset
npm run db:seed
```

Validate the repository with:

```bash
npm run typecheck
npm run lint
npm test
npm run eval
```

Run one golden case with `npm run eval -- --case HVB-2847`, `HVB-2829` or `HVB-2822`.

## Documentation

- [Visual solution overview](docs/solution-overview.md) — primary enterprise communication asset
- [Executive brief](docs/solution-brief/executive-brief.md) — concise stakeholder handout
- [Scenario walkthrough](docs/solution-brief/scenario-walkthrough.md) — implemented case behavior
- [Technical brief](docs/solution-brief/technical-brief.md) — components, state transitions, APIs, persistence and tests
- [Governance and controls](docs/solution-brief/governance-and-controls.md) — controls, evidence and production gaps
- [Enterprise deployment vision](docs/solution-brief/enterprise-deployment-vision.md) — illustrative adoption path
- [AI decision boundaries](docs/ai-decision-boundaries.md) and [threat model](docs/threat-model.md) — concise authority and security references
- [Demo script](docs/demo-script.md), [FDE engagement framing](docs/fde-engagement.md) and [interview talking points](docs/interview-talking-points.md) — portfolio presentation support
- [Presentation diagrams](docs/diagrams/presentation/) — primary visual set
- [Technical diagram appendix](docs/diagrams/technical/) — detailed implementation and sequence diagrams

## Repository map

```text
app/                     User interface and validated API routes
data/                    Fictional incidents, guidance and golden cases
src/deterministic/       Reproducible fact collection
src/investigation/       Workflow orchestration and validation
src/policy/              Safety and approval rules
src/providers/           Synthesis interface and deterministic provider
src/persistence/         In-memory and D1 repositories
src/evaluation/          Golden evaluation runner
tests/                   Unit, integration, security and rendered checks
docs/                    Solution, technical and governance documentation
```

## Current boundaries

This is a portfolio simulation, not production software. It has no production authentication, tenant isolation, regulated retention, enterprise monitoring, real-model evaluation or production-safe recovery integration. Synthetic time-saving assumptions are not measured business outcomes.

Murex is a trademark of its respective owner. This independent educational project is not affiliated with or endorsed by Murex or any financial institution. It contains no proprietary source code, client data, production credentials or production connectivity.

## Contributing and licence

See [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and the [MIT licence](LICENSE).
