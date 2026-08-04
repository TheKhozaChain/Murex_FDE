import { mkdir, writeFile } from "node:fs/promises";
import { executableIncidentIdSchema } from "../src/domain/models";
import { runGoldenEvaluation, runGoldenSuite } from "../src/evaluation/runner";
import { MemoryInvestigationRepository } from "../src/persistence/memory-repository";

const requested = process.argv.includes("--case") ? process.argv[process.argv.indexOf("--case") + 1] : null; const parsed = requested ? executableIncidentIdSchema.safeParse(requested) : null;
if (requested && !parsed?.success) throw new Error("Case must be HVB-2847, HVB-2829, or HVB-2822.");
const repository = new MemoryInvestigationRepository(); const results = parsed?.success ? [await runGoldenEvaluation({ repository, caseId: parsed.data })] : await runGoldenSuite({ repository });
await mkdir("artifacts/evaluation", { recursive: true });
for (const result of results) await writeFile(`artifacts/evaluation/${result.incidentId.toLowerCase()}-latest.json`, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ passed: results.every(result => result.passed), caseCount: results.length, results }, null, 2));
if (results.some(result => !result.passed)) process.exitCode = 1;
