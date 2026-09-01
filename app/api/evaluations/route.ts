import { executableIncidentIdSchema } from "../../../src/domain/models";
import { goldenCases, runGoldenEvaluation, runGoldenSuite } from "../../../src/evaluation/runner";
import { getRuntimeRepository } from "../../../src/persistence/runtime-repository";

export async function POST(request: Request) {
  try {
    const value = new URL(request.url).searchParams.get("case"); const parsed = value ? executableIncidentIdSchema.safeParse(value) : null; if (value && !parsed?.success) return Response.json({ error: "Golden case not found." }, { status: 404 });
    const repository = getRuntimeRepository(); const results = parsed?.success ? [await runGoldenEvaluation({ repository, caseId: parsed.data })] : await runGoldenSuite({ repository });
    return Response.json({ results, passed: results.every(result => result.passed) }, { status: results.every(result => result.passed) ? 201 : 422 });
  } catch { return Response.json({ error: "The executable evaluation suite could not complete safely." }, { status: 500 }); }
}
export async function GET() {
  try { const repository = getRuntimeRepository(); await repository.initialise(); const results = (await Promise.all(goldenCases.map(testCase => repository.getLatestEvaluation(testCase.id)))).filter(Boolean); return Response.json({ results, passed: results.length === goldenCases.length && results.every(result => result?.passed) }); }
  catch { return Response.json({ error: "Persisted evaluation state is unavailable." }, { status: 500 }); }
}
