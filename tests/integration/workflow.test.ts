import assert from "node:assert/strict";
import test from "node:test";
import { decideApproval, runInvestigation } from "../../src/investigation/workflow";
import { MemoryInvestigationRepository } from "../../src/persistence/memory-repository";

test("complete mock-provider investigation persists and reloads", async () => {
  const repository = new MemoryInvestigationRepository();
  const run = await runInvestigation({ incidentId: "HVB-2847", repository });
  assert.equal(run.status, "completed");
  assert.equal(run.recommendation?.outcome, "stale_market_data");
  assert.equal(run.policyDecision?.result, "approval_required");
  assert.equal(run.citationValidation?.valid, true);
  assert.equal(run.approval, null);
  assert.deepEqual(await repository.getRun(run.id), run);
});

test("approval and rejection persist with demo identity and audit event", async () => {
  for (const decision of ["approved", "rejected"] as const) {
    const repository = new MemoryInvestigationRepository();
    const run = await runInvestigation({ incidentId: "HVB-2847", repository });
    const decided = await decideApproval({ repository, runId: run.id, decision, comment: "Reviewed synthetic evidence." });
    assert.equal(decided.approval?.decision, decision);
    assert.equal(decided.approval?.identity, "demo.support.analyst");
    assert.equal((await repository.getRun(run.id))?.auditEvents.at(-1)?.eventType, "approval.recorded");
  }
});

test("duplicate approval is rejected", async () => {
  const repository = new MemoryInvestigationRepository();
  const run = await runInvestigation({ incidentId: "HVB-2847", repository });
  await decideApproval({ repository, runId: run.id, decision: "approved" });
  await assert.rejects(() => decideApproval({ repository, runId: run.id, decision: "rejected" }), /already exists/);
});

