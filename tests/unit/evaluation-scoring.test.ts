import assert from "node:assert/strict";
import test from "node:test";
import { runGoldenEvaluation } from "../../src/evaluation/runner";
import { MemoryInvestigationRepository } from "../../src/persistence/memory-repository";

test("the executable HVB-2847 golden case passes every measured check", async () => {
  const result = await runGoldenEvaluation({ repository: new MemoryInvestigationRepository() });
  assert.equal(result.passed, true);
  assert.deepEqual(result.failures, []);
  assert.ok(Object.values(result.scores).every(score => score === 1));
  assert.equal(result.measured, true);
});

