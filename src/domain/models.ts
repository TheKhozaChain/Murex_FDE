import { z } from "zod";

export const severitySchema = z.enum(["Critical", "High", "Medium", "Low"]);
export const evidenceKindSchema = z.enum(["batch", "market_data", "reconciliation", "exposure", "policy", "runbook", "history"]);

export const evidenceSchema = z.object({
  id: z.string().min(1),
  kind: evidenceKindSchema,
  title: z.string().min(1),
  detail: z.string().min(1),
  source: z.string().min(1),
  signal: z.enum(["supports", "contradicts", "context"]),
  toolName: z.string().optional(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const batchRecordSchema = z.object({
  jobId: z.string(), status: z.enum(["SUCCEEDED", "FAILED", "PARTIAL", "RUNNING"]),
  completedAt: z.string().datetime(), dependencyStatuses: z.record(z.string(), z.enum(["SUCCEEDED", "FAILED", "PARTIAL", "RUNNING"])),
});
export type BatchRecord = z.infer<typeof batchRecordSchema>;

export const marketDataRecordSchema = z.object({
  recordId: z.string(), currencyPair: z.string(), rate: z.number().positive(), observedAt: z.string().datetime(),
  requiredFreshAfter: z.string().datetime(), source: z.string(),
});
export type MarketDataRecord = z.infer<typeof marketDataRecordSchema>;

export const positionExposureSchema = z.object({ positionId: z.string(), currencyPair: z.string(), exposureAud: z.number() });
export type PositionExposure = z.infer<typeof positionExposureSchema>;

export const reconciliationResultSchema = z.object({
  controlId: z.string(), movementPercent: z.number(), concentrationPercent: z.number().min(0).max(100), passedPopulationControl: z.boolean(),
});
export type ReconciliationResult = z.infer<typeof reconciliationResultSchema>;

export const incidentInputSchema = z.object({
  id: z.literal("HVB-2847"), title: z.string(), report: z.string(), area: z.string(), severity: severitySchema,
  businessDate: z.string(), owner: z.string(), description: z.string(),
  marketData: z.array(marketDataRecordSchema).min(1), positions: z.array(positionExposureSchema).min(1),
  batch: batchRecordSchema, reconciliation: reconciliationResultSchema,
  policies: z.object({ freshnessThresholdMinutes: z.number().positive(), materialityExposureAud: z.number().positive(), requiredEvidenceKinds: z.array(evidenceKindSchema) }),
});
export type IncidentInput = z.infer<typeof incidentInputSchema>;

export const toolExecutionSchema = z.object({
  id: z.string(), investigationId: z.string(), toolName: z.string(), status: z.enum(["passed", "warning", "failed"]),
  derivedFacts: z.record(z.string(), z.unknown()), evidence: z.array(evidenceSchema), evidenceIds: z.array(z.string()),
  warnings: z.array(z.string()), startedAt: z.string().datetime(), completedAt: z.string().datetime(), durationMs: z.number().nonnegative(),
  error: z.string().nullable(),
});
export type ToolExecution = z.infer<typeof toolExecutionSchema>;

export const retrievalResultSchema = z.object({
  documentId: z.string(), title: z.string(), version: z.string(), approved: z.boolean(),
  trust: z.enum(["approved_internal", "historical", "untrusted"]), relevanceScore: z.number().min(0),
  matchedTerms: z.array(z.string()), excerpt: z.string(),
});
export type RetrievalResult = z.infer<typeof retrievalResultSchema>;

export const rootCauseCandidateSchema = z.object({
  cause: z.string().min(1), evidenceReferences: z.array(z.string()).min(1), confidence: z.number().min(0).max(100), factualClaims: z.array(z.string()).min(1),
});
export type RootCauseCandidate = z.infer<typeof rootCauseCandidateSchema>;

export const recommendationSchema = z.object({
  investigationId: z.string(), version: z.number().int().positive(), outcome: z.enum(["stale_market_data", "insufficient_evidence", "no_issue"]),
  candidates: z.array(rootCauseCandidateSchema).min(1), confidence: z.number().min(0).max(100), uncertaintyExplanation: z.string(),
  contradictoryEvidence: z.array(z.string()), missingEvidence: z.array(z.string()), recommendedNextAction: z.string().min(1),
  actionEvidenceReferences: z.array(z.string()).min(1), escalationPath: z.string().min(1), prohibitedActionsDetected: z.array(z.string()),
  analystSummary: z.string().min(1), stakeholderSummary: z.string().min(1),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

export const citationValidationSchema = z.object({ valid: z.boolean(), errors: z.array(z.string()), checkedEvidenceIds: z.array(z.string()) });
export type CitationValidation = z.infer<typeof citationValidationSchema>;

export const policyDecisionSchema = z.object({
  investigationId: z.string(), result: z.enum(["approval_required", "fail_closed"]), passed: z.boolean(),
  rules: z.array(z.object({ rule: z.string(), passed: z.boolean(), detail: z.string() })),
  prohibitedActions: z.array(z.string()), approvalRequired: z.boolean(), operationalEffect: z.literal("none"), decidedAt: z.string().datetime(),
});
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;

export const approvalDecisionSchema = z.object({
  id: z.string(), investigationId: z.string(), decision: z.enum(["approved", "rejected"]), identity: z.literal("demo.support.analyst"),
  decidedAt: z.string().datetime(), recommendationVersion: z.number().int().positive(), policyResult: z.string(), evidenceIds: z.array(z.string()), comment: z.string().max(500).optional(),
});
export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;

export const auditEventSchema = z.object({
  id: z.string(), investigationId: z.string(), sequence: z.number().int().positive(), eventType: z.string(), summary: z.string(), occurredAt: z.string().datetime(), metadata: z.record(z.string(), z.unknown()),
});
export type AuditEvent = z.infer<typeof auditEventSchema>;

export const investigationRunSchema = z.object({
  id: z.string(), incidentId: z.string(), status: z.enum(["running", "completed", "failed_closed"]), provider: z.string(),
  startedAt: z.string().datetime(), completedAt: z.string().datetime().nullable(), toolExecutions: z.array(toolExecutionSchema),
  evidence: z.array(evidenceSchema), retrievedDocuments: z.array(retrievalResultSchema), recommendation: recommendationSchema.nullable(),
  citationValidation: citationValidationSchema.nullable(), policyDecision: policyDecisionSchema.nullable(), approval: approvalDecisionSchema.nullable(), auditEvents: z.array(auditEventSchema),
});
export type InvestigationRun = z.infer<typeof investigationRunSchema>;

export const evaluationCaseSchema = z.object({
  id: z.string(), incidentId: z.literal("HVB-2847"), expectedOutcome: z.literal("stale_market_data"), expectedExposureAud: z.number(),
  expectedEvidenceIds: z.array(z.string()), expectedEscalation: z.string(), expectedProhibitedActions: z.array(z.string()),
  expectedPolicyResult: z.string(), confidenceRange: z.tuple([z.number(), z.number()]), failClosedExpected: z.boolean(), expectedSummaryTerms: z.array(z.string()),
});
export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;

export const evaluationResultSchema = z.object({
  id: z.string(), caseId: z.string(), investigationId: z.string(), passed: z.boolean(), executedAt: z.string().datetime(),
  scores: z.record(z.string(), z.number().min(0).max(1)), failures: z.array(z.string()), measured: z.literal(true),
});
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export type InvestigationContext = {
  incident: IncidentInput;
  toolExecutions: ToolExecution[];
  evidence: Evidence[];
  retrievedDocuments: RetrievalResult[];
};

