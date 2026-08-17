import { z } from "zod";
import { executeSyntheticRemediation } from "../../../src/investigation/workflow";
import { getRuntimeRepository } from "../../../src/persistence/runtime-repository";

const requestSchema = z.object({ runId: z.string().uuid(), actionId: z.string().min(1).max(100), confirmSynthetic: z.literal(true) }).strict();

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "A confirmed synthetic recovery request is required." }, { status: 400 });
  try {
    const run = await executeSyntheticRemediation({ repository: getRuntimeRepository(), runId: parsed.data.runId, actionId: parsed.data.actionId });
    return Response.json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Synthetic recovery rejected.";
    const safeMessages = ["Approved synthetic recovery is not available.", "An approved recommendation is required before recovery.", "Synthetic recovery has already executed.", "Requested remediation action is not allow-listed for this incident.", "Citation or policy state does not permit remediation.", "Required evidence is incomplete.", "Approval does not match the current recommendation version.", "Recommendation confidence is below the action threshold.", "Recommendation outcome does not permit the FX recovery action.", "Recommendation outcome does not permit the liquidity recovery action."];
    return Response.json({ error: safeMessages.includes(message) || message.startsWith("Action preconditions failed:") ? message : "Synthetic recovery rejected." }, { status: 409 });
  }
}
