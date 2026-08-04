import { z } from "zod";
import { decideApproval } from "../../../src/investigation/workflow";
import { getRuntimeRepository } from "../../../src/persistence/runtime-repository";

const requestSchema = z.object({ runId: z.string().uuid(), decision: z.enum(["approved", "rejected"]), scope: z.enum(["recommendation", "escalation_disposition"]).default("recommendation"), comment: z.string().max(500).optional() }).strict();

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Approval request is malformed." }, { status: 400 });
  try {
    const run = await decideApproval({ repository: getRuntimeRepository(), ...parsed.data });
    return Response.json({ run });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval transition rejected.";
    const safeMessages = ["Investigation must complete before approval.", "An approval decision already exists.", "A failed-closed recommendation cannot be approved as a confirmed resolution.", "Completed investigation recommendation not found.", "Duplicate approval decision."];
    return Response.json({ error: safeMessages.includes(message) ? message : "Approval transition rejected." }, { status: 409 });
  }
}
