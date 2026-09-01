import { executeDeterministicTools, gatherHvb2822SupplementalEvidence, type ToolRuntime } from "../deterministic/tools";
import type { ApprovalScope, AuditEvent, ExecutableIncidentId, InvestigationContext, InvestigationRun, Recommendation } from "../domain/models";
import { applySafetyPolicy, canApprove } from "../policy/policy-engine";
import type { InvestigationRepository } from "../persistence/repository";
import { DeterministicMockSynthesiser } from "../providers/mock-synthesiser";
import type { InvestigationSynthesiser } from "../providers/synthesiser";
import { retrieveGuidance } from "../retrieval/local-retriever";
import { validateRecommendation } from "./citation-validator";
import { getScenarioInput } from "./scenario-registry";

export type WorkflowRuntime = { now: () => string; id: () => string };
const defaultRuntime: WorkflowRuntime = { now: () => new Date().toISOString(), id: () => crypto.randomUUID() };

function audit(runtime: WorkflowRuntime, investigationId: string, sequence: number, eventType: string, summary: string, metadata: Record<string, unknown> = {}): AuditEvent {
  return { id: runtime.id(), investigationId, sequence, eventType, summary, occurredAt: runtime.now(), metadata };
}

export async function runInvestigation(options: {
  incidentId: ExecutableIncidentId; repository: InvestigationRepository; synthesiser?: InvestigationSynthesiser; runtime?: WorkflowRuntime;
}): Promise<InvestigationRun> {
  const runtime = options.runtime ?? defaultRuntime;
  const synthesiser = options.synthesiser ?? new DeterministicMockSynthesiser();
  const incident = getScenarioInput(options.incidentId);
  await options.repository.initialise();
  await options.repository.seedIncident(incident);
  const investigationId = runtime.id();
  const startedAt = runtime.now();
  let run: InvestigationRun = {
    id: investigationId, incidentId: options.incidentId, status: "running", provider: synthesiser.name, startedAt, completedAt: null,
    toolExecutions: [], evidence: [], retrievedDocuments: [], recommendation: null, citationValidation: null, policyDecision: null, approval: null, remediation: null,
    auditEvents: [audit(runtime, investigationId, 1, "investigation.started", "Server-side investigation created.", { incidentId: options.incidentId, provider: synthesiser.name })],
  };
  await options.repository.saveRun(run);

  const toolRuntime: ToolRuntime = { now: runtime.now, id: runtime.id };
  const toolExecutions = executeDeterministicTools(investigationId, incident, toolRuntime);
  const evidence = toolExecutions.flatMap(tool => tool.evidence);
  run = { ...run, toolExecutions, evidence, auditEvents: [...run.auditEvents, audit(runtime, investigationId, 2, "tools.completed", `${toolExecutions.length} deterministic tools executed.`, { tools: toolExecutions.map(tool => ({ name: tool.toolName, status: tool.status, durationMs: tool.durationMs })) })] };

  const retrievedDocuments = retrieveGuidance(options.incidentId);
  run = { ...run, retrievedDocuments, auditEvents: [...run.auditEvents, audit(runtime, investigationId, 3, "retrieval.completed", `${retrievedDocuments.length} attributable documents retrieved.`, { documents: retrievedDocuments.map(document => ({ id: document.documentId, score: document.relevanceScore, trust: document.trust })) })] };
  const context: InvestigationContext = { incident, toolExecutions, evidence, retrievedDocuments };

  let rawRecommendation: unknown;
  try { rawRecommendation = await synthesiser.synthesise(context); }
  catch { rawRecommendation = { malformed: true }; }
  const { recommendation, validation } = validateRecommendation(rawRecommendation, context);
  const now = runtime.now();
  const policyDecision = applySafetyPolicy({ investigationId, incident, tools: toolExecutions, recommendation, citationValidation: validation, now });
  const status = policyDecision.passed ? "completed" : "failed_closed";
  const completedAt = runtime.now();
  run = {
    ...run, status, completedAt, recommendation, citationValidation: validation, policyDecision,
    auditEvents: [
      ...run.auditEvents,
      audit(runtime, investigationId, 4, "synthesis.completed", `Structured synthesis returned from ${synthesiser.name}.`, { provider: synthesiser.name, outcome: recommendation?.outcome ?? "malformed" }),
      audit(runtime, investigationId, 5, "citation.validated", validation.valid ? "All evidence citations validated." : "Citation validation failed.", { valid: validation.valid, errors: validation.errors }),
      audit(runtime, investigationId, 6, "policy.decided", `Safety policy result: ${policyDecision.result}.`, { result: policyDecision.result, approvalRequired: policyDecision.approvalRequired, operationalEffect: "none" }),
      audit(runtime, investigationId, 7, "recommendation.presented", recommendation ? `Recommendation v${recommendation.version} presented with ${recommendation.confidence}% confidence.` : "No recommendation presented because validation failed.", { actor: "workbench.orchestrator", recommendationVersion: recommendation?.version, evidenceIds: validation.checkedEvidenceIds, outcome: recommendation?.outcome ?? "fail_closed" }),
    ],
  };
  await options.repository.saveRun(run);
  return run;
}

export async function requestMoreInvestigation(options: { repository: InvestigationRepository; runId: string; comment?: string; synthesiser?: InvestigationSynthesiser; runtime?: WorkflowRuntime }) {
  const runtime = options.runtime ?? defaultRuntime;
  const synthesiser = options.synthesiser ?? new DeterministicMockSynthesiser();
  await options.repository.initialise();
  const run = await options.repository.getRun(options.runId);
  if (!run || run.incidentId !== "HVB-2822" || !run.recommendation || !run.policyDecision) throw new Error("Flagship investigation is not ready for evidence expansion.");
  if (run.approval || run.toolExecutions.some(item => item.toolName === "interface.delivery")) throw new Error("Additional investigation has already been completed or decided.");
  const incident = getScenarioInput("HVB-2822");
  if (incident.id !== "HVB-2822") throw new Error("Flagship investigation is not ready for evidence expansion.");
  const supplementalTools = gatherHvb2822SupplementalEvidence(run.id, incident, { now: runtime.now, id: runtime.id });
  const toolExecutions = [...run.toolExecutions, ...supplementalTools];
  const evidence = [...run.evidence, ...supplementalTools.flatMap(item => item.evidence)];
  const context: InvestigationContext = { incident, toolExecutions, evidence, retrievedDocuments: run.retrievedDocuments };
  const rawRecommendation = await synthesiser.synthesise(context);
  const { recommendation, validation } = validateRecommendation(rawRecommendation, context);
  const policyDecision = applySafetyPolicy({ investigationId: run.id, incident, tools: toolExecutions, recommendation, citationValidation: validation, now: runtime.now() });
  const next: InvestigationRun = {
    ...run, status: policyDecision.passed ? "completed" : "failed_closed", completedAt: runtime.now(), toolExecutions, evidence, recommendation, citationValidation: validation, policyDecision,
    auditEvents: [
      ...run.auditEvents,
      audit(runtime, run.id, run.auditEvents.length + 1, "investigation.more_evidence_requested", "Reviewer requested more investigation; no action was authorised.", { actor: "demo.support.analyst", comment: options.comment ?? "Evidence is insufficient to approve remediation." }),
      audit(runtime, run.id, run.auditEvents.length + 2, "evidence.supplemented", "Manifest, transfer, current mapping, change, and volume evidence collected.", { tools: supplementalTools.map(item => item.toolName), evidenceIds: supplementalTools.flatMap(item => item.evidenceIds) }),
      audit(runtime, run.id, run.auditEvents.length + 3, "hypotheses.reassessed", "Upstream non-delivery ranked as probable cause; mapping and reader-failure hypotheses ruled out.", { outcome: recommendation?.outcome, confidence: recommendation?.confidence, version: recommendation?.version }),
      audit(runtime, run.id, run.auditEvents.length + 4, "policy.reassessed", `Safety policy result after evidence expansion: ${policyDecision.result}.`, { result: policyDecision.result, permittedApprovalScope: policyDecision.permittedApprovalScope }),
    ],
  };
  await options.repository.saveRun(next);
  return next;
}

export async function decideApproval(options: {
  repository: InvestigationRepository; runId: string; decision: "approved" | "rejected"; scope?: ApprovalScope; comment?: string; runtime?: WorkflowRuntime;
}) {
  const runtime = options.runtime ?? defaultRuntime;
  await options.repository.initialise();
  const run = await options.repository.getRun(options.runId);
  if (!run || !run.policyDecision || !run.recommendation) throw new Error("Completed investigation recommendation not found.");
  const scope = options.scope ?? "recommendation";
  const transition = canApprove(run.policyDecision, run.status, Boolean(run.approval), options.decision, scope);
  if (!transition.allowed) throw new Error(transition.reason);
  const evidenceIds = [...new Set([...run.recommendation.candidates.flatMap(candidate => candidate.evidenceReferences), ...run.recommendation.actionEvidenceReferences])];
  const approval = {
    id: runtime.id(), investigationId: run.id, decision: options.decision, scope, identity: "demo.support.analyst" as const,
    decidedAt: runtime.now(), recommendationVersion: run.recommendation.version, policyResult: run.policyDecision.result, evidenceIds, comment: options.comment,
  };
  const event = audit(runtime, run.id, run.auditEvents.length + 1, "approval.recorded", `${scope === "escalation_disposition" ? "Escalation disposition" : "Recommendation"} ${options.decision} by clearly labelled demo identity.`, { decision: options.decision, scope, identity: approval.identity, recommendationVersion: approval.recommendationVersion });
  const runWithEvent = { ...run, auditEvents: [...run.auditEvents, event] };
  await options.repository.saveApproval(runWithEvent, approval);
  return { ...runWithEvent, approval };
}

export async function executeSyntheticRemediation(options: { repository: InvestigationRepository; runId: string; actionId?: string; simulationOutcome?: "success" | "validation_failure"; runtime?: WorkflowRuntime }) {
  const runtime = options.runtime ?? defaultRuntime;
  await options.repository.initialise();
  const loadedRun = await options.repository.getRun(options.runId);
  if (!loadedRun) throw new Error("Approved synthetic recovery is not available.");
  const run: InvestigationRun = loadedRun;
  const allowedAction = run.incidentId === "HVB-2847" ? "refresh_fx_market_data_and_rerun_risk_controls" : run.incidentId === "HVB-2822" ? "reingest_liquidity_segment_and_resume_datamart" : null;
  const actionId = options.actionId ?? allowedAction;
  async function reject(reason: string): Promise<never> {
    const rejected = { ...run, auditEvents: [...run.auditEvents, audit(runtime, run.id, run.auditEvents.length + 1, "remediation.precondition_rejected", `Synthetic remediation rejected: ${reason}`, { actor: "action.policy", actionId, outcome: "fail_closed" })] };
    await options.repository.saveRun(rejected); throw new Error(reason);
  }
  if (run.remediation) return reject("Synthetic recovery has already executed.");
  if (!allowedAction || actionId !== allowedAction) return reject("Requested remediation action is not allow-listed for this incident.");
  if (run.status !== "completed" || !run.recommendation || !run.citationValidation || !run.policyDecision) return reject("Approved synthetic recovery is not available.");
  if (!run.citationValidation.valid || !run.policyDecision.passed || run.policyDecision.result !== "approval_required") return reject("Citation or policy state does not permit remediation.");
  if (run.toolExecutions.findLast(item => item.toolName === "evidence.completeness")?.derivedFacts.complete !== true) return reject("Required evidence is incomplete.");
  if (run.approval?.decision !== "approved" || run.approval.scope !== "recommendation") return reject("An approved recommendation is required before recovery.");
  if (run.approval.recommendationVersion !== run.recommendation.version) return reject("Approval does not match the current recommendation version.");
  if (run.recommendation.confidence < 70) return reject("Recommendation confidence is below the action threshold.");
  if (run.incidentId === "HVB-2847" && run.recommendation.outcome !== "stale_market_data") return reject("Recommendation outcome does not permit the FX recovery action.");
  if (run.incidentId === "HVB-2822" && run.recommendation.outcome !== "upstream_interface_delivery_failure") return reject("Recommendation outcome does not permit the liquidity recovery action.");

  const incident = getScenarioInput(run.incidentId); const requestedAt = runtime.now(); const authorisedAt = run.approval.decidedAt; const executedAt = runtime.now(); const completedAt = runtime.now(); const validationFailure = options.simulationOutcome === "validation_failure";
  const preconditions = [
    { check: "citation_and_fact_validation", passed: run.citationValidation.valid, detail: "Current recommendation citations resolve to the persisted evidence snapshot." },
    { check: "policy_permission", passed: run.policyDecision.passed, detail: "Policy result is approval_required and permits recommendation scope." },
    { check: "human_approval", passed: true, detail: `${run.approval.identity} approved recommendation v${run.approval.recommendationVersion}.` },
    { check: "allow_list", passed: true, detail: `${actionId} is the sole action allowed for ${run.incidentId}.` },
    { check: "idempotency", passed: true, detail: "No prior execution record exists for this investigation." },
    { check: "confidence_threshold", passed: true, detail: `${run.recommendation.confidence}% meets the 70% action threshold.` },
  ];
  let validation; let steps; let action: string;
  if (incident.id === "HVB-2847") {
    const original = incident.marketData[0]; const refreshedAt = validationFailure ? original.observedAt : incident.recoverySimulation.refreshedObservedAt;
    const freshnessPassed = Date.parse(refreshedAt) >= Date.parse(original.requiredFreshAfter);
    preconditions.push({ check: "approved_source_confirmation", passed: true, detail: `${incident.recoverySimulation.sourceConfirmationId} confirms the bounded synthetic source refresh.` }, { check: "distribution_hold", passed: incident.recoverySimulation.reportDistributionInitiallyHeld, detail: "Daily Market Risk distribution remains held during recovery." });
    action = "Refresh the approved synthetic USD/JPY observation, rerun the affected APAC market-data and risk controls, then reconcile before releasing the report hold.";
    steps = [
      { order: 1, action: "Verify Market Data Operations source confirmation and distribution hold", result: `${incident.recoverySimulation.sourceConfirmationId} verified; report held`, status: "passed" as const },
      { order: 2, action: "Publish the approved USD/JPY observation to isolated synthetic staging", result: validationFailure ? "Injected validation-failure fixture retained stale timestamp" : `USD/JPY ${incident.recoverySimulation.refreshedRate} at ${refreshedAt}`, status: "passed" as const },
      { order: 3, action: "Run scoped MARKET_DATA_APAC → RISK_APAC controls", result: `${incident.recoverySimulation.riskBatchJobId} completed in simulator`, status: "passed" as const },
      { order: 4, action: "Gather fresh timestamp, batch, reconciliation, and distribution evidence", result: "Post-action evidence packet persisted", status: "passed" as const },
    ];
    validation = [
      { control: "USD/JPY freshness", before: `${original.observedAt} · STALE`, after: `${refreshedAt} · ${freshnessPassed ? "CURRENT" : "STALE"}`, passed: freshnessPassed, evidenceId: "VAL-FX-FRESHNESS" },
      { control: "Scoped APAC risk rerun", before: `${incident.batch.jobId} · original`, after: `${incident.recoverySimulation.riskBatchJobId} · SUCCEEDED`, passed: true, evidenceId: "VAL-RISK-RERUN" },
      { control: "Exposure population", before: "Population control PASSED", after: "Population control PASSED", passed: incident.reconciliation.passedPopulationControl, evidenceId: "VAL-FX-POPULATION" },
      { control: "Risk reconciliation", before: "18.4% exception · report held", after: validationFailure ? "18.4% exception · unresolved" : `${incident.recoverySimulation.expectedReconciliationStatus} · refreshed input reconciled`, passed: !validationFailure, evidenceId: "VAL-RISK-RECONCILIATION" },
      { control: "Report distribution", before: "HELD", after: validationFailure ? "HELD · escalation required" : "RELEASED after controls", passed: !validationFailure, evidenceId: "VAL-RISK-DISTRIBUTION" },
    ];
  } else if (incident.id === "HVB-2822") {
    action = "Scoped re-ingestion of LIQ_POS_14.csv and resume of the synthetic LCR Datamart chain from SOURCE_READER.";
    steps = [
      { order: 1, action: "Validate manifest, checksum, schema, business date, and duplicate state", result: "All preconditions passed", status: "passed" as const },
      { order: 2, action: "Re-ingest only LIQ_POS_14.csv into isolated synthetic staging", result: "Segment accepted; no duplicate keys", status: "passed" as const },
      { order: 3, action: "Resume SOURCE_READER → MAPPING_VALIDATION → LCR_DATAMART", result: "Scoped chain completed", status: "passed" as const },
      { order: 4, action: "Gather population, mapping, render, and SLA evidence", result: "Post-action evidence packet persisted", status: "passed" as const },
    ];
    validation = [
      { control: "Source segments", before: "13 / 14", after: validationFailure ? "13 / 14" : "14 / 14", passed: !validationFailure, evidenceId: "VAL-SEGMENTS-14" },
      { control: "Datamart population", before: `${incident.supplementalEvidence.partialRows.toLocaleString("en-AU")} rows`, after: validationFailure ? `${incident.supplementalEvidence.partialRows.toLocaleString("en-AU")} rows` : `${incident.supplementalEvidence.expectedRows.toLocaleString("en-AU")} rows`, passed: !validationFailure, evidenceId: "VAL-DATAMART-ROWS" },
      { control: "Mapping control", before: "INCONCLUSIVE", after: "PASSED", passed: true, evidenceId: "VAL-MAPPING-PASS" },
      { control: "LCR report render", before: "BLOCKED", after: validationFailure ? "BLOCKED" : "SUCCEEDED", passed: !validationFailure, evidenceId: "VAL-REPORT-SUCCESS" },
      { control: "SLA / alert", before: "AT RISK / ACTIVE", after: validationFailure ? "BREACHED / ACTIVE" : "RECOVERED / CLEARED", passed: !validationFailure, evidenceId: "VAL-SLA-CLEARED" },
    ];
  } else return reject("Requested remediation action is not allow-listed for this incident.");
  const failedPreconditions = preconditions.filter(item => !item.passed).map(item => item.check); if (failedPreconditions.length) return reject(`Action preconditions failed: ${failedPreconditions.join(", ")}.`);
  const failedControls = validation.filter(item => !item.passed).map(item => item.control); const resolved = failedControls.length === 0;
  const resolution = { outcome: resolved ? "RESOLVED" as const : "VALIDATION_FAILED" as const, determinedBy: "deterministic_resolution_policy" as const, failedControls, detail: resolved ? "Every required post-action control passed; deterministic closure is permitted." : `Validation failed for: ${failedControls.join(", ")}. Incident remains open and requires escalation.` };
  const remediation = { mode: "synthetic_simulation" as const, status: "validated" as const, executionId: runtime.id(), incidentId: run.incidentId, recommendationVersion: run.recommendation.version, actionId: actionId as "refresh_fx_market_data_and_rerun_risk_controls" | "reingest_liquidity_segment_and_resume_datamart", approvingActor: run.approval.identity, executingActor: "synthetic.remediation.executor", traceRunId: run.id, requestedAt, authorisedAt, executedAt, completedAt, preconditions, action, steps, validation, rollbackAvailable: true, resolution };
  const validationEvidence = validation.map(item => ({ id: item.evidenceId, kind: "reconciliation" as const, title: `${item.control} validation`, detail: `${item.before} → ${item.after}. Control ${item.passed ? "passed" : "failed"}.`, source: "Synthetic post-remediation control", signal: item.passed ? "supports" as const : "contradicts" as const, toolName: "remediation.validate", observedAt: completedAt, relevance: "Deterministically decides whether the approved recovery restored the incident outcome." }));
  const baseSequence = run.auditEvents.length;
  const next: InvestigationRun = { ...run, status: resolved ? "resolved" : "requires_escalation", completedAt, remediation, evidence: [...run.evidence, ...validationEvidence], auditEvents: [
    ...run.auditEvents,
    audit(runtime, run.id, baseSequence + 1, "remediation.requested", `Allow-listed synthetic action ${actionId} requested.`, { actor: "demo.support.analyst", actionId, recommendationVersion: run.recommendation.version, executionId: remediation.executionId }),
    audit(runtime, run.id, baseSequence + 2, "remediation.approval_lookup", "Current human approval loaded and matched to the recommendation version.", { actor: "action.policy", approvalId: run.approval.id, approvingActor: run.approval.identity, recommendationVersion: run.approval.recommendationVersion }),
    audit(runtime, run.id, baseSequence + 3, "remediation.preconditions_checked", `${preconditions.length} deterministic action preconditions passed.`, { actor: "action.policy", actionId, preconditions, outcome: "passed" }),
    audit(runtime, run.id, baseSequence + 4, "remediation.executed", "Bounded synthetic remediation executed; no production system was contacted.", { actor: remediation.executingActor, executionId: remediation.executionId, steps, operationalEffect: "synthetic_only" }),
    audit(runtime, run.id, baseSequence + 5, "remediation.post_action_evidence_gathered", `${validationEvidence.length} fresh deterministic validation records persisted.`, { actor: "deterministic.validation", evidenceIds: validationEvidence.map(item => item.id), executionId: remediation.executionId }),
    audit(runtime, run.id, baseSequence + 6, "remediation.resolution_validated", `Deterministic resolution outcome: ${resolution.outcome}.`, { actor: "deterministic_resolution_policy", outcome: resolution.outcome, failedControls, executionId: remediation.executionId }),
    audit(runtime, run.id, baseSequence + 7, resolved ? "incident.closed" : "incident.escalated", resolved ? "Incident resolved only after every post-action control passed." : "Incident remains open; failed post-action controls require escalation.", { actor: "workflow.state_machine", outcome: resolution.outcome, evidenceIds: validationEvidence.map(item => item.id) }),
  ] };
  await options.repository.saveRun(next); return next;
}

export function createUnsafeRecommendation(base: Recommendation, changes: Partial<Recommendation>): Recommendation {
  return { ...base, ...changes };
}
