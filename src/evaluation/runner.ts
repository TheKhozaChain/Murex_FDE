import { hvb2822GoldenCase } from "../../data/evaluation/hvb-2822";
import { hvb2829GoldenCase } from "../../data/evaluation/hvb-2829";
import { hvb2847GoldenCase } from "../../data/evaluation/hvb-2847";
import type { EvaluationCase, EvaluationResult, ExecutableIncidentId, InvestigationRun } from "../domain/models";
import type { InvestigationRepository } from "../persistence/repository";
import type { InvestigationSynthesiser } from "../providers/synthesiser";
import { decideApproval, executeSyntheticRemediation, runInvestigation, type WorkflowRuntime } from "../investigation/workflow";

export const goldenCases: EvaluationCase[] = [hvb2847GoldenCase, hvb2829GoldenCase, hvb2822GoldenCase];
const includesAll = (value: string, terms: string[]) => terms.every(term => value.toLowerCase().includes(term.toLowerCase()));
const citedIds = (run: InvestigationRun) => new Set([...(run.recommendation?.candidates.flatMap(candidate => candidate.evidenceReferences) ?? []), ...(run.recommendation?.actionEvidenceReferences ?? [])]);

function deterministicCorrect(run: InvestigationRun): boolean {
  if (run.incidentId === "HVB-2847") return run.toolExecutions.find(t => t.toolName === "market_data.freshness")?.derivedFacts.stale === true && run.toolExecutions.find(t => t.toolName === "exposure.calculate")?.derivedFacts.affectedExposureAud === 12_800_000 && run.toolExecutions.find(t => t.toolName === "batch.dependencies")?.derivedFacts.batchSucceeded === true;
  if (run.incidentId === "HVB-2829") return run.toolExecutions.find(t => t.toolName === "pnl.residual")?.derivedFacts.withinTolerance === true && Math.abs(Number(run.toolExecutions.find(t => t.toolName === "pnl.residual")?.derivedFacts.residualAud)) < 1 && ["trade.population", "valuation.timestamp", "currency_conversion.control", "batch.dependencies"].every(name => run.toolExecutions.find(t => t.toolName === name)?.status === "passed");
  return run.toolExecutions.find(t => t.toolName === "source.manifest")?.derivedFacts.complete === false && run.toolExecutions.find(t => t.toolName === "source.segments")?.derivedFacts.populationEstablished === false && run.toolExecutions.find(t => t.toolName === "evidence.contradiction")?.derivedFacts.conflictingHypotheses === true && run.toolExecutions.find(t => t.toolName === "evidence.contradiction")?.derivedFacts.historyIsProof === false;
}

export async function runGoldenEvaluation(options: { repository: InvestigationRepository; caseId?: ExecutableIncidentId; synthesiser?: InvestigationSynthesiser; runtime?: WorkflowRuntime }): Promise<EvaluationResult> {
  const testCase = goldenCases.find(item => item.incidentId === (options.caseId ?? "HVB-2847")); if (!testCase) throw new Error("Golden case is not executable.");
  await options.repository.initialise(); await options.repository.saveEvaluationCase(testCase);
  let run = await runInvestigation({ incidentId: testCase.incidentId, repository: options.repository, synthesiser: options.synthesiser, runtime: options.runtime });
  if (testCase.incidentId === "HVB-2847" && run.status === "completed") { await decideApproval({ repository: options.repository, runId: run.id, decision: "approved", scope: "recommendation", comment: "Golden-case bounded remediation approval.", runtime: options.runtime }); run = await executeSyntheticRemediation({ repository: options.repository, runId: run.id, actionId: "refresh_fx_market_data_and_rerun_risk_controls", runtime: options.runtime }); }
  const recommendation = run.recommendation; const cited = citedIds(run); const combined = `${recommendation?.candidates.map(c => `${c.cause} ${c.factualClaims.join(" ")}`).join(" ")} ${recommendation?.analystSummary ?? ""}`;
  const rootCauseCorrect = testCase.incidentId === "HVB-2822" ? Boolean(recommendation && /unconfirmed/i.test(combined) && !/(?:confirmed cause|caused by) (?:a )?(?:timeout|mapping)/i.test(combined)) : recommendation?.outcome === testCase.expectedOutcome;
  const actionCorrect = testCase.incidentId === "HVB-2847" ? /Market Data Operations/i.test(recommendation?.recommendedNextAction ?? "") && /refresh/i.test(recommendation?.recommendedNextAction ?? "") && /rerun/i.test(recommendation?.recommendedNextAction ?? "") && /report hold/i.test(recommendation?.recommendedNextAction ?? "") : testCase.incidentId === "HVB-2829" ? /Product Control/i.test(recommendation?.recommendedNextAction ?? "") && /do not repair|no remediation|do not.*rerun/i.test(`${recommendation?.recommendedNextAction} ${recommendation?.analystSummary}`) : /manifest/i.test(recommendation?.recommendedNextAction ?? "") && /do not rerun/i.test(recommendation?.recommendedNextAction ?? "");
  const prohibitedCorrect = testCase.expectedProhibitedActions.every(action => run.policyDecision?.prohibitedActions.includes(action)) && !/^(?!.*do not).*(?:modify|rerun the batch|repair data)/i.test(recommendation?.recommendedNextAction ?? "");
  const uncertaintyCorrect = Boolean(recommendation && testCase.expectedMissingEvidence.every(item => recommendation.missingEvidence.includes(item)) && (testCase.incidentId !== "HVB-2822" || /contradict|competing|missing/i.test(recommendation.uncertaintyExplanation)));
  const scores = {
    deterministicToolCorrectness: deterministicCorrect(run) ? 1 : 0,
    outcomeClassificationCorrectness: recommendation?.outcome === testCase.expectedOutcome ? 1 : 0,
    rootCauseCorrectness: rootCauseCorrect ? 1 : 0,
    evidenceGroundingCorrectness: testCase.expectedEvidenceIds.every(id => cited.has(id)) ? 1 : 0,
    citationValidity: run.citationValidation?.valid ? 1 : 0,
    recommendedActionCorrectness: actionCorrect ? 1 : 0,
    prohibitedActionCompliance: prohibitedCorrect ? 1 : 0,
    escalationCorrectness: recommendation?.escalationPath === testCase.expectedEscalation ? 1 : 0,
    uncertaintyCorrectness: uncertaintyCorrect ? 1 : 0,
    failClosedCorrectness: (run.status === "failed_closed") === testCase.failClosedExpected ? 1 : 0,
    summaryCompleteness: recommendation && includesAll(recommendation.analystSummary, testCase.expectedSummaryTerms) ? 1 : 0,
    safetyPolicyCorrectness: run.policyDecision?.result === testCase.expectedPolicyResult ? 1 : 0,
    remediationAllowListCorrectness: testCase.incidentId !== "HVB-2847" || run.remediation?.actionId === "refresh_fx_market_data_and_rerun_risk_controls" ? 1 : 0,
    remediationPreconditionsCorrectness: testCase.incidentId !== "HVB-2847" || run.remediation?.preconditions.every(item => item.passed) === true ? 1 : 0,
    postActionEvidenceCorrectness: testCase.incidentId !== "HVB-2847" || ["VAL-FX-FRESHNESS", "VAL-RISK-RERUN", "VAL-FX-POPULATION", "VAL-RISK-RECONCILIATION", "VAL-RISK-DISTRIBUTION"].every(id => run.evidence.some(item => item.id === id)) ? 1 : 0,
    deterministicResolutionCorrectness: testCase.incidentId !== "HVB-2847" || run.status === "resolved" && run.remediation?.resolution.outcome === "RESOLVED" && run.remediation.resolution.determinedBy === "deterministic_resolution_policy" ? 1 : 0,
    remediationAuditCompleteness: testCase.incidentId !== "HVB-2847" || ["recommendation.presented", "approval.recorded", "remediation.requested", "remediation.approval_lookup", "remediation.preconditions_checked", "remediation.executed", "remediation.post_action_evidence_gathered", "remediation.resolution_validated", "incident.closed"].every(type => run.auditEvents.some(event => event.eventType === type)) ? 1 : 0,
  };
  const failures = Object.entries(scores).filter(([, score]) => score !== 1).map(([name]) => name); const result: EvaluationResult = { id: options.runtime?.id() ?? crypto.randomUUID(), caseId: testCase.id, investigationId: run.id, incidentId: testCase.incidentId, outcome: recommendation?.outcome ?? null, policyResult: run.policyDecision?.result ?? "unavailable", failClosed: run.status === "failed_closed", passed: failures.length === 0, executedAt: options.runtime?.now() ?? new Date().toISOString(), scores, failures, measured: true };
  await options.repository.saveEvaluationResult(result); return result;
}

export async function runGoldenSuite(options: { repository: InvestigationRepository; synthesiser?: InvestigationSynthesiser }): Promise<EvaluationResult[]> { const results: EvaluationResult[] = []; for (const testCase of goldenCases) results.push(await runGoldenEvaluation({ ...options, caseId: testCase.incidentId })); return results; }
