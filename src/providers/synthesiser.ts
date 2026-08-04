import type { InvestigationContext, Recommendation } from "../domain/models";

export interface InvestigationSynthesiser {
  readonly name: string;
  synthesise(context: InvestigationContext): Promise<Recommendation>;
}

