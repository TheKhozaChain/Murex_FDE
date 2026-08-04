import { hvb2847Input } from "../../data/incidents/hvb-2847";
import { executeDeterministicTools, type ToolRuntime } from "../deterministic/tools";
import type { AuditEvent, InvestigationContext, InvestigationRun, Recommendation } from "../domain/models";
import { applySafetyPolicy, canApprove } from "../policy/policy-engine";
import type { InvestigationRepository } from "../persistence/repository";
import { DeterministicMockSynthesiser } from "../providers/mock-synthesiser";
import type { InvestigationSynthesiser } from "../providers/synthesiser";
import { retrieveGuidance } from "../retrieval/local-retriever";
import { validateRecommendation } from "./citation-validator";

export type WorkflowRuntime = { now: () => string; id: () => string };
const defaultRuntime: WorkflowRuntime = { now: () => new Date().toISOString(), id: () => crypto.randomUUID() };

function audit(runtime: WorkflowRuntime, investigationId: string, sequence: number, eventType: string, summary: string, metadata: Record<string, unknown> = {}): AuditEvent {
  return { id: runtime.id(), investigationId, sequence, eventType, summary, occurredAt: runtime.now(), metadata };
}

export async function runInvestigation(options: {
  incidentId: string; repository: InvestigationRepository; synthesiser?: InvestigationSynthesiser; runtime?: WorkflowRuntime;
}): Promise<InvestigationRun> {
  if (options.incidentId !== "HVB-2847") throw new Error("Only HVB-2847 has an executable workflow in this milestone.");
  const runtime = options.runtime ?? defaultRuntime;
  const synthesiser = options.synthesiser ?? new DeterministicMockSynthesiser();
  await options.repository.initialise();
  await options.repository.seedIncident(hvb2847Input);
  const investigationId = runtime.id();
  const startedAt = runtime.now();
  let run: InvestigationRun = {
    id: investigationId, incidentId: options.incidentId, status: "running", provider: synthesiser.name, startedAt, completedAt: null,
    toolExecutions: [], evidence: [], retrievedDocuments: [], recommendation: null, citationValidation: null, policyDecision: null, approval: null,
    auditEvents: [audit(runtime, investigationId, 1, "investigation.started", "Server-side investigation created.", { incidentId: options.incidentId, provider: synthesiser.name })],
  };
  await options.repository.saveRun(run);

  const toolRuntime: ToolRuntime = { now: runtime.now, id: runtime.id };
  const toolExecutions = executeDeterministicTools(investigationId, hvb2847Input, toolRuntime);
  const evidence = toolExecutions.flatMap(tool => tool.evidence);
  run = { ...run, toolExecutions, evidence, auditEvents: [...run.auditEvents, audit(runtime, investigationId, 2, "tools.completed", `${toolExecutions.length} deterministic tools executed.`, { tools: toolExecutions.map(tool => ({ name: tool.toolName, status: tool.status, durationMs: tool.durationMs })) })] };

  const retrievedDocuments = retrieveGuidance();
  run = { ...run, retrievedDocuments, auditEvents: [...run.auditEvents, audit(runtime, investigationId, 3, "retrieval.completed", `${retrievedDocuments.length} attributable documents retrieved.`, { documents: retrievedDocuments.map(document => ({ id: document.documentId, score: document.relevanceScore, trust: document.trust })) })] };
  const context: InvestigationContext = { incident: hvb2847Input, toolExecutions, evidence, retrievedDocuments };

  let rawRecommendation: unknown;
  try { rawRecommendation = await synthesiser.synthesise(context); }
  catch { rawRecommendation = { malformed: true }; }
  const { recommendation, validation } = validateRecommendation(rawRecommendation, context);
  const now = runtime.now();
  const policyDecision = applySafetyPolicy({ investigationId, incident: hvb2847Input, tools: toolExecutions, recommendation, citationValidation: validation, now });
  const status = policyDecision.passed ? "completed" : "failed_closed";
  const completedAt = runtime.now();
  run = {
    ...run, status, completedAt, recommendation, citationValidation: validation, policyDecision,
    auditEvents: [
      ...run.auditEvents,
      audit(runtime, investigationId, 4, "synthesis.completed", `Structured synthesis returned from ${synthesiser.name}.`, { provider: synthesiser.name, outcome: recommendation?.outcome ?? "malformed" }),
      audit(runtime, investigationId, 5, "citation.validated", validation.valid ? "All evidence citations validated." : "Citation validation failed.", { valid: validation.valid, errors: validation.errors }),
      audit(runtime, investigationId, 6, "policy.decided", `Safety policy result: ${policyDecision.result}.`, { result: policyDecision.result, approvalRequired: policyDecision.approvalRequired, operationalEffect: "none" }),
    ],
  };
  await options.repository.saveRun(run);
  return run;
}

export async function decideApproval(options: {
  repository: InvestigationRepository; runId: string; decision: "approved" | "rejected"; comment?: string; runtime?: WorkflowRuntime;
}) {
  const runtime = options.runtime ?? defaultRuntime;
  await options.repository.initialise();
  const run = await options.repository.getRun(options.runId);
  if (!run || !run.policyDecision || !run.recommendation) throw new Error("Completed investigation recommendation not found.");
  const transition = canApprove(run.policyDecision, run.status, Boolean(run.approval));
  if (!transition.allowed) throw new Error(transition.reason);
  const evidenceIds = [...new Set([...run.recommendation.candidates.flatMap(candidate => candidate.evidenceReferences), ...run.recommendation.actionEvidenceReferences])];
  const approval = {
    id: runtime.id(), investigationId: run.id, decision: options.decision, identity: "demo.support.analyst" as const,
    decidedAt: runtime.now(), recommendationVersion: run.recommendation.version, policyResult: run.policyDecision.result, evidenceIds, comment: options.comment,
  };
  const event = audit(runtime, run.id, run.auditEvents.length + 1, "approval.recorded", `Recommendation ${options.decision} by clearly labelled demo identity.`, { decision: options.decision, identity: approval.identity, recommendationVersion: approval.recommendationVersion });
  const runWithEvent = { ...run, auditEvents: [...run.auditEvents, event] };
  await options.repository.saveApproval(runWithEvent, approval);
  return { ...runWithEvent, approval };
}

export function createUnsafeRecommendation(base: Recommendation, changes: Partial<Recommendation>): Recommendation {
  return { ...base, ...changes };
}
