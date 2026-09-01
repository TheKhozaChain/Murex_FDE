import type { EvaluationCase } from "../../src/domain/models";

export const hvb2847GoldenCase: EvaluationCase = {
  id: "GOLDEN-HVB-2847-v1", incidentId: "HVB-2847", expectedOutcome: "stale_market_data",
  expectedExposureAud: 12_800_000, expectedEvidenceIds: ["EV-MD-FRESHNESS", "EV-AFFECTED-EXPOSURE", "EV-BATCH-STATUS", "RB-17"],
  expectedEscalation: "Market Data Operations + Market Risk Control + Murex Production Support", expectedProhibitedActions: ["modify_market_data"], expectedPolicyResult: "approval_required",
  confidenceRange: [85, 95], failClosedExpected: false, expectedSummaryTerms: ["USD/JPY", "stale", "12.8", "Market Data Operations", "approval"],
  expectedMissingEvidence: [],
};
