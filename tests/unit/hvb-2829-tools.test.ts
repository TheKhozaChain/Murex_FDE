import assert from "node:assert/strict";
import test from "node:test";
import { hvb2829Input } from "../../data/incidents/hvb-2829";
import { calculateResidualPnl, calculateSensitivityPnl, executeDeterministicTools, validateCurrencyConversion, validateTradePopulation, validateValuationTimestamp } from "../../src/deterministic/tools";

const runtime = { now: () => "2026-08-04T00:00:00.000Z", id: () => crypto.randomUUID() };
const copy = () => structuredClone(hvb2829Input);
test("HVB-2829 P&L explain residual is within configured tolerance", () => { const sensitivity = calculateSensitivityPnl("run", hvb2829Input, runtime); const residual = calculateResidualPnl("run", hvb2829Input, Number(sensitivity.derivedFacts.marketContributionAud), runtime); assert.equal(residual.derivedFacts.withinTolerance, true); assert.ok(Math.abs(Number(residual.derivedFacts.residualAud)) < 1); });
test("HVB-2829 detects unexplained residual outside tolerance", () => { const input = copy(); input.pnl.reportedPnlAud += 100_000; const sensitivity = calculateSensitivityPnl("run", input, runtime); assert.equal(calculateResidualPnl("run", input, Number(sensitivity.derivedFacts.marketContributionAud), runtime).status, "warning"); });
test("HVB-2829 detects incomplete trade population", () => { const input = copy(); input.tradePopulation.actual--; assert.equal(validateTradePopulation("run", input, runtime).status, "failed"); });
test("HVB-2829 detects stale valuation timestamp", () => { const input = copy(); input.valuation.observedAt = "2026-08-02T20:00:00.000Z"; assert.equal(validateValuationTimestamp("run", input, runtime).status, "failed"); });
test("HVB-2829 detects failed currency conversion", () => { const input = copy(); input.currencyConversion.reconciled = false; assert.equal(validateCurrencyConversion("run", input, runtime).status, "failed"); });
test("HVB-2829 executes all scenario tools behind the shared dispatcher", () => { const names = executeDeterministicTools("run", hvb2829Input, runtime).map(tool => tool.toolName); assert.deepEqual(names, ["incident.validate", "pnl.market_movement", "pnl.sensitivity", "pnl.residual", "trade.population", "valuation.timestamp", "currency_conversion.control", "pnl.materiality", "batch.dependencies", "evidence.completeness"]); });
