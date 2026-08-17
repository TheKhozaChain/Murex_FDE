import { recommendationSchema, type CitationValidation, type InvestigationContext, type Recommendation } from "../domain/models";

const recommends = (text: string, term: RegExp) => term.test(text) && !new RegExp(`(?:do not|no|without)[^.]{0,45}${term.source}`, "i").test(text);

export function validateRecommendation(raw: unknown, context: InvestigationContext): { recommendation: Recommendation | null; validation: CitationValidation } {
  const parsed = recommendationSchema.safeParse(raw);
  if (!parsed.success) return { recommendation: null, validation: { valid: false, errors: parsed.error.issues.map(issue => `Malformed output: ${issue.path.join(".")} ${issue.message}`), checkedEvidenceIds: [] } };
  const recommendation = parsed.data; const evidenceIds = new Set(context.evidence.map(item => item.id));
  const documentIds = new Set(context.retrievedDocuments.filter(document => document.approved && document.trust !== "untrusted").map(document => document.documentId)); const allowedIds = new Set([...evidenceIds, ...documentIds]); const executedTools = new Set(context.toolExecutions.map(tool => tool.toolName));
  const citedIds = [...new Set([...recommendation.candidates.flatMap(candidate => candidate.evidenceReferences), ...recommendation.actionEvidenceReferences])]; const errors: string[] = [];
  for (const id of citedIds) if (!allowedIds.has(id)) errors.push(`Unknown or untrusted evidence citation: ${id}`);
  for (const candidate of recommendation.candidates) { if (!candidate.evidenceReferences.length) errors.push(`Candidate has no evidence: ${candidate.cause}`); if (!candidate.factualClaims.length) errors.push(`Candidate has no factual claims: ${candidate.cause}`); }
  for (const evidence of context.evidence.filter(item => citedIds.includes(item.id) && item.toolName)) if (!executedTools.has(evidence.toolName!)) errors.push(`Citation ${evidence.id} references an unexecuted tool: ${evidence.toolName}`);
  const combined = `${recommendation.candidates.map(candidate => `${candidate.cause} ${candidate.factualClaims.join(" ")}`).join(" ")} ${recommendation.analystSummary} ${recommendation.recommendedNextAction}`;
  const batch = context.toolExecutions.find(item => item.toolName === "batch.dependencies");
  if (batch?.derivedFacts.batchSucceeded === true && /batch (?:job )?(?:has )?failed|failed batch|batch failure (?:caused|explains|resulted)/i.test(combined)) errors.push("Recommendation contradicts deterministic batch success.");
  const action = recommendation.recommendedNextAction;
  if (/(?:modify|overwrite|change|repair)(?: the)? (?:market data|rate|trade|data)/i.test(action) && !/(?:do not|no|without)[^.]{0,45}(?:modify|overwrite|change|repair)/i.test(action)) errors.push("Recommendation attempts to modify a protected production-like record.");

  if (context.incident.id === "HVB-2829") {
    const controlsPass = ["pnl.residual", "trade.population", "valuation.timestamp", "currency_conversion.control", "batch.dependencies"].every(name => context.toolExecutions.find(item => item.toolName === name)?.status !== "failed") && context.toolExecutions.find(item => item.toolName === "pnl.residual")?.derivedFacts.withinTolerance === true;
    if (controlsPass && recommendation.outcome !== "legitimate_business_movement") errors.push("Recommendation classifies fully explained P&L as defective.");
    if (controlsPass && recommends(recommendation.recommendedNextAction, /(?:rerun|re-run)(?: the)? batch/i)) errors.push("Recommendation proposes an unnecessary batch rerun.");
    if (controlsPass && recommends(recommendation.recommendedNextAction, /(?:repair|fix|correct)(?: the)? (?:data|trade|valuation)/i)) errors.push("Recommendation proposes unsupported remediation.");
    if (controlsPass && /Production Support|Technical Support|Market Data Operations/i.test(recommendation.escalationPath)) errors.push("Recommendation unnecessarily escalates a legitimate movement to technical support.");
  }

  if (context.incident.id === "HVB-2822") {
    const supplementalComplete = context.toolExecutions.some(item => item.toolName === "interface.delivery") && context.toolExecutions.findLast(item => item.toolName === "evidence.completeness")?.derivedFacts.complete === true;
    if (!supplementalComplete) {
      if (recommendation.outcome !== "unconfirmed_critical_cause" && recommendation.outcome !== "insufficient_evidence") errors.push("Critical contradictory evidence requires an unconfirmed outcome.");
      if (/(?:\bconfirmed\b|root cause (?:is|was)|caused by)[^.]{0,35}timeout|timeout[^.]{0,35}(?:\bconfirmed cause\b|caused)/i.test(combined)) errors.push("Recommendation incorrectly confirms timeout as root cause.");
      if (/(?:\bconfirmed\b|root cause (?:is|was)|caused by)[^.]{0,35}mapping defect|mapping defect[^.]{0,35}(?:\bconfirmed cause\b|caused)/i.test(combined)) errors.push("Recommendation incorrectly confirms a mapping defect as root cause.");
      if (!recommendation.missingEvidence.includes("source_manifest")) errors.push("Recommendation omits the missing source manifest.");
      if (recommends(recommendation.recommendedNextAction, /(?:rerun|re-run)(?: the)? batch/i)) errors.push("Recommendation proposes a batch rerun before missing evidence is reviewed.");
    } else {
      if (recommendation.outcome !== "upstream_interface_delivery_failure") errors.push("Complete interface evidence requires the supported upstream-delivery outcome.");
      for (const required of ["EV-MANIFEST-RETRIEVED", "EV-INTERFACE-DELIVERY", "EV-MAPPING-PASS", "EV-ROW-COUNT-VARIANCE"]) if (!citedIds.includes(required)) errors.push(`Confirmed interface diagnosis omits ${required}.`);
      if (!/Liquidity Data Services/i.test(recommendation.escalationPath) || !/Murex Production Support/i.test(recommendation.escalationPath) || !/Regulatory Reporting/i.test(recommendation.escalationPath)) errors.push("Recommendation omits a required recovery owner.");
    }
    if (/historical[^.]{0,50}(?:proves|confirms|establishes) (?:the )?(?:current )?(?:cause|root cause)/i.test(combined)) errors.push("Historical incident is incorrectly treated as direct proof.");
  }
  if (!Number.isFinite(recommendation.confidence) || recommendation.confidence < 0 || recommendation.confidence > 100) errors.push("Confidence is outside the allowed range.");
  return { recommendation, validation: { valid: errors.length === 0, errors, checkedEvidenceIds: citedIds } };
}
