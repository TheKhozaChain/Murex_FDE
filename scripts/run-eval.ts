import { mkdir, writeFile } from "node:fs/promises";
import { runGoldenEvaluation } from "../src/evaluation/runner";
import { MemoryInvestigationRepository } from "../src/persistence/memory-repository";

const requestedCase = process.argv.includes("--case") ? process.argv[process.argv.indexOf("--case") + 1] : "HVB-2847";
if (requestedCase !== "HVB-2847") throw new Error("Only HVB-2847 is executable in this milestone.");
const result = await runGoldenEvaluation({ repository: new MemoryInvestigationRepository() });
await mkdir("artifacts/evaluation", { recursive: true });
await writeFile("artifacts/evaluation/hvb-2847-latest.json", `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;

