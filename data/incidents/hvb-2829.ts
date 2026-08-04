import type { Hvb2829Input } from "../../src/domain/models";

export const hvb2829Input: Hvb2829Input = {
  id: "HVB-2829", title: "Large commodities P&L movement", report: "Trading P&L Flash", area: "Finance", severity: "Medium", businessDate: "2026-08-03", owner: "Commodities Control",
  description: "The crude derivatives desk reports an AUD 6.1m day-on-day P&L movement above its review threshold.",
  pnl: { priorCrudePriceUsd: 80, currentCrudePriceUsd: 83.76, barrelsSensitivity: 925_000, audUsdRate: 0.65, carryContributionAud: 300_000, newTradeContributionAud: 449_230.77, reportedPnlAud: 6_100_000, residualToleranceAud: 25_000 },
  tradePopulation: { expected: 12_480, actual: 12_480 },
  valuation: { observedAt: "2026-08-02T22:20:00.000Z", requiredAfter: "2026-08-02T21:00:00.000Z" },
  currencyConversion: { controlId: "FX-CONV-COM-0803", sourceCurrency: "USD", targetCurrency: "AUD", ratePresent: true, reconciled: true },
  batch: { jobId: "PNL_COM_021", status: "SUCCEEDED", completedAt: "2026-08-02T22:26:00.000Z", dependencyStatuses: { TRADE_LOAD_COM: "SUCCEEDED", MARKET_DATA_COM: "SUCCEEDED", VALUATION_COM: "SUCCEEDED", FX_CONVERSION: "SUCCEEDED" } },
  policies: { reviewThresholdAud: 2_000_000, materialityAud: 5_000_000, requiredEvidenceKinds: ["market_data", "trade", "reconciliation", "batch"] },
};
