import { recommendationSchema, type CitationValidation, type InvestigationContext, type Recommendation } from "../domain/models";

export function validateRecommendation(raw: unknown, context: InvestigationContext): { recommendation: Recommendation | null; validation: CitationValidation } {
  const parsed = recommendationSchema.safeParse(raw);
  if (!parsed.success) return { recommendation: null, validation: { valid: false, errors: parsed.error.issues.map(issue => `Malformed output: ${issue.path.join(".")} ${issue.message}`), checkedEvidenceIds: [] } };
  const recommendation = parsed.data;
  const evidenceIds = new Set(context.evidence.map(item => item.id));
  const documentIds = new Set(context.retrievedDocuments.filter(document => document.approved && document.trust !== "untrusted").map(document => document.documentId));
  const allowedIds = new Set([...evidenceIds, ...documentIds]);
  const executedTools = new Set(context.toolExecutions.map(tool => tool.toolName));
  const citedIds = [...new Set([
    ...recommendation.candidates.flatMap(candidate => candidate.evidenceReferences),
    ...recommendation.actionEvidenceReferences,
  ])];
  const errors: string[] = [];
  for (const id of citedIds) if (!allowedIds.has(id)) errors.push(`Unknown or untrusted evidence citation: ${id}`);
  for (const candidate of recommendation.candidates) {
    if (!candidate.evidenceReferences.length) errors.push(`Candidate has no evidence: ${candidate.cause}`);
    if (!candidate.factualClaims.length) errors.push(`Candidate has no factual claims: ${candidate.cause}`);
  }
  for (const evidence of context.evidence.filter(item => citedIds.includes(item.id) && item.toolName)) {
    if (!executedTools.has(evidence.toolName!)) errors.push(`Citation ${evidence.id} references an unexecuted tool: ${evidence.toolName}`);
  }
  const batch = context.toolExecutions.find(tool => tool.toolName === "batch.dependencies");
  const combinedClaims = `${recommendation.candidates.flatMap(candidate => candidate.factualClaims).join(" ")} ${recommendation.analystSummary}`;
  if (batch?.derivedFacts.batchSucceeded === true && /batch (?:job )?(?:has )?failed|failed batch|batch failure (?:caused|explains|resulted)/i.test(combinedClaims)) errors.push("Recommendation contradicts deterministic batch success.");
  if (/modify|overwrite|change|repair/.test(recommendation.recommendedNextAction.toLowerCase()) && /market data|rate|trade/.test(recommendation.recommendedNextAction.toLowerCase())) errors.push("Recommendation attempts to modify a protected production-like record.");
  if (!Number.isFinite(recommendation.confidence) || recommendation.confidence < 0 || recommendation.confidence > 100) errors.push("Confidence is outside the allowed range.");
  return { recommendation, validation: { valid: errors.length === 0, errors, checkedEvidenceIds: citedIds } };
}
