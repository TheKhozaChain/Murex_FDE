import type { Hvb2847Input } from "../../src/domain/models";

export const hvb2847Input: Hvb2847Input = {
  id: "HVB-2847",
  title: "Unexpected FX delta movement",
  report: "Daily Market Risk",
  area: "Risk",
  severity: "High",
  businessDate: "2026-08-03",
  owner: "Market Risk Control",
  description: "AUD-equivalent delta increased 18.4% across the Asia FX portfolio after the morning risk cycle.",
  marketData: [{
    recordId: "MD-USDJPY-0803", currencyPair: "USD/JPY", rate: 146.82,
    observedAt: "2026-07-31T22:00:00.000Z", requiredFreshAfter: "2026-08-02T21:00:00.000Z", source: "synthetic-md-apac",
  }],
  positions: [
    { positionId: "POS-FX-101", currencyPair: "USD/JPY", exposureAud: 5_200_000 },
    { positionId: "POS-FX-102", currencyPair: "USD/JPY", exposureAud: 4_100_000 },
    { positionId: "POS-FX-103", currencyPair: "USD/JPY", exposureAud: 3_500_000 },
    { positionId: "POS-FX-104", currencyPair: "EUR/AUD", exposureAud: 950_000 },
  ],
  batch: {
    jobId: "RISK_APAC_010", status: "SUCCEEDED", completedAt: "2026-08-02T22:31:00.000Z",
    dependencyStatuses: { TRADE_LOAD_APAC: "SUCCEEDED", MARKET_DATA_APAC: "SUCCEEDED", VALUATION_APAC: "SUCCEEDED" },
  },
  reconciliation: { controlId: "REC-FX-DELTA-0803", movementPercent: 18.4, concentrationPercent: 93, passedPopulationControl: true },
  policies: { freshnessThresholdMinutes: 60, materialityExposureAud: 10_000_000, requiredEvidenceKinds: ["market_data", "exposure", "batch", "reconciliation"] },
};
