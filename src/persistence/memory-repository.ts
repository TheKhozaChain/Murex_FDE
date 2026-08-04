import type { ApprovalDecision, EvaluationCase, EvaluationResult, IncidentInput, InvestigationRun } from "../domain/models";
import type { InvestigationRepository } from "./repository";

const clone = <T>(value: T): T => structuredClone(value);

export class MemoryInvestigationRepository implements InvestigationRepository {
  private incidents = new Map<string, IncidentInput>();
  private runs = new Map<string, InvestigationRun>();
  private evaluations = new Map<string, EvaluationResult[]>();
  async initialise() {}
  async seedIncident(incident: IncidentInput) { this.incidents.set(incident.id, clone(incident)); }
  async saveRun(run: InvestigationRun) { this.runs.set(run.id, clone(run)); }
  async getRun(id: string) { const run = this.runs.get(id); return run ? clone(run) : null; }
  async getLatestRun(incidentId: string) { return [...this.runs.values()].filter(run => run.incidentId === incidentId).sort((a, b) => b.startedAt.localeCompare(a.startedAt)).map(clone)[0] ?? null; }
  async saveApproval(run: InvestigationRun, approval: ApprovalDecision) {
    const existing = this.runs.get(run.id);
    if (!existing) throw new Error("Investigation run not found.");
    if (existing.approval) throw new Error("Duplicate approval decision.");
    this.runs.set(run.id, clone({ ...run, approval }));
  }
  async saveEvaluationCase(testCase: EvaluationCase) { void testCase; }
  async saveEvaluationResult(result: EvaluationResult) { const results = this.evaluations.get(result.caseId) ?? []; results.push(clone(result)); this.evaluations.set(result.caseId, results); }
  async getLatestEvaluation(caseId: string) { const result = (this.evaluations.get(caseId) ?? []).sort((a, b) => b.executedAt.localeCompare(a.executedAt))[0]; return result ? clone(result) : null; }
}
