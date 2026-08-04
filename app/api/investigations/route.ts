import { z } from "zod";
import { runInvestigation } from "../../../src/investigation/workflow";
import { getRuntimeRepository } from "../../../src/persistence/runtime-repository";

const requestSchema = z.object({ incidentId: z.literal("HVB-2847") }).strict();

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Only the executable HVB-2847 incident ID is accepted." }, { status: 400 });
  try {
    const run = await runInvestigation({ incidentId: parsed.data.incidentId, repository: getRuntimeRepository() });
    return Response.json({ run }, { status: 201 });
  } catch {
    return Response.json({ error: "The controlled investigation could not be completed safely." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const incidentId = new URL(request.url).searchParams.get("incidentId");
  if (incidentId !== "HVB-2847") return Response.json({ error: "Executable incident not found." }, { status: 404 });
  try {
    const repository = getRuntimeRepository();
    await repository.initialise();
    const run = await repository.getLatestRun(incidentId);
    return Response.json({ run });
  } catch {
    return Response.json({ error: "Persisted investigation state is unavailable." }, { status: 500 });
  }
}

