export type Evidence = {
  id: string;
  kind: "Batch" | "Market data" | "Reconciliation" | "Trade" | "Log" | "Runbook" | "History";
  title: string;
  detail: string;
  signal: "supports" | "contradicts" | "context";
  source: string;
};

export type Incident = {
  id: string;
  title: string;
  report: string;
  area: string;
  severity: "Critical" | "High" | "Medium";
  status: string;
  businessDate: string;
  owner: string;
  age: string;
  description: string;
  impact: string;
  rootCause: string;
  confidence: number;
  action: string;
  escalation: string;
  guardrail: string;
  evidence: Evidence[];
};

export const incidents: Incident[] = [
  {
    id: "HVB-2847", title: "Unexpected FX delta movement", report: "Daily Market Risk", area: "Risk", severity: "High", status: "Awaiting triage", businessDate: "03 Aug 2026", owner: "Market Risk Control", age: "42m",
    description: "AUD-equivalent delta increased 18.4% across the Asia FX portfolio after the morning risk cycle.", impact: "AUD 12.8m gross exposure is affected; no regulatory submission is due before 14:00.", rootCause: "Stale USD/JPY closing rate in the APAC market-data set", confidence: 92, action: "Escalate the stale rate to Market Data Operations and hold report distribution pending confirmation.", escalation: "Market Data Operations", guardrail: "Do not assert valuations are incorrect until the refreshed rate is confirmed and the risk cycle is rerun.",
    evidence: [
      { id: "EV-101", kind: "Market data", title: "USD/JPY timestamp breach", detail: "Rate timestamp 31 Jul 22:00 UTC; freshness policy requires a value after 03 Aug 07:00 AEST.", signal: "supports", source: "Synthetic market snapshot md_apac_0803" },
      { id: "EV-102", kind: "Reconciliation", title: "Exposure concentration", detail: "93% of the movement maps to USD/JPY-sensitive positions; calculated impact AUD 12.8m.", signal: "supports", source: "Deterministic exposure reconciliation" },
      { id: "EV-103", kind: "Batch", title: "Valuation cycle completed", detail: "RISK_APAC_010 completed successfully at 08:31 with all dependencies green.", signal: "context", source: "Synthetic batch ledger" },
      { id: "RB-17", kind: "Runbook", title: "Stale market-data response", detail: "Verify timestamp, quantify affected exposure, contact Market Data Operations, and hold distribution. Never alter a rate from support tooling.", signal: "supports", source: "HVB-RUNBOOK-017 · approved 12 Jun 2026" },
    ],
  },
  {
    id: "HVB-2841", title: "Partial trade population", report: "Finance P&L Attribution", area: "Finance", severity: "High", status: "Investigating", businessDate: "03 Aug 2026", owner: "Product Control", age: "1h 18m",
    description: "The rates population is 184 records below the source control total.", impact: "AUD 4.2m net present value omitted from the draft report.", rootCause: "Partial completion of the upstream trade extraction", confidence: 96, action: "Follow the approved extraction recovery procedure, then rerun reconciliation after analyst approval.", escalation: "Trade Data Services", guardrail: "Automatic repair or insertion of missing trades is prohibited.",
    evidence: [
      { id: "EV-201", kind: "Reconciliation", title: "Population shortfall", detail: "Expected 28,441 trades; received 28,257. Missing IDs share the IRD-SYD partition.", signal: "supports", source: "Count reconciliation v3" },
      { id: "EV-202", kind: "Batch", title: "Extraction dependency incomplete", detail: "TRADE_EXTRACT_IRD ended PARTIAL at 07:48 after 9 of 10 partitions.", signal: "supports", source: "Synthetic batch ledger" },
      { id: "RB-04", kind: "Runbook", title: "Partial extraction recovery", detail: "Confirm source availability, obtain Production Control approval, rerun failed partition, reconcile before release.", signal: "supports", source: "HVB-RUNBOOK-004 · approved 02 May 2026" },
    ],
  },
  {
    id: "HVB-2836", title: "Duplicate settlement rows", report: "Operations Cashflows", area: "Operations", severity: "Medium", status: "Awaiting triage", businessDate: "03 Aug 2026", owner: "Settlements Control", age: "2h 06m",
    description: "Cashflow report contains 76 duplicate rows concentrated in repo maturities.", impact: "Potential AUD 8.7m gross overstatement in an internal operations view; payment system is unaffected.", rootCause: "Likely non-unique counterparty mapping join", confidence: 78, action: "Escalate the mapping hypothesis and duplicate-key sample to Reporting Support for confirmation.", escalation: "Reporting Support", guardrail: "Treat the join cause as a hypothesis until configuration evidence is supplied.",
    evidence: [
      { id: "EV-301", kind: "Reconciliation", title: "Duplicate signature", detail: "76 rows repeat on trade ID, cashflow date, currency, and amount; all have two counterparty-map values.", signal: "supports", source: "Duplicate detector v2" },
      { id: "HI-88", kind: "History", title: "Similar incident HVB-2612", detail: "A non-unique counterparty mapping produced the same two-row signature in May.", signal: "context", source: "Sanitised incident history" },
      { id: "EV-302", kind: "Log", title: "No runtime error", detail: "Report completed without database or rendering errors.", signal: "context", source: "Synthetic report log" },
    ],
  },
  {
    id: "HVB-2829", title: "Large commodities P&L movement", report: "Trading P&L Flash", area: "Finance", severity: "Medium", status: "Under review", businessDate: "03 Aug 2026", owner: "Commodities Control", age: "3h 12m",
    description: "Crude derivatives desk reports a AUD 6.1m day-on-day P&L movement.", impact: "Movement exceeds the review threshold but reconciles to price and position sensitivities.", rootCause: "Legitimate market movement on a concentrated crude position", confidence: 94, action: "Accept as explained after Product Control review; publish the cited stakeholder explanation.", escalation: "Product Control review only", guardrail: "No remediation recommended; threshold breaches are not automatically errors.",
    evidence: [
      { id: "EV-401", kind: "Market data", title: "Crude curve move", detail: "Front-month synthetic crude price moved 4.7% day on day.", signal: "supports", source: "Synthetic market snapshot" },
      { id: "EV-402", kind: "Trade", title: "Position sensitivity", detail: "Desk delta explains AUD 5.8m; carry and new trades explain the remaining AUD 0.3m.", signal: "supports", source: "Deterministic P&L explain" },
      { id: "EV-403", kind: "Reconciliation", title: "Full population confirmed", detail: "Trade counts, valuation timestamps, and currency conversion controls all passed.", signal: "supports", source: "Daily control pack" },
    ],
  },
  {
    id: "HVB-2822", title: "Conflicting timeout diagnosis", report: "Liquidity Coverage Pack", area: "Regulatory", severity: "Critical", status: "Escalated", businessDate: "03 Aug 2026", owner: "Regulatory Reporting", age: "4h 01m",
    description: "Logs indicate a source timeout; a similar incident points to a mapping defect. Required source manifest is missing.", impact: "Regulatory pack may miss the internal sign-off window.", rootCause: "Unconfirmed — evidence is insufficient and contradictory", confidence: 41, action: "Fail closed. Obtain the missing source manifest and escalate to Production Support and Regulatory Reporting.", escalation: "Incident Commander + Regulatory Reporting", guardrail: "Critical severity and low confidence prohibit root-cause confirmation or rerun recommendation.",
    evidence: [
      { id: "EV-501", kind: "Log", title: "Source read timeout", detail: "Liquidity source reader exceeded 120 seconds on segment 14.", signal: "supports", source: "Synthetic application log" },
      { id: "HI-91", kind: "History", title: "Prior mapping failure", detail: "A July incident showed the same terminal message but was traced to a currency mapping defect.", signal: "contradicts", source: "Sanitised incident history" },
      { id: "EV-502", kind: "Reconciliation", title: "Source manifest unavailable", detail: "Expected segment manifest was not delivered, so population completeness cannot be established.", signal: "contradicts", source: "Input completeness control" },
    ],
  },
];

export const workflow = [
  ["01", "Trade capture", "Front Office", "Validated transactions", "Static validation", "Amendment exceptions", "18m"],
  ["02", "Market data load", "Market Data Ops", "Curves & fixings", "Freshness checks", "Source selection", "31m"],
  ["03", "Valuation cycle", "Production Support", "Valuation results", "Batch orchestration", "Failure triage", "44m"],
  ["04", "Reporting datasets", "Reporting Support", "Controlled populations", "Count controls", "Mapping diagnosis", "67m"],
  ["05", "Report execution", "Production Support", "Report artefacts", "Schedule checks", "Timeout response", "29m"],
  ["06", "Reconciliation", "Risk / Finance / Ops", "Control results", "Numeric comparisons", "Materiality review", "83m"],
  ["07", "Distribution", "Business Control", "Approved reports", "Entitlement rules", "Release decision", "12m"],
  ["08", "Exception investigation", "Support Analyst", "Evidence-backed case", "Evidence collection", "Cause assessment", "126m"],
  ["09", "Resolve or escalate", "Control Owner", "Approved disposition", "State transition", "Risk acceptance", "38m"],
];

export const opportunities = [
  ["Structured batch status parsing", "Deterministic automation", 92, "Stable status codes; no judgment required"],
  ["Numeric reconciliation & thresholds", "Deterministic automation", 96, "Reproducible arithmetic and configured policy"],
  ["Runbook & incident-note search", "AI-assisted judgment", 83, "Unstructured language with inspectable retrieval"],
  ["Candidate cause ranking", "AI-assisted judgment", 76, "Useful synthesis only when grounded in evidence"],
  ["Critical batch rerun", "Human-only decision", 38, "Material production action requires accountable approval"],
  ["Trade or market-data modification", "Unsuitable for automation", 12, "Demo must never mutate production-like records"],
  ["Inconsistent ownership handoffs", "Process redesign first", 54, "Automation would preserve an unclear operating model"],
];

export const evaluationMetrics = [
  ["Root-cause recall", "91%", "+6pp", "quality"], ["Root-cause precision", "88%", "+4pp", "quality"],
  ["Evidence grounding", "100%", "target met", "safe"], ["Unsupported claims", "0.0%", "target met", "safe"],
  ["Correct escalation", "97%", "+3pp", "safe"], ["Prohibited actions", "0.0%", "target met", "safe"],
  ["Summary completeness", "93%", "+8pp", "quality"], ["Analyst acceptance", "84%", "simulated", "value"],
];

export const interviews = [
  ["Maya Chen", "Support analyst", "Most time is spent proving which system did not cause the break.", "Says report owners usually know first."],
  ["Daniel Okafor", "Reporting specialist", "Mapping changes are visible, but the handover rarely explains business intent.", "Says Production Support knows first."],
  ["Elena Rossi", "Risk manager", "Fast is useful; explainable and reversible is mandatory.", "Believes risk thresholds are consistent."],
  ["Priya Nair", "Finance user", "A technically complete report can still be unusable if P&L commentary arrives late.", "Says materiality varies by desk."],
  ["Tom Williams", "Operations user", "Duplicate cashflows are urgent even when no payment was released.", "Sees manual controls as reliable."],
  ["Aisha Rahman", "Production manager", "The real bottleneck is unclear decision ownership at 8am.", "Sees manual controls as fragile."],
];
