import assert from "node:assert/strict";
import test from "node:test";
import { decideApproval, executeSyntheticRemediation, requestMoreInvestigation, runInvestigation } from "../../src/investigation/workflow";
import { MemoryInvestigationRepository } from "../../src/persistence/memory-repository";

test("HVB-2829 persists an explained no-remediation outcome", async () => { const repository = new MemoryInvestigationRepository(); const run = await runInvestigation({ incidentId: "HVB-2829", repository }); assert.equal(run.status, "completed"); assert.equal(run.recommendation?.outcome, "legitimate_business_movement"); assert.match(run.recommendation?.recommendedNextAction ?? "", /Do not repair data or rerun the batch/i); assert.equal((await repository.getLatestRun("HVB-2829"))?.id, run.id); const decided = await decideApproval({ repository, runId: run.id, decision: "approved" }); assert.equal(decided.approval?.scope, "recommendation"); });
test("HVB-2822 persists a failed-closed critical disposition", async () => { const repository = new MemoryInvestigationRepository(); const run = await runInvestigation({ incidentId: "HVB-2822", repository }); assert.equal(run.status, "failed_closed"); assert.equal(run.recommendation?.outcome, "unconfirmed_critical_cause"); assert.equal(run.policyDecision?.permittedApprovalScope, "escalation_disposition"); assert.equal((await repository.getLatestRun("HVB-2822"))?.id, run.id); });
test("HVB-2822 rejects confirmed-resolution approval but permits escalation disposition", async () => { const repository = new MemoryInvestigationRepository(); const run = await runInvestigation({ incidentId: "HVB-2822", repository }); await assert.rejects(() => decideApproval({ repository, runId: run.id, decision: "approved", scope: "recommendation" }), /confirmed resolution/); const decided = await decideApproval({ repository, runId: run.id, decision: "approved", scope: "escalation_disposition" }); assert.equal(decided.approval?.decision, "approved"); assert.equal(decided.approval?.scope, "escalation_disposition"); assert.match(decided.auditEvents.at(-1)?.summary ?? "", /Escalation disposition approved/); });
test("HVB-2822 permits rejection without confirming a cause", async () => { const repository = new MemoryInvestigationRepository(); const run = await runInvestigation({ incidentId: "HVB-2822", repository }); const decided = await decideApproval({ repository, runId: run.id, decision: "rejected", scope: "escalation_disposition" }); assert.equal(decided.approval?.decision, "rejected"); });

test("HVB-2822 expands evidence, supports a scoped recovery, validates, and closes", async () => {
  const repository = new MemoryInvestigationRepository();
  const initial = await runInvestigation({ incidentId: "HVB-2822", repository });
  assert.equal(initial.status, "failed_closed");
  await assert.rejects(() => executeSyntheticRemediation({ repository, runId: initial.id }), /not available/);

  const investigated = await requestMoreInvestigation({ repository, runId: initial.id, comment: "Collect current source evidence." });
  assert.equal(investigated.status, "completed");
  assert.equal(investigated.recommendation?.version, 2);
  assert.equal(investigated.recommendation?.outcome, "upstream_interface_delivery_failure");
  assert.equal(investigated.recommendation?.confidence, 91);
  assert.equal(investigated.policyDecision?.result, "approval_required");
  assert.equal(investigated.policyDecision?.permittedApprovalScope, "recommendation");
  assert.ok(investigated.recommendation?.candidates.some(candidate => candidate.status === "ruled_out" && /mapping/i.test(candidate.cause)));
  assert.ok(investigated.auditEvents.some(event => event.eventType === "investigation.more_evidence_requested"));

  await assert.rejects(() => executeSyntheticRemediation({ repository, runId: initial.id }), /approved recommendation/i);
  const approved = await decideApproval({ repository, runId: initial.id, decision: "approved", scope: "recommendation", comment: "Scoped recovery approved." });
  assert.equal(approved.approval?.recommendationVersion, 2);

  const resolved = await executeSyntheticRemediation({ repository, runId: initial.id });
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.remediation?.mode, "synthetic_simulation");
  assert.equal(resolved.remediation?.validation.every(item => item.passed), true);
  assert.equal(resolved.remediation?.validation.find(item => item.control === "Source segments")?.after, "14 / 14");
  assert.equal(resolved.auditEvents.at(-1)?.eventType, "incident.closed");
  assert.deepEqual(await repository.getRun(initial.id), resolved);
});

test("HVB-2822 rejection remains safe and cannot execute recovery", async () => {
  const repository = new MemoryInvestigationRepository();
  const initial = await runInvestigation({ incidentId: "HVB-2822", repository });
  await requestMoreInvestigation({ repository, runId: initial.id });
  await decideApproval({ repository, runId: initial.id, decision: "rejected", scope: "recommendation", comment: "Use manual recovery." });
  await assert.rejects(() => executeSyntheticRemediation({ repository, runId: initial.id }), /approved recommendation/i);
});
