import assert from "node:assert/strict";
import test from "node:test";
import type { InvestigationContext, Recommendation } from "../../src/domain/models";
import { decideApproval, runInvestigation } from "../../src/investigation/workflow";
import { MemoryInvestigationRepository } from "../../src/persistence/memory-repository";
import { DeterministicMockSynthesiser } from "../../src/providers/mock-synthesiser";
import type { InvestigationSynthesiser } from "../../src/providers/synthesiser";

class MutatingProvider implements InvestigationSynthesiser {
  readonly name = "unsafe-mutation-test";
  async synthesise(context: InvestigationContext): Promise<Recommendation> {
    const safe = await new DeterministicMockSynthesiser().synthesise(context);
    return { ...safe, recommendedNextAction: "Modify the market data rate directly and resolve the incident." };
  }
}

class FabricatedCitationProvider implements InvestigationSynthesiser {
  readonly name = "fabricated-citation-test";
  async synthesise(context: InvestigationContext): Promise<Recommendation> {
    const safe = await new DeterministicMockSynthesiser().synthesise(context);
    return { ...safe, candidates: [{ ...safe.candidates[0], evidenceReferences: ["EV-FABRICATED-999"] }] };
  }
}

class MalformedProvider implements InvestigationSynthesiser {
  readonly name = "malformed-test";
  async synthesise(): Promise<Recommendation> { return { confidence: 150 } as Recommendation; }
}

test("fabricated citations fail closed", async () => {
  const run = await runInvestigation({ incidentId: "HVB-2847", repository: new MemoryInvestigationRepository(), synthesiser: new FabricatedCitationProvider() });
  assert.equal(run.status, "failed_closed");
  assert.match(run.citationValidation?.errors.join(" ") ?? "", /EV-FABRICATED-999/);
});

test("direct market-data modification fails closed", async () => {
  const run = await runInvestigation({ incidentId: "HVB-2847", repository: new MemoryInvestigationRepository(), synthesiser: new MutatingProvider() });
  assert.equal(run.status, "failed_closed");
  assert.match(run.citationValidation?.errors.join(" ") ?? "", /protected production-like record/);
});

test("malformed structured output fails closed", async () => {
  const run = await runInvestigation({ incidentId: "HVB-2847", repository: new MemoryInvestigationRepository(), synthesiser: new MalformedProvider() });
  assert.equal(run.status, "failed_closed");
  assert.equal(run.recommendation, null);
});

test("approval before completion and failed-closed approval are rejected", async () => {
  const repository = new MemoryInvestigationRepository();
  const completed = await runInvestigation({ incidentId: "HVB-2847", repository });
  await repository.saveRun({ ...completed, status: "running" });
  await assert.rejects(() => decideApproval({ repository, runId: completed.id, decision: "approved" }), /must complete/);
  const failed = await runInvestigation({ incidentId: "HVB-2847", repository, synthesiser: new FabricatedCitationProvider() });
  await assert.rejects(() => decideApproval({ repository, runId: failed.id, decision: "approved" }), /failed-closed|Completed investigation|must complete/);
});

test("normal repository consumers cannot overwrite prior audit events", async () => {
  const repository = new MemoryInvestigationRepository();
  const run = await runInvestigation({ incidentId: "HVB-2847", repository });
  const loaded = await repository.getRun(run.id);
  loaded!.auditEvents[0].summary = "tampered";
  assert.notEqual((await repository.getRun(run.id))!.auditEvents[0].summary, "tampered");
});
