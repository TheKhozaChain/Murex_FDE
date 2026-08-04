import type { Hvb2822Input } from "../../src/domain/models";

export const hvb2822Input: Hvb2822Input = {
  id: "HVB-2822", title: "Conflicting critical timeout diagnosis", report: "Liquidity Coverage Pack", area: "Regulatory", severity: "Critical", businessDate: "2026-08-03", owner: "Regulatory Reporting",
  description: "A critical regulatory report is delayed; a current timeout, missing manifest, and similar historical mapping defect leave the cause unresolved.",
  regulatory: { assessedAt: "2026-08-03T02:45:00.000Z", internalSignoffDeadline: "2026-08-03T04:00:00.000Z", deadline: "2026-08-03T06:00:00.000Z" },
  source: { readerTimeout: true, timeoutSeconds: 120, expectedSegments: 14, receivedSegments: 13, manifestPresent: false },
  mapping: { controlId: "MAP-LCR-0803", result: "INCONCLUSIVE" },
  history: [{ incidentId: "HVB-2711", similarity: "Same terminal source-reader message", confirmedCause: "Currency mapping defect" }],
  escalationRoutes: ["Incident Commander", "Regulatory Reporting"],
  batch: { jobId: "LCR_PACK_004", status: "PARTIAL", completedAt: "2026-08-03T02:41:00.000Z", dependencyStatuses: { SOURCE_READER: "FAILED", MAPPING_VALIDATION: "PARTIAL", REPORT_RENDER: "RUNNING" } },
  policies: { minimumConfidence: 70, signoffRiskWindowMinutes: 120, requiredEvidence: ["source_manifest", "segment_reconciliation", "mapping_validation", "timeout_log"], requiredEvidenceKinds: ["manifest", "reconciliation", "mapping", "log", "deadline"] },
};
