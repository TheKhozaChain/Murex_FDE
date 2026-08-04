import type { ApprovalDecision, EvaluationCase, EvaluationResult, IncidentInput, InvestigationRun } from "../domain/models";

export interface InvestigationRepository {
  initialise(): Promise<void>;
  seedIncident(incident: IncidentInput): Promise<void>;
  saveRun(run: InvestigationRun): Promise<void>;
  getRun(id: string): Promise<InvestigationRun | null>;
  getLatestRun(incidentId: string): Promise<InvestigationRun | null>;
  saveApproval(run: InvestigationRun, approval: ApprovalDecision): Promise<void>;
  saveEvaluationCase(testCase: EvaluationCase): Promise<void>;
  saveEvaluationResult(result: EvaluationResult): Promise<void>;
  getLatestEvaluation(caseId: string): Promise<EvaluationResult | null>;
}

