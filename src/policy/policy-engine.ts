import type { CitationValidation, IncidentInput, PolicyDecision, Recommendation, ToolExecution } from "../domain/models";

export function applySafetyPolicy(input: {
  investigationId: string; incident: IncidentInput; tools: ToolExecution[]; recommendation: Recommendation | null; citationValidation: CitationValidation; now: string;
}): PolicyDecision {
  const evidenceComplete = input.tools.find(tool => tool.toolName === "evidence.completeness")?.derivedFacts.complete === true;
  const directMutation = Boolean(input.recommendation && /modify|overwrite|change|repair/.test(input.recommendation.recommendedNextAction.toLowerCase()) && /market data|rate|trade/.test(input.recommendation.recommendedNextAction.toLowerCase()));
  const malformed = input.recommendation === null;
  const critical = input.incident.severity === "Critical";
  const sufficientConfidence = (input.recommendation?.confidence ?? 0) >= 70;
  const rules = [
    { rule: "citation_validation", passed: input.citationValidation.valid, detail: input.citationValidation.valid ? "Every citation resolves to executed evidence or approved retrieval." : input.citationValidation.errors.join("; ") },
    { rule: "structured_output", passed: !malformed, detail: malformed ? "Synthesis output is malformed." : "Synthesis output passed runtime schema validation." },
    { rule: "required_evidence", passed: evidenceComplete, detail: evidenceComplete ? "Required evidence is complete." : "Required evidence is incomplete." },
    { rule: "protected_record_mutation", passed: !directMutation, detail: directMutation ? "Direct production-like record modification is prohibited." : "No mutation action is recommended." },
    { rule: "confidence_threshold", passed: sufficientConfidence, detail: sufficientConfidence ? "Confidence meets the 70% review threshold." : "Confidence is below the review threshold." },
    { rule: "critical_auto_resolution", passed: !critical, detail: critical ? "Critical incidents cannot be automatically resolved." : "Incident is not critical." },
    { rule: "operational_effect", passed: true, detail: "Recommendations have no operational effect before approval." },
  ];
  const passed = rules.every(rule => rule.passed);
  return {
    investigationId: input.investigationId, result: passed ? "approval_required" : "fail_closed", passed, rules,
    prohibitedActions: ["modify_market_data", "modify_trade", "automatic_batch_rerun", "automatic_resolution"],
    approvalRequired: true, operationalEffect: "none", decidedAt: input.now,
  };
}

export function canApprove(policy: PolicyDecision, status: string, existingApproval: boolean): { allowed: boolean; reason: string } {
  if (status !== "completed") return { allowed: false, reason: "Investigation must complete before approval." };
  if (existingApproval) return { allowed: false, reason: "An approval decision already exists." };
  if (policy.result === "fail_closed") return { allowed: false, reason: "A failed-closed recommendation cannot be approved as a confirmed resolution." };
  return { allowed: true, reason: "Approval transition permitted." };
}
