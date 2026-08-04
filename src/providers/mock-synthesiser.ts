import type { InvestigationContext, Recommendation } from "../domain/models";
import type { InvestigationSynthesiser } from "./synthesiser";

export class DeterministicMockSynthesiser implements InvestigationSynthesiser {
  readonly name = "mock-deterministic-v1";

  async synthesise(context: InvestigationContext): Promise<Recommendation> {
    const freshness = context.toolExecutions.find(tool => tool.toolName === "market_data.freshness");
    const exposure = context.toolExecutions.find(tool => tool.toolName === "exposure.calculate");
    const batch = context.toolExecutions.find(tool => tool.toolName === "batch.dependencies");
    const completeness = context.toolExecutions.find(tool => tool.toolName === "evidence.completeness");
    const runbook = context.retrievedDocuments.find(document => document.documentId === "RB-17" && document.approved);
    const escalation = context.retrievedDocuments.find(document => document.documentId === "ESC-03" && document.approved);
    const distribution = context.retrievedDocuments.find(document => document.documentId === "POL-09" && document.approved);
    const stale = freshness?.derivedFacts.stale === true;
    const complete = completeness?.derivedFacts.complete === true;
    const affectedExposureAud = Number(exposure?.derivedFacts.affectedExposureAud ?? 0);
    const batchSucceeded = batch?.derivedFacts.batchSucceeded === true;
    const evidenceReferences = ["EV-MD-FRESHNESS", "EV-AFFECTED-EXPOSURE", "EV-RECONCILIATION", "EV-BATCH-STATUS", ...(runbook ? [runbook.documentId] : [])];

    if (!stale || !complete || !runbook || !escalation || !distribution) {
      return {
        investigationId: context.toolExecutions[0]?.investigationId ?? "unknown", version: 1, outcome: "insufficient_evidence",
        candidates: [{ cause: "Root cause cannot be confirmed from the available evidence", evidenceReferences: context.evidence.slice(0, 1).map(item => item.id), confidence: 35, factualClaims: ["Required evidence or approved guidance is incomplete."] }],
        confidence: 35, uncertaintyExplanation: "The evidence packet is incomplete or does not establish a freshness breach.", contradictoryEvidence: [], missingEvidence: ["approved_guidance_or_freshness_evidence"],
        recommendedNextAction: "Escalate for manual investigation; do not modify data or distribute the report.", actionEvidenceReferences: context.evidence.slice(0, 1).map(item => item.id),
        escalationPath: "Production Support", prohibitedActionsDetected: ["modify_market_data"], analystSummary: "Evidence is insufficient; the workflow failed closed.", stakeholderSummary: "The report remains under review while additional evidence is obtained.",
      };
    }

    const exposureMillions = (affectedExposureAud / 1_000_000).toFixed(1);
    return {
      investigationId: context.toolExecutions[0].investigationId, version: 1, outcome: "stale_market_data",
      candidates: [{
        cause: `Stale USD/JPY market data in the APAC synthetic source`, evidenceReferences, confidence: 92,
        factualClaims: [
          "The USD/JPY observation predates the configured freshness boundary.",
          `USD/JPY-sensitive positions have AUD ${exposureMillions}m affected exposure.`,
          `The valuation batch ${batchSucceeded ? "succeeded" : "did not succeed"}; the evidence does not establish a batch failure.`,
        ],
      }],
      confidence: 92,
      uncertaintyExplanation: "The stale timestamp and concentrated exposure are established, but the valuation itself must not be declared wrong until an approved refresh and rerun confirm the effect.",
      contradictoryEvidence: [], missingEvidence: [],
      recommendedNextAction: "Escalate the stale USD/JPY observation to Market Data Operations and recommend holding Daily Market Risk distribution pending human approval and source confirmation.",
      actionEvidenceReferences: ["EV-MD-FRESHNESS", "EV-AFFECTED-EXPOSURE", "RB-17", "POL-09", "ESC-03"],
      escalationPath: "Market Data Operations", prohibitedActionsDetected: ["modify_market_data"],
      analystSummary: `A deterministic freshness check identified stale USD/JPY data. AUD ${exposureMillions}m exposure is affected. The batch succeeded, so batch failure is not claimed. Escalate to Market Data Operations and request approval to hold report distribution; do not modify market data.`,
      stakeholderSummary: `Daily Market Risk is under review because the USD/JPY input is stale and affects AUD ${exposureMillions}m of exposure. Market Data Operations has been identified as the escalation path. Distribution should be held only after accountable approval.`,
    };
  }
}
