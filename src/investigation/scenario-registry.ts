import { hvb2822Input } from "../../data/incidents/hvb-2822";
import { hvb2829Input } from "../../data/incidents/hvb-2829";
import { hvb2847Input } from "../../data/incidents/hvb-2847";
import type { ExecutableIncidentId, IncidentInput } from "../domain/models";

const inputs: Record<ExecutableIncidentId, IncidentInput> = { "HVB-2847": hvb2847Input, "HVB-2829": hvb2829Input, "HVB-2822": hvb2822Input };
export const executableIncidentIds = Object.keys(inputs) as ExecutableIncidentId[];
export function getScenarioInput(id: ExecutableIncidentId): IncidentInput { return inputs[id]; }
export function isExecutableIncidentId(value: string): value is ExecutableIncidentId { return executableIncidentIds.includes(value as ExecutableIncidentId); }
