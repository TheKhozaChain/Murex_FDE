import { env } from "cloudflare:workers";
import { D1InvestigationRepository } from "./d1-repository";

export function getRuntimeRepository() {
  if (!env.DB) throw new Error("Persistent demo storage is unavailable.");
  return new D1InvestigationRepository(env.DB);
}

