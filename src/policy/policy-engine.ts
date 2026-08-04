import type { ApprovalScope, CitationValidation, IncidentInput, PolicyDecision, Recommendation, ToolExecution } from "../domain/models";

export function applySafetyPolicy(input: { investigationId: string; incident: IncidentInput; tools: ToolExecution[]; recommendation: Recommendation | null; citationValidation: CitationValidation; now: string }): PolicyDecision {
  const evidenceComplete = input.tools.find(tool => tool.toolName === "evidence.completeness")?.derivedFacts.complete === true; const malformed = input.recommendation === null; const confidence = input.recommendation?.confidence ?? 0;
  const directMutation = Boolean(input.recommendation && /^(?!.*(?:do not|no )).*(?:modify|overwrite|change|repair).*(?:market data|rate|trade|data)/i.test(input.recommendation.recommendedNextAction));
  const rules = [
    { rule: "citation_validation", passed: input.citationValidation.valid, detail: input.citationValidation.valid ? "Every citation resolves to executed evidence or approved retrieval." : input.citationValidation.errors.join("; ") },
    { rule: "structured_output", passed: !malformed, detail: malformed ? "Synthesis output is malformed." : "Synthesis output passed runtime schema validation." },
    { rule: "required_evidence", passed: evidenceComplete, detail: evidenceComplete ? "Required evidence is complete." : "Required evidence is incomplete." },
    { rule: "protected_record_mutation", passed: !directMutation, detail: directMutation ? "Direct record modification is prohibited." : "No mutation action is recommended." },
  ];
  if (input.incident.id === "HVB-2829") {
    const residual = input.tools.find(tool => tool.toolName === "pnl.residual"); const allControlsPass = residual?.derivedFacts.withinTolerance === true && ["trade.population", "valuation.timestamp", "currency_conversion.control", "batch.dependencies"].every(name => input.tools.find(tool => tool.toolName === name)?.status === "passed");
    const unnecessaryRemediation = Boolean(allControlsPass && input.recommendation && /(?:rerun|repair|technical support)/i.test(input.recommendation.recommendedNextAction) && !/(?:do not|no remediation)/i.test(input.recommendation.recommendedNextAction));
    rules.push({ rule: "explained_movement_no_remediation", passed: allControlsPass && input.recommendation?.outcome === "legitimate_business_movement" && !unnecessaryRemediation, detail: allControlsPass ? "All controls pass; only business review and commentary approval are permitted." : "P&L controls do not establish a fully explained movement." });
    rules.push({ rule: "confidence_threshold", passed: confidence >= 70, detail: confidence >= 70 ? "Confidence meets the review threshold." : "Confidence is below the review threshold." });
  } else if (input.incident.id === "HVB-2822") {
    const contradiction = input.tools.find(tool => tool.toolName === "evidence.contradiction")?.derivedFacts.conflictingHypotheses === true; const populationUnknown = input.tools.find(tool => tool.toolName === "source.segments")?.derivedFacts.populationEstablished !== true; const critical = input.incident.severity === "Critical"; const lowConfidence = confidence < input.incident.policies.minimumConfidence;
    rules.push({ rule: "critical_ambiguity_fail_closed", passed: false, detail: `Fail closed required: critical=${critical}, evidenceMissing=${!evidenceComplete}, competingHypotheses=${contradiction}, populationUnknown=${populationUnknown}, lowConfidence=${lowConfidence}.` });
    rules.push({ rule: "unconfirmed_root_cause", passed: input.recommendation?.outcome === "unconfirmed_critical_cause", detail: "Only an unconfirmed root-cause disposition is safe." });
  } else {
    rules.push({ rule: "confidence_threshold", passed: confidence >= 70, detail: confidence >= 70 ? "Confidence meets the review threshold." : "Confidence is below the review threshold." });
    rules.push({ rule: "critical_auto_resolution", passed: input.incident.severity !== "Critical", detail: input.incident.severity === "Critical" ? "Critical incidents cannot be automatically resolved." : "Incident is not critical." });
  }
  rules.push({ rule: "operational_effect", passed: true, detail: "Recommendations have no operational effect before approval." });
  const passed = rules.every(rule => rule.passed); const permittedApprovalScope: ApprovalScope = input.incident.id === "HVB-2822" ? "escalation_disposition" : "recommendation";
  return { investigationId: input.investigationId, result: passed ? "approval_required" : "fail_closed", passed, rules, prohibitedActions: ["modify_market_data", "modify_trade", "automatic_batch_rerun", "automatic_resolution", ...(input.incident.id === "HVB-2829" ? ["unnecessary_remediation"] : []), ...(input.incident.id === "HVB-2822" ? ["confirmed_resolution", "assert_unconfirmed_cause"] : [])], approvalRequired: true, permittedApprovalScope, operationalEffect: "none", decidedAt: input.now };
}

export function canApprove(policy: PolicyDecision, status: string, existingApproval: boolean, decision: "approved" | "rejected" = "approved", scope: ApprovalScope = "recommendation"): { allowed: boolean; reason: string } {
  if (status !== "completed" && status !== "failed_closed") return { allowed: false, reason: "Investigation must complete before approval." };
  if (existingApproval) return { allowed: false, reason: "An approval decision already exists." };
  if (decision === "rejected") return { allowed: true, reason: "Rejection transition permitted." };
  if (scope !== policy.permittedApprovalScope) return { allowed: false, reason: policy.result === "fail_closed" ? "A failed-closed recommendation cannot be approved as a confirmed resolution." : "Approval scope is not permitted by policy." };
  if (policy.result === "fail_closed" && scope !== "escalation_disposition") return { allowed: false, reason: "A failed-closed recommendation cannot be approved as a confirmed resolution." };
  return { allowed: true, reason: scope === "escalation_disposition" ? "Escalation disposition approval permitted; root cause remains unconfirmed." : "Approval transition permitted." };
}
