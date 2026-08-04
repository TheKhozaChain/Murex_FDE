import { localDocuments, type LocalDocument } from "../../data/runbooks/documents";
import type { RetrievalResult } from "../domain/models";

const injectionPatterns = [/ignore previous instructions/i, /mark the incident resolved/i, /change the .* rate directly/i];
const stopWords = new Set(["the", "and", "for", "with", "from", "this", "that", "report"]);

export function tokenize(value: string): string[] {
  return [...new Set(value.toLowerCase().replace(/[^a-z0-9/.-]+/g, " ").split(/\s+/).filter(token => token.length > 2 && !stopWords.has(token)))];
}

export function containsInstructionLikeContent(value: string): boolean {
  return injectionPatterns.some(pattern => pattern.test(value));
}

export function rankDocuments(query: string, documents: LocalDocument[] = localDocuments, limit = 4): RetrievalResult[] {
  const queryTokens = tokenize(query);
  return documents.map(document => {
    const searchable = tokenize(`${document.title} ${document.tags.join(" ")} ${document.body}`);
    const matchedTerms = queryTokens.filter(token => searchable.includes(token));
    const tagMatches = queryTokens.filter(token => document.tags.includes(token)).length;
    const trustBoost = document.trust === "approved_internal" ? 4 : document.trust === "historical" ? 2 : -8;
    const injectionPenalty = containsInstructionLikeContent(document.body) ? 20 : 0;
    const relevanceScore = Math.max(0, matchedTerms.length * 2 + tagMatches * 2 + trustBoost - injectionPenalty);
    return {
      documentId: document.id, title: document.title, version: document.version, approved: document.approved,
      trust: document.trust, relevanceScore, matchedTerms,
      excerpt: document.body.slice(0, 280),
    } satisfies RetrievalResult;
  }).filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || a.documentId.localeCompare(b.documentId))
    .slice(0, limit);
}

export function retrieveGuidance(): RetrievalResult[] {
  return rankDocuments("stale FX USD/JPY market data risk exposure report distribution hold escalation approval");
}
