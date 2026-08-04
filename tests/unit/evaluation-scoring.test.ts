import assert from "node:assert/strict";
import test from "node:test";
import { runGoldenEvaluation, runGoldenSuite } from "../../src/evaluation/runner";
import { MemoryInvestigationRepository } from "../../src/persistence/memory-repository";

test("the executable HVB-2847 golden case passes every measured check", async () => {
  const result = await runGoldenEvaluation({ repository: new MemoryInvestigationRepository() });
  assert.equal(result.passed, true);
  assert.deepEqual(result.failures, []);
  assert.ok(Object.values(result.scores).every(score => score === 1));
  assert.equal(result.measured, true);
});

test("all three executable golden cases pass all twelve measured checks", async () => {
  const results = await runGoldenSuite({ repository: new MemoryInvestigationRepository() });
  assert.equal(results.length, 3);
  assert.deepEqual(results.map(result => result.incidentId), ["HVB-2847", "HVB-2829", "HVB-2822"]);
  assert.ok(results.every(result => result.passed && Object.keys(result.scores).length === 12 && Object.values(result.scores).every(score => score === 1)));
});
