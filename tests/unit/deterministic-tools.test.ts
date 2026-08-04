import assert from "node:assert/strict";
import test from "node:test";
import { hvb2847Input } from "../../data/incidents/hvb-2847";
import { calculateAffectedExposure, checkRequiredEvidence, checkSeverityAndMateriality, executeDeterministicTools, validateBatchDependencies, validateIncidentPayload, validateMarketDataFreshness } from "../../src/deterministic/tools";

const runtime = { now: () => "2026-08-04T00:00:00.000Z", id: (() => { let id = 0; return () => `tool-${++id}`; })() };

test("validates the server-owned incident payload", () => {
  assert.equal(validateIncidentPayload("run-1", hvb2847Input, runtime).status, "passed");
  assert.equal(validateIncidentPayload("run-1", { id: "HVB-2847" }, runtime).status, "failed");
});

test("derives the stale USD/JPY freshness breach", () => {
  const result = validateMarketDataFreshness("run-1", hvb2847Input, runtime);
  assert.equal(result.derivedFacts.stale, true);
  assert.equal(result.derivedFacts.ageAtThresholdMinutes, 2820);
  assert.deepEqual(result.evidenceIds, ["EV-MD-FRESHNESS"]);
});

test("calculates affected exposure from positions", () => {
  const result = calculateAffectedExposure("run-1", hvb2847Input, runtime);
  assert.equal(result.derivedFacts.affectedExposureAud, 12_800_000);
  assert.equal(result.derivedFacts.positionCount, 3);
});

test("proves the successful batch and dependencies", () => {
  const result = validateBatchDependencies("run-1", hvb2847Input, runtime);
  assert.equal(result.derivedFacts.batchSucceeded, true);
  assert.deepEqual(result.derivedFacts.failedDependencies, []);
});

test("applies materiality and required-evidence checks", () => {
  assert.equal(checkSeverityAndMateriality("run-1", hvb2847Input, 12_800_000, runtime).derivedFacts.material, true);
  const tools = executeDeterministicTools("run-1", hvb2847Input, runtime);
  const evidence = tools.flatMap(tool => tool.evidence);
  assert.equal(checkRequiredEvidence("run-1", hvb2847Input, evidence, runtime).derivedFacts.complete, true);
});

