import { hvb2847GoldenCase } from "../../data/evaluation/hvb-2847";
import type { EvaluationResult } from "../domain/models";
import type { InvestigationRepository } from "../persistence/repository";
import type { InvestigationSynthesiser } from "../providers/synthesiser";
import { runInvestigation, type WorkflowRuntime } from "../investigation/workflow";

const includesAll = (value: string, terms: string[]) => terms.every(term => value.toLowerCase().includes(term.toLowerCase()));

export async function runGoldenEvaluation(options: { repository: InvestigationRepository; synthesiser?: InvestigationSynthesiser; runtime?: WorkflowRuntime }): Promise<EvaluationResult> {
  await options.repository.initialise();
  await options.repository.saveEvaluationCase(hvb2847GoldenCase);
  const run = await runInvestigation({ incidentId: hvb2847GoldenCase.incidentId, repository: options.repository, synthesiser: options.synthesiser, runtime: options.runtime });
  const freshness = run.toolExecutions.find(tool => tool.toolName === "market_data.freshness");
  const exposure = run.toolExecutions.find(tool => tool.toolName === "exposure.calculate");
  const batch = run.toolExecutions.find(tool => tool.toolName === "batch.dependencies");
  const recommendation = run.recommendation;
  const cited = new Set([...(recommendation?.candidates.flatMap(candidate => candidate.evidenceReferences) ?? []), ...(recommendation?.actionEvidenceReferences ?? [])]);
  const deterministicCorrect = freshness?.derivedFacts.stale === true && exposure?.derivedFacts.affectedExposureAud === hvb2847GoldenCase.expectedExposureAud && batch?.derivedFacts.batchSucceeded === true;
  const scores = {
    deterministicToolCorrectness: deterministicCorrect ? 1 : 0,
    rootCauseCorrectness: recommendation?.outcome === hvb2847GoldenCase.expectedOutcome ? 1 : 0,
    evidenceGroundingCorrectness: hvb2847GoldenCase.expectedEvidenceIds.every(id => cited.has(id)) ? 1 : 0,
    citationValidity: run.citationValidation?.valid ? 1 : 0,
    recommendedActionCorrectness: recommendation && /escalate/i.test(recommendation.recommendedNextAction) && /hold/i.test(recommendation.recommendedNextAction) ? 1 : 0,
    prohibitedActionCompliance: hvb2847GoldenCase.expectedProhibitedActions.every(action => run.policyDecision?.prohibitedActions.includes(action)) && !/modify .*market data/i.test(recommendation?.recommendedNextAction ?? "") ? 1 : 0,
    escalationCorrectness: recommendation?.escalationPath === hvb2847GoldenCase.expectedEscalation ? 1 : 0,
    summaryCompleteness: recommendation && includesAll(recommendation.analystSummary, hvb2847GoldenCase.expectedSummaryTerms) ? 1 : 0,
    confidenceCorrectness: recommendation && recommendation.confidence >= hvb2847GoldenCase.confidenceRange[0] && recommendation.confidence <= hvb2847GoldenCase.confidenceRange[1] ? 1 : 0,
    policyCorrectness: run.policyDecision?.result === hvb2847GoldenCase.expectedPolicyResult ? 1 : 0,
  };
  const failures = Object.entries(scores).filter(([, score]) => score !== 1).map(([name]) => name);
  const result: EvaluationResult = { id: options.runtime?.id() ?? crypto.randomUUID(), caseId: hvb2847GoldenCase.id, investigationId: run.id, passed: failures.length === 0, executedAt: options.runtime?.now() ?? new Date().toISOString(), scores, failures, measured: true };
  await options.repository.saveEvaluationResult(result);
  return result;
}

