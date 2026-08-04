import { hvb2847GoldenCase } from "../../../data/evaluation/hvb-2847";
import { runGoldenEvaluation } from "../../../src/evaluation/runner";
import { getRuntimeRepository } from "../../../src/persistence/runtime-repository";

export async function POST() {
  try {
    const result = await runGoldenEvaluation({ repository: getRuntimeRepository() });
    return Response.json({ result }, { status: result.passed ? 201 : 422 });
  } catch {
    return Response.json({ error: "The executable evaluation could not complete safely." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const repository = getRuntimeRepository();
    await repository.initialise();
    return Response.json({ result: await repository.getLatestEvaluation(hvb2847GoldenCase.id) });
  } catch {
    return Response.json({ error: "Persisted evaluation state is unavailable." }, { status: 500 });
  }
}
