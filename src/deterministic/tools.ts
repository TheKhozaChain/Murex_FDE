import { incidentInputSchema, type Evidence, type IncidentInput, type ToolExecution } from "../domain/models";

export type ToolRuntime = { now: () => string; id: () => string };
const defaultRuntime: ToolRuntime = { now: () => new Date().toISOString(), id: () => crypto.randomUUID() };

function execution(
  investigationId: string, toolName: string, status: ToolExecution["status"], derivedFacts: Record<string, unknown>,
  evidence: Evidence[], warnings: string[] = [], error: string | null = null, runtime = defaultRuntime,
): ToolExecution {
  const startedAt = runtime.now();
  return { id: runtime.id(), investigationId, toolName, status, derivedFacts, evidence, evidenceIds: evidence.map(item => item.id), warnings, startedAt, completedAt: runtime.now(), durationMs: 0, error };
}

export function validateIncidentPayload(investigationId: string, raw: unknown, runtime?: ToolRuntime): ToolExecution {
  const parsed = incidentInputSchema.safeParse(raw);
  if (!parsed.success) return execution(investigationId, "incident.validate", "failed", { valid: false }, [], parsed.error.issues.map(issue => issue.message), "Incident payload failed schema validation", runtime);
  const evidence: Evidence = { id: "EV-PAYLOAD-VALID", kind: "policy", title: "Incident payload validated", detail: "The server-owned HVB-2847 payload passed the runtime schema.", source: "incident.validate", signal: "context", toolName: "incident.validate" };
  return execution(investigationId, "incident.validate", "passed", { valid: true, incidentId: parsed.data.id, fieldCount: Object.keys(parsed.data).length }, [evidence], [], null, runtime);
}

export function validateMarketDataFreshness(investigationId: string, incident: IncidentInput, runtime?: ToolRuntime): ToolExecution {
  const record = incident.marketData.find(item => item.currencyPair === "USD/JPY")!;
  const ageAtThresholdMinutes = (Date.parse(record.requiredFreshAfter) - Date.parse(record.observedAt)) / 60_000;
  const stale = Date.parse(record.observedAt) < Date.parse(record.requiredFreshAfter);
  const evidence: Evidence = {
    id: "EV-MD-FRESHNESS", kind: "market_data", title: `${record.currencyPair} freshness ${stale ? "breach" : "pass"}`,
    detail: `${record.currencyPair} observed at ${record.observedAt}; required after ${record.requiredFreshAfter}. Age at threshold ${ageAtThresholdMinutes} minutes.`,
    source: record.recordId, signal: stale ? "supports" : "context", toolName: "market_data.freshness",
  };
  return execution(investigationId, "market_data.freshness", stale ? "warning" : "passed", { stale, currencyPair: record.currencyPair, observedAt: record.observedAt, requiredFreshAfter: record.requiredFreshAfter, ageAtThresholdMinutes }, [evidence], stale ? ["Market observation breaches the configured freshness boundary."] : [], null, runtime);
}

export function calculateAffectedExposure(investigationId: string, incident: IncidentInput, runtime?: ToolRuntime): ToolExecution {
  const currencyPair = incident.marketData[0].currencyPair;
  const sensitivePositions = incident.positions.filter(position => position.currencyPair === currencyPair);
  const affectedExposureAud = sensitivePositions.reduce((total, position) => total + Math.abs(position.exposureAud), 0);
  const evidence: Evidence = {
    id: "EV-AFFECTED-EXPOSURE", kind: "exposure", title: "Affected FX exposure calculated",
    detail: `${sensitivePositions.length} ${currencyPair}-sensitive positions total AUD ${affectedExposureAud.toLocaleString("en-AU")}.`,
    source: "exposure.calculate", signal: "supports", toolName: "exposure.calculate",
  };
  const reconciliationEvidence: Evidence = {
    id: "EV-RECONCILIATION", kind: "reconciliation", title: "FX movement concentration reconciled",
    detail: `${incident.reconciliation.concentrationPercent}% of the reported movement is concentrated in ${currencyPair}-sensitive positions; population control ${incident.reconciliation.passedPopulationControl ? "passed" : "failed"}.`,
    source: incident.reconciliation.controlId, signal: "supports", toolName: "exposure.calculate",
  };
  return execution(investigationId, "exposure.calculate", "passed", { currencyPair, positionCount: sensitivePositions.length, affectedExposureAud, positionIds: sensitivePositions.map(position => position.positionId), concentrationPercent: incident.reconciliation.concentrationPercent }, [evidence, reconciliationEvidence], [], null, runtime);
}

export function validateBatchDependencies(investigationId: string, incident: IncidentInput, runtime?: ToolRuntime): ToolExecution {
  const failedDependencies = Object.entries(incident.batch.dependencyStatuses).filter(([, status]) => status !== "SUCCEEDED").map(([name]) => name);
  const succeeded = incident.batch.status === "SUCCEEDED" && failedDependencies.length === 0;
  const evidence: Evidence = {
    id: "EV-BATCH-STATUS", kind: "batch", title: `Batch ${incident.batch.status.toLowerCase()}`,
    detail: `${incident.batch.jobId} completed ${incident.batch.status} at ${incident.batch.completedAt}; ${failedDependencies.length} non-successful dependencies.`,
    source: incident.batch.jobId, signal: "context", toolName: "batch.dependencies",
  };
  return execution(investigationId, "batch.dependencies", succeeded ? "passed" : "warning", { batchSucceeded: succeeded, batchStatus: incident.batch.status, failedDependencies }, [evidence], succeeded ? [] : ["One or more batch dependencies did not succeed."], null, runtime);
}

export function checkSeverityAndMateriality(investigationId: string, incident: IncidentInput, affectedExposureAud: number, runtime?: ToolRuntime): ToolExecution {
  const material = affectedExposureAud >= incident.policies.materialityExposureAud;
  const requiresEscalation = incident.severity === "Critical" || incident.severity === "High" || material;
  const evidence: Evidence = {
    id: "EV-MATERIALITY", kind: "policy", title: "Materiality policy evaluated",
    detail: `AUD ${affectedExposureAud.toLocaleString("en-AU")} affected exposure is ${material ? "above" : "below"} the AUD ${incident.policies.materialityExposureAud.toLocaleString("en-AU")} threshold; severity is ${incident.severity}.`,
    source: "HVB synthetic materiality policy v1", signal: "supports", toolName: "policy.materiality",
  };
  return execution(investigationId, "policy.materiality", material ? "warning" : "passed", { severity: incident.severity, material, requiresEscalation, affectedExposureAud, thresholdAud: incident.policies.materialityExposureAud }, [evidence], material ? ["Materiality threshold exceeded; accountable approval is required."] : [], null, runtime);
}

export function checkRequiredEvidence(investigationId: string, incident: IncidentInput, existingEvidence: Evidence[], runtime?: ToolRuntime): ToolExecution {
  const kinds = new Set(existingEvidence.map(item => item.kind));
  const missingKinds = incident.policies.requiredEvidenceKinds.filter(kind => !kinds.has(kind));
  const complete = missingKinds.length === 0;
  const evidence: Evidence = {
    id: "EV-EVIDENCE-COMPLETE", kind: "policy", title: `Required evidence ${complete ? "complete" : "incomplete"}`,
    detail: complete ? `All required evidence kinds are present: ${incident.policies.requiredEvidenceKinds.join(", ")}.` : `Missing evidence kinds: ${missingKinds.join(", ")}.`,
    source: "evidence.completeness", signal: complete ? "context" : "contradicts", toolName: "evidence.completeness",
  };
  return execution(investigationId, "evidence.completeness", complete ? "passed" : "failed", { complete, missingKinds, presentKinds: [...kinds] }, [evidence], complete ? [] : ["Required evidence is missing; fail closed."], complete ? null : "Required evidence incomplete", runtime);
}

export function executeDeterministicTools(investigationId: string, incident: IncidentInput, runtime?: ToolRuntime): ToolExecution[] {
  const validation = validateIncidentPayload(investigationId, incident, runtime);
  if (validation.status === "failed") return [validation];
  const freshness = validateMarketDataFreshness(investigationId, incident, runtime);
  const exposure = calculateAffectedExposure(investigationId, incident, runtime);
  const dependency = validateBatchDependencies(investigationId, incident, runtime);
  const materiality = checkSeverityAndMateriality(investigationId, incident, Number(exposure.derivedFacts.affectedExposureAud), runtime);
  const evidenceBeforeCompleteness = [validation, freshness, exposure, dependency, materiality].flatMap(item => item.evidence);
  const completeness = checkRequiredEvidence(investigationId, incident, evidenceBeforeCompleteness, runtime);
  return [validation, freshness, exposure, dependency, materiality, completeness];
}
