import assert from "node:assert/strict";
import test from "node:test";
import { decideApproval, executeSyntheticRemediation, runInvestigation } from "../../src/investigation/workflow";
import { MemoryInvestigationRepository } from "../../src/persistence/memory-repository";

const actionId = "refresh_fx_market_data_and_rerun_risk_controls";
async function investigated(repository: MemoryInvestigationRepository) { return runInvestigation({ incidentId: "HVB-2847", repository }); }
async function approved(repository: MemoryInvestigationRepository) { const run = await investigated(repository); return decideApproval({ repository, runId: run.id, decision: "approved", scope: "recommendation", comment: "Approve bounded synthetic FX recovery." }); }

test("HVB-2847 happy path executes the allow-listed action and resolves only after deterministic validation", async () => {
  const repository = new MemoryInvestigationRepository(); const run = await approved(repository);
  const resolved = await executeSyntheticRemediation({ repository, runId: run.id, actionId });
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.remediation?.actionId, actionId);
  assert.equal(resolved.remediation?.incidentId, "HVB-2847");
  assert.equal(resolved.remediation?.recommendationVersion, 1);
  assert.equal(resolved.remediation?.approvingActor, "demo.support.analyst");
  assert.equal(resolved.remediation?.executingActor, "synthetic.remediation.executor");
  assert.equal(resolved.remediation?.preconditions.every(item => item.passed), true);
  assert.equal(resolved.remediation?.resolution.outcome, "RESOLVED");
  assert.equal(resolved.remediation?.resolution.determinedBy, "deterministic_resolution_policy");
  assert.equal(resolved.remediation?.validation.every(item => item.passed), true);
  assert.match(resolved.remediation?.validation.find(item => item.control === "USD/JPY freshness")?.after ?? "", /CURRENT/);
  assert.match(resolved.remediation?.validation.find(item => item.control === "Report distribution")?.after ?? "", /RELEASED/);
  assert.equal(resolved.auditEvents.at(-1)?.eventType, "incident.closed");
});

test("HVB-2847 remediation without approval fails closed and records the rejected attempt", async () => {
  const repository = new MemoryInvestigationRepository(); const run = await investigated(repository);
  await assert.rejects(() => executeSyntheticRemediation({ repository, runId: run.id, actionId }), /approved recommendation/i);
  assert.equal((await repository.getRun(run.id))?.auditEvents.at(-1)?.eventType, "remediation.precondition_rejected");
});

test("HVB-2847 stale approval cannot authorise a superseded recommendation", async () => {
  const repository = new MemoryInvestigationRepository(); const run = await approved(repository);
  assert.ok(run.recommendation); await repository.saveRun({ ...run, recommendation: { ...run.recommendation, version: 2 } });
  await assert.rejects(() => executeSyntheticRemediation({ repository, runId: run.id, actionId }), /current recommendation version/i);
});

test("HVB-2847 rejects actions outside the incident allow-list", async () => {
  const repository = new MemoryInvestigationRepository(); const run = await approved(repository);
  await assert.rejects(() => executeSyntheticRemediation({ repository, runId: run.id, actionId: "arbitrary_shell_or_api_action" }), /not allow-listed/i);
  assert.match((await repository.getRun(run.id))?.auditEvents.at(-1)?.summary ?? "", /not allow-listed/i);
});

test("HVB-2847 duplicate execution is idempotently rejected without replacing the first result", async () => {
  const repository = new MemoryInvestigationRepository(); const run = await approved(repository);
  const first = await executeSyntheticRemediation({ repository, runId: run.id, actionId }); const executionId = first.remediation?.executionId;
  await assert.rejects(() => executeSyntheticRemediation({ repository, runId: run.id, actionId }), /already executed/i);
  const persisted = await repository.getRun(run.id); assert.equal(persisted?.remediation?.executionId, executionId); assert.equal(persisted?.status, "resolved");
});

test("HVB-2847 validation failure keeps the incident open, holds distribution, and escalates", async () => {
  const repository = new MemoryInvestigationRepository(); const run = await approved(repository);
  const escalated = await executeSyntheticRemediation({ repository, runId: run.id, actionId, simulationOutcome: "validation_failure" });
  assert.equal(escalated.status, "requires_escalation");
  assert.equal(escalated.remediation?.resolution.outcome, "VALIDATION_FAILED");
  assert.ok(escalated.remediation?.resolution.failedControls.includes("USD/JPY freshness"));
  assert.match(escalated.remediation?.validation.find(item => item.control === "Report distribution")?.after ?? "", /HELD/);
  assert.equal(escalated.auditEvents.at(-1)?.eventType, "incident.escalated");
});

test("HVB-2847 current citation or policy failure blocks an already-approved action", async () => {
  const repository = new MemoryInvestigationRepository(); const run = await approved(repository);
  assert.ok(run.citationValidation); await repository.saveRun({ ...run, citationValidation: { ...run.citationValidation, valid: false, errors: ["Superseded evidence snapshot"] } });
  await assert.rejects(() => executeSyntheticRemediation({ repository, runId: run.id, actionId }), /Citation or policy state/i);
});
