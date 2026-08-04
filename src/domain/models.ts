import { z } from "zod";

export const executableIncidentIdSchema = z.enum(["HVB-2847", "HVB-2829", "HVB-2822"]);
export type ExecutableIncidentId = z.infer<typeof executableIncidentIdSchema>;
export const severitySchema = z.enum(["Critical", "High", "Medium", "Low"]);
export const evidenceKindSchema = z.enum(["batch", "market_data", "reconciliation", "exposure", "policy", "runbook", "history", "trade", "log", "manifest", "mapping", "deadline"]);

export const evidenceSchema = z.object({
  id: z.string().min(1), kind: evidenceKindSchema, title: z.string().min(1), detail: z.string().min(1), source: z.string().min(1),
  signal: z.enum(["supports", "contradicts", "context"]), toolName: z.string().optional(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const batchRecordSchema = z.object({
  jobId: z.string(), status: z.enum(["SUCCEEDED", "FAILED", "PARTIAL", "RUNNING"]), completedAt: z.string().datetime(),
  dependencyStatuses: z.record(z.string(), z.enum(["SUCCEEDED", "FAILED", "PARTIAL", "RUNNING"])),
});
export type BatchRecord = z.infer<typeof batchRecordSchema>;

const commonIncidentFields = {
  title: z.string(), report: z.string(), area: z.string(), severity: severitySchema, businessDate: z.string(), owner: z.string(), description: z.string(), batch: batchRecordSchema,
};
export const marketDataRecordSchema = z.object({ recordId: z.string(), currencyPair: z.string(), rate: z.number().positive(), observedAt: z.string().datetime(), requiredFreshAfter: z.string().datetime(), source: z.string() });
export const positionExposureSchema = z.object({ positionId: z.string(), currencyPair: z.string(), exposureAud: z.number() });
export const reconciliationResultSchema = z.object({ controlId: z.string(), movementPercent: z.number(), concentrationPercent: z.number().min(0).max(100), passedPopulationControl: z.boolean() });

export const hvb2847InputSchema = z.object({
  id: z.literal("HVB-2847"), ...commonIncidentFields,
  marketData: z.array(marketDataRecordSchema).min(1), positions: z.array(positionExposureSchema).min(1), reconciliation: reconciliationResultSchema,
  policies: z.object({ freshnessThresholdMinutes: z.number().positive(), materialityExposureAud: z.number().positive(), requiredEvidenceKinds: z.array(evidenceKindSchema) }),
});
export type Hvb2847Input = z.infer<typeof hvb2847InputSchema>;

export const hvb2829InputSchema = z.object({
  id: z.literal("HVB-2829"), ...commonIncidentFields,
  pnl: z.object({ priorCrudePriceUsd: z.number().positive(), currentCrudePriceUsd: z.number().positive(), barrelsSensitivity: z.number(), audUsdRate: z.number().positive(), carryContributionAud: z.number(), newTradeContributionAud: z.number(), reportedPnlAud: z.number(), residualToleranceAud: z.number().nonnegative() }),
  tradePopulation: z.object({ expected: z.number().int().nonnegative(), actual: z.number().int().nonnegative() }),
  valuation: z.object({ observedAt: z.string().datetime(), requiredAfter: z.string().datetime() }),
  currencyConversion: z.object({ controlId: z.string(), sourceCurrency: z.literal("USD"), targetCurrency: z.literal("AUD"), ratePresent: z.boolean(), reconciled: z.boolean() }),
  policies: z.object({ reviewThresholdAud: z.number().positive(), materialityAud: z.number().positive(), requiredEvidenceKinds: z.array(evidenceKindSchema) }),
});
export type Hvb2829Input = z.infer<typeof hvb2829InputSchema>;

export const hvb2822InputSchema = z.object({
  id: z.literal("HVB-2822"), ...commonIncidentFields,
  regulatory: z.object({ deadline: z.string().datetime(), internalSignoffDeadline: z.string().datetime(), assessedAt: z.string().datetime() }),
  source: z.object({ readerTimeout: z.boolean(), timeoutSeconds: z.number().positive(), expectedSegments: z.number().int().positive(), receivedSegments: z.number().int().nonnegative(), manifestPresent: z.boolean() }),
  mapping: z.object({ controlId: z.string(), result: z.enum(["PASSED", "FAILED", "NOT_RUN", "INCONCLUSIVE"]) }),
  history: z.array(z.object({ incidentId: z.string(), similarity: z.string(), confirmedCause: z.string() })),
  escalationRoutes: z.array(z.string()).min(1),
  policies: z.object({ minimumConfidence: z.number().min(0).max(100), signoffRiskWindowMinutes: z.number().positive(), requiredEvidence: z.array(z.string()).min(1), requiredEvidenceKinds: z.array(evidenceKindSchema) }),
});
export type Hvb2822Input = z.infer<typeof hvb2822InputSchema>;

export const incidentInputSchema = z.discriminatedUnion("id", [hvb2847InputSchema, hvb2829InputSchema, hvb2822InputSchema]);
export type IncidentInput = z.infer<typeof incidentInputSchema>;

export const toolExecutionSchema = z.object({
  id: z.string(), investigationId: z.string(), toolName: z.string(), status: z.enum(["passed", "warning", "failed"]),
  derivedFacts: z.record(z.string(), z.unknown()), evidence: z.array(evidenceSchema), evidenceIds: z.array(z.string()), warnings: z.array(z.string()),
  startedAt: z.string().datetime(), completedAt: z.string().datetime(), durationMs: z.number().nonnegative(), error: z.string().nullable(),
});
export type ToolExecution = z.infer<typeof toolExecutionSchema>;

export const retrievalResultSchema = z.object({ documentId: z.string(), title: z.string(), version: z.string(), approved: z.boolean(), trust: z.enum(["approved_internal", "historical", "untrusted"]), relevanceScore: z.number().min(0), matchedTerms: z.array(z.string()), excerpt: z.string() });
export type RetrievalResult = z.infer<typeof retrievalResultSchema>;
export const rootCauseCandidateSchema = z.object({ cause: z.string().min(1), evidenceReferences: z.array(z.string()).min(1), confidence: z.number().min(0).max(100), factualClaims: z.array(z.string()).min(1) });
export const recommendationSchema = z.object({
  investigationId: z.string(), version: z.number().int().positive(), outcome: z.enum(["stale_market_data", "legitimate_business_movement", "unconfirmed_critical_cause", "insufficient_evidence", "no_issue"]),
  candidates: z.array(rootCauseCandidateSchema).min(1), confidence: z.number().min(0).max(100), uncertaintyExplanation: z.string(), contradictoryEvidence: z.array(z.string()), missingEvidence: z.array(z.string()),
  recommendedNextAction: z.string().min(1), actionEvidenceReferences: z.array(z.string()).min(1), escalationPath: z.string().min(1), prohibitedActionsDetected: z.array(z.string()), analystSummary: z.string().min(1), stakeholderSummary: z.string().min(1),
});
export type Recommendation = z.infer<typeof recommendationSchema>;
export const citationValidationSchema = z.object({ valid: z.boolean(), errors: z.array(z.string()), checkedEvidenceIds: z.array(z.string()) });
export type CitationValidation = z.infer<typeof citationValidationSchema>;

export const approvalScopeSchema = z.enum(["recommendation", "escalation_disposition"]);
export type ApprovalScope = z.infer<typeof approvalScopeSchema>;
export const policyDecisionSchema = z.object({
  investigationId: z.string(), result: z.enum(["approval_required", "fail_closed"]), passed: z.boolean(), rules: z.array(z.object({ rule: z.string(), passed: z.boolean(), detail: z.string() })),
  prohibitedActions: z.array(z.string()), approvalRequired: z.boolean(), permittedApprovalScope: approvalScopeSchema.default("recommendation"), operationalEffect: z.literal("none"), decidedAt: z.string().datetime(),
});
export type PolicyDecision = z.infer<typeof policyDecisionSchema>;
export const approvalDecisionSchema = z.object({
  id: z.string(), investigationId: z.string(), decision: z.enum(["approved", "rejected"]), scope: approvalScopeSchema.default("recommendation"), identity: z.literal("demo.support.analyst"), decidedAt: z.string().datetime(), recommendationVersion: z.number().int().positive(), policyResult: z.string(), evidenceIds: z.array(z.string()), comment: z.string().max(500).optional(),
});
export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;
export const auditEventSchema = z.object({ id: z.string(), investigationId: z.string(), sequence: z.number().int().positive(), eventType: z.string(), summary: z.string(), occurredAt: z.string().datetime(), metadata: z.record(z.string(), z.unknown()) });
export type AuditEvent = z.infer<typeof auditEventSchema>;
export const investigationRunSchema = z.object({
  id: z.string(), incidentId: executableIncidentIdSchema, status: z.enum(["running", "completed", "failed_closed"]), provider: z.string(), startedAt: z.string().datetime(), completedAt: z.string().datetime().nullable(),
  toolExecutions: z.array(toolExecutionSchema), evidence: z.array(evidenceSchema), retrievedDocuments: z.array(retrievalResultSchema), recommendation: recommendationSchema.nullable(), citationValidation: citationValidationSchema.nullable(), policyDecision: policyDecisionSchema.nullable(), approval: approvalDecisionSchema.nullable(), auditEvents: z.array(auditEventSchema),
});
export type InvestigationRun = z.infer<typeof investigationRunSchema>;

export const evaluationCaseSchema = z.object({
  id: z.string(), incidentId: executableIncidentIdSchema, expectedOutcome: recommendationSchema.shape.outcome, expectedEvidenceIds: z.array(z.string()), expectedEscalation: z.string(), expectedProhibitedActions: z.array(z.string()), expectedPolicyResult: z.string(), confidenceRange: z.tuple([z.number(), z.number()]), failClosedExpected: z.boolean(), expectedSummaryTerms: z.array(z.string()), expectedMissingEvidence: z.array(z.string()).default([]), expectedExposureAud: z.number().optional(),
});
export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;
export const evaluationResultSchema = z.object({ id: z.string(), caseId: z.string(), investigationId: z.string(), incidentId: executableIncidentIdSchema.default("HVB-2847"), outcome: recommendationSchema.shape.outcome.nullable().default(null), policyResult: z.string().default("unavailable"), failClosed: z.boolean().default(false), passed: z.boolean(), executedAt: z.string().datetime(), scores: z.record(z.string(), z.number().min(0).max(1)), failures: z.array(z.string()), measured: z.literal(true) });
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type InvestigationContext = { incident: IncidentInput; toolExecutions: ToolExecution[]; evidence: Evidence[]; retrievedDocuments: RetrievalResult[] };
