import { evaluationResultSchema, investigationRunSchema, type ApprovalDecision, type EvaluationCase, type EvaluationResult, type IncidentInput, type InvestigationRun } from "../domain/models";
import type { InvestigationRepository } from "./repository";

const schemaStatements = [
  "CREATE TABLE IF NOT EXISTS incidents (id TEXT PRIMARY KEY, payload_json TEXT NOT NULL, seeded_at TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS investigation_runs (id TEXT PRIMARY KEY, incident_id TEXT NOT NULL, status TEXT NOT NULL, provider TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT, snapshot_json TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_investigation_runs_incident_started ON investigation_runs (incident_id, started_at)",
  "CREATE TABLE IF NOT EXISTS tool_executions (id TEXT PRIMARY KEY, investigation_id TEXT NOT NULL, tool_name TEXT NOT NULL, status TEXT NOT NULL, payload_json TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_tool_executions_run ON tool_executions (investigation_id)",
  "CREATE TABLE IF NOT EXISTS evidence_records (id TEXT NOT NULL, investigation_id TEXT NOT NULL, kind TEXT NOT NULL, payload_json TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_evidence_run_id ON evidence_records (investigation_id, id)",
  "CREATE TABLE IF NOT EXISTS retrieved_documents (document_id TEXT NOT NULL, investigation_id TEXT NOT NULL, trust TEXT NOT NULL, relevance_score INTEGER NOT NULL, payload_json TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_retrieved_run_document ON retrieved_documents (investigation_id, document_id)",
  "CREATE TABLE IF NOT EXISTS recommendations (investigation_id TEXT PRIMARY KEY, version INTEGER NOT NULL, outcome TEXT NOT NULL, payload_json TEXT NOT NULL, citation_json TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS policy_decisions (investigation_id TEXT PRIMARY KEY, result TEXT NOT NULL, passed INTEGER NOT NULL, payload_json TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS approval_decisions (id TEXT PRIMARY KEY, investigation_id TEXT NOT NULL, decision TEXT NOT NULL, identity TEXT NOT NULL, decided_at TEXT NOT NULL, payload_json TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_approval_run ON approval_decisions (investigation_id)",
  "CREATE TABLE IF NOT EXISTS audit_events (id TEXT PRIMARY KEY, investigation_id TEXT NOT NULL, sequence INTEGER NOT NULL, event_type TEXT NOT NULL, occurred_at TEXT NOT NULL, payload_json TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_run_sequence ON audit_events (investigation_id, sequence)",
  "CREATE INDEX IF NOT EXISTS idx_audit_run ON audit_events (investigation_id)",
  "CREATE TABLE IF NOT EXISTS evaluation_cases (id TEXT PRIMARY KEY, incident_id TEXT NOT NULL, payload_json TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS evaluation_results (id TEXT PRIMARY KEY, case_id TEXT NOT NULL, investigation_id TEXT NOT NULL, passed INTEGER NOT NULL, executed_at TEXT NOT NULL, payload_json TEXT NOT NULL)",
  "CREATE INDEX IF NOT EXISTS idx_evaluation_case_executed ON evaluation_results (case_id, executed_at)",
];

export class D1InvestigationRepository implements InvestigationRepository {
  constructor(private readonly db: D1Database) {}

  async initialise() { await this.db.batch(schemaStatements.map(statement => this.db.prepare(statement))); }

  async seedIncident(incident: IncidentInput) {
    await this.db.prepare("INSERT OR REPLACE INTO incidents (id, payload_json, seeded_at) VALUES (?, ?, ?)").bind(incident.id, JSON.stringify(incident), new Date().toISOString()).run();
  }

  async saveRun(run: InvestigationRun) {
    const statements: D1PreparedStatement[] = [
      this.db.prepare("INSERT OR REPLACE INTO investigation_runs (id, incident_id, status, provider, started_at, completed_at, snapshot_json) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(run.id, run.incidentId, run.status, run.provider, run.startedAt, run.completedAt, JSON.stringify(run)),
      ...run.toolExecutions.map(tool => this.db.prepare("INSERT OR REPLACE INTO tool_executions (id, investigation_id, tool_name, status, payload_json) VALUES (?, ?, ?, ?, ?)").bind(tool.id, run.id, tool.toolName, tool.status, JSON.stringify(tool))),
      ...run.evidence.map(evidence => this.db.prepare("INSERT OR REPLACE INTO evidence_records (id, investigation_id, kind, payload_json) VALUES (?, ?, ?, ?)").bind(evidence.id, run.id, evidence.kind, JSON.stringify(evidence))),
      ...run.retrievedDocuments.map(document => this.db.prepare("INSERT OR REPLACE INTO retrieved_documents (document_id, investigation_id, trust, relevance_score, payload_json) VALUES (?, ?, ?, ?, ?)").bind(document.documentId, run.id, document.trust, Math.round(document.relevanceScore), JSON.stringify(document))),
      ...run.auditEvents.map(event => this.db.prepare("INSERT OR IGNORE INTO audit_events (id, investigation_id, sequence, event_type, occurred_at, payload_json) VALUES (?, ?, ?, ?, ?, ?)").bind(event.id, run.id, event.sequence, event.eventType, event.occurredAt, JSON.stringify(event))),
    ];
    if (run.recommendation && run.citationValidation) statements.push(this.db.prepare("INSERT OR REPLACE INTO recommendations (investigation_id, version, outcome, payload_json, citation_json) VALUES (?, ?, ?, ?, ?)").bind(run.id, run.recommendation.version, run.recommendation.outcome, JSON.stringify(run.recommendation), JSON.stringify(run.citationValidation)));
    if (run.policyDecision) statements.push(this.db.prepare("INSERT OR REPLACE INTO policy_decisions (investigation_id, result, passed, payload_json) VALUES (?, ?, ?, ?)").bind(run.id, run.policyDecision.result, run.policyDecision.passed ? 1 : 0, JSON.stringify(run.policyDecision)));
    await this.db.batch(statements);
  }

  async getRun(id: string) {
    const row = await this.db.prepare("SELECT snapshot_json FROM investigation_runs WHERE id = ?").bind(id).first<{ snapshot_json: string }>();
    return row ? investigationRunSchema.parse(JSON.parse(row.snapshot_json)) : null;
  }

  async getLatestRun(incidentId: string) {
    const row = await this.db.prepare("SELECT snapshot_json FROM investigation_runs WHERE incident_id = ? ORDER BY started_at DESC LIMIT 1").bind(incidentId).first<{ snapshot_json: string }>();
    return row ? investigationRunSchema.parse(JSON.parse(row.snapshot_json)) : null;
  }

  async saveApproval(run: InvestigationRun, approval: ApprovalDecision) {
    const updated = { ...run, approval };
    await this.db.batch([
      this.db.prepare("INSERT INTO approval_decisions (id, investigation_id, decision, identity, decided_at, payload_json) VALUES (?, ?, ?, ?, ?, ?)").bind(approval.id, run.id, approval.decision, approval.identity, approval.decidedAt, JSON.stringify(approval)),
      this.db.prepare("UPDATE investigation_runs SET snapshot_json = ? WHERE id = ?").bind(JSON.stringify(updated), run.id),
    ]);
  }

  async saveEvaluationCase(testCase: EvaluationCase) {
    await this.db.prepare("INSERT OR REPLACE INTO evaluation_cases (id, incident_id, payload_json) VALUES (?, ?, ?)").bind(testCase.id, testCase.incidentId, JSON.stringify(testCase)).run();
  }

  async saveEvaluationResult(result: EvaluationResult) {
    await this.db.prepare("INSERT INTO evaluation_results (id, case_id, investigation_id, passed, executed_at, payload_json) VALUES (?, ?, ?, ?, ?, ?)").bind(result.id, result.caseId, result.investigationId, result.passed ? 1 : 0, result.executedAt, JSON.stringify(result)).run();
  }

  async getLatestEvaluation(caseId: string) {
    const row = await this.db.prepare("SELECT payload_json FROM evaluation_results WHERE case_id = ? ORDER BY executed_at DESC LIMIT 1").bind(caseId).first<{ payload_json: string }>();
    return row ? evaluationResultSchema.parse(JSON.parse(row.payload_json)) : null;
  }
}
