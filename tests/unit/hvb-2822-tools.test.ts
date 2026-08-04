import assert from "node:assert/strict";
import test from "node:test";
import { hvb2822Input } from "../../data/incidents/hvb-2822";
import { detectEvidenceContradiction, executeDeterministicTools, reconcileSourceSegments, validateSourceManifest } from "../../src/deterministic/tools";

const runtime = { now: () => "2026-08-04T00:00:00.000Z", id: () => crypto.randomUUID() };
test("HVB-2822 detects the missing manifest", () => { const result = validateSourceManifest("run", hvb2822Input, runtime); assert.equal(result.status, "failed"); assert.equal(result.derivedFacts.complete, false); });
test("HVB-2822 cannot establish population completeness", () => { const result = reconcileSourceSegments("run", hvb2822Input, runtime); assert.equal(result.derivedFacts.populationEstablished, false); assert.equal(result.derivedFacts.missingSegments, 1); });
test("HVB-2822 separates current, historical, missing, and conflicting evidence", () => { const result = detectEvidenceContradiction("run", hvb2822Input, runtime); assert.deepEqual(result.derivedFacts.directCurrentEvidence, ["source_reader_timeout"]); assert.equal(result.derivedFacts.historyIsProof, false); assert.equal(result.derivedFacts.conflictingHypotheses, true); assert.deepEqual(result.derivedFacts.missingEvidence, ["source_manifest"]); });
test("HVB-2822 executes all scenario tools behind the shared dispatcher", () => { const names = executeDeterministicTools("run", hvb2822Input, runtime).map(tool => tool.toolName); assert.deepEqual(names, ["incident.validate", "source.manifest", "source.segments", "source.timeout", "mapping.validation", "regulatory.deadline", "incident.severity", "evidence.contradiction", "batch.dependencies", "evidence.completeness"]); });
