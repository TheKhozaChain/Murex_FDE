import type { Hvb2822Input } from "../../src/domain/models";

export const hvb2822Input: Hvb2822Input = {
  id: "HVB-2822", title: "Liquidity Datamart population shortfall", report: "Liquidity Coverage Pack", area: "Regulatory", severity: "Critical", businessDate: "2026-08-03", owner: "Regulatory Reporting",
  description: "The Murex reporting chain stopped after ingesting 13 of 14 synthetic source segments, leaving the Liquidity Datamart population incomplete before internal sign-off.",
  regulatory: { assessedAt: "2026-08-03T02:45:00.000Z", internalSignoffDeadline: "2026-08-03T04:00:00.000Z", deadline: "2026-08-03T06:00:00.000Z" },
  source: { readerTimeout: true, timeoutSeconds: 120, expectedSegments: 14, receivedSegments: 13, manifestPresent: false },
  mapping: { controlId: "MAP-LCR-0803", result: "INCONCLUSIVE" },
  history: [{ incidentId: "HVB-2711", similarity: "Same terminal source-reader message", confirmedCause: "Currency mapping defect" }],
  supplementalEvidence: {
    manifestId: "LCR-MANIFEST-20260803", expectedSegments: 14, transferId: "SFTP-LIQ-88314", missingSegment: "LIQ_POS_14.csv", transferStatus: "NOT_DELIVERED", upstreamOwner: "Liquidity Data Services",
    currentMappingResult: "PASSED", recentConfigurationChanges: 0, expectedRows: 4_812_440, partialRows: 4_466_203, priorRunRows: [4_793_118, 4_805_772, 4_798_641, 4_817_009, 4_809_884],
  },
  escalationRoutes: ["Incident Commander", "Regulatory Reporting"],
  batch: { jobId: "LCR_PACK_004", status: "PARTIAL", completedAt: "2026-08-03T02:41:00.000Z", dependencyStatuses: { SOURCE_READER: "FAILED", MAPPING_VALIDATION: "PARTIAL", REPORT_RENDER: "RUNNING" } },
  policies: { minimumConfidence: 70, signoffRiskWindowMinutes: 120, requiredEvidence: ["source_manifest", "segment_reconciliation", "mapping_validation", "timeout_log"], requiredEvidenceKinds: ["manifest", "reconciliation", "mapping", "log", "deadline"] },
};
