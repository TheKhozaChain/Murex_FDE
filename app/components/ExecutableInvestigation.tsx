"use client";

import { useEffect, useMemo, useState } from "react";
import type { InvestigationRun } from "../../src/domain/models";
import { incidents, type Incident } from "../data";

function Tag({ children, tone = "slate" }: { children: React.ReactNode; tone?: string }) { return <span className={`tag tag-${tone}`}>{children}</span>; }
function Empty({ title, text }: { title: string; text: string }) { return <div className="empty"><i>◇</i><h3>{title}</h3><p>{text}</p></div>; }

export function ExecutableInvestigation({ incident, selectIncident }: { incident: Incident; selectIncident: (incident: Incident) => void }) {
  const [run, setRun] = useState<InvestigationRun | null>(null);
  const [tab, setTab] = useState<"evidence" | "recommendation" | "approval" | "audit">("evidence");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/investigations?incidentId=HVB-2847").then(async response => response.ok ? await response.json() as { run: InvestigationRun | null } : null).then(data => { if (data?.run) setRun(data.run); }).catch(() => undefined);
  }, []);
  const evidence = useMemo(() => [
    ...(run?.evidence ?? []),
    ...(run?.retrievedDocuments ?? []).map(document => ({ id: document.documentId, kind: "runbook", title: document.title, detail: document.excerpt, source: `${document.trust} · v${document.version}`, signal: "supports" as const })),
  ], [run]);
  const recommendation = run?.recommendation;
  const failClosed = run?.status === "failed_closed";

  async function execute() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/investigations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ incidentId: "HVB-2847" }) });
      const data = await response.json() as { run?: InvestigationRun; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Investigation failed.");
      setRun(data.run!); setTab("recommendation");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Investigation failed safely."); }
    finally { setLoading(false); }
  }

  async function decide(decision: "approved" | "rejected") {
    if (!run) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/approvals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ runId: run.id, decision, comment: "Reviewed in the public synthetic demonstration." }) });
      const data = await response.json() as { run?: InvestigationRun; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Decision rejected.");
      setRun(data.run!); setTab("audit");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Decision rejected safely."); }
    finally { setLoading(false); }
  }

  return <>
    <header className="page-head"><div><div className="eyebrow">Stage 3 · Deploy · Executable vertical slice</div><h1>Exception investigation</h1><p>Server-side deterministic controls, local retrieval, cited mock synthesis, D1 persistence, and accountable approval.</p></div><div className="head-actions"><select aria-label="Select incident" value={incident.id} onChange={event => selectIncident(incidents.find(item => item.id === event.target.value)!)} className="select">{incidents.map(item => <option key={item.id}>{item.id}</option>)}</select><button className="primary" onClick={execute} disabled={loading}>{loading ? "Running safely…" : "Run executable investigation"}</button></div></header>
    {error && <div className="error-banner"><strong>Safe stop</strong><span>{error}</span></div>}
    <div className="context-strip"><div><span>INCIDENT</span><strong>{incident.id}</strong></div><div><span>REPORT</span><strong>{incident.report}</strong></div><div><span>BUSINESS DATE</span><strong>{incident.businessDate}</strong></div><div><span>RUN</span><strong>{run ? run.id.slice(0, 8) : "Not started"}</strong></div><div><span>MODE</span><Tag tone="green">Measured + persisted</Tag></div></div>
    <section className="incident-summary"><div><div className="row-title"><h2>{incident.title}</h2><Tag tone="green">Executable</Tag></div><p>{incident.description}</p></div><div className="impact"><span>Input, not conclusion</span><strong>18.4% movement requires investigation; root cause and exposure are derived server-side.</strong></div></section>
    <div className="stepper" aria-label="Investigation stages">{["Validate", "Gather", "Retrieve", "Synthesize", "Approve", "Record"].map((step, index) => <div key={step} className={run ? "done" : index === 0 ? "done" : ""}><i>{index + 1}</i><span>{step}</span></div>)}</div>
    <div className="workspace-grid"><aside className="control-panel"><div className="panel-title"><span>ACTUAL CONTROL RUN</span><Tag tone={run?.status === "completed" ? "green" : failClosed ? "red" : "slate"}>{run?.status ?? "Not run"}</Tag></div>
      {run ? run.toolExecutions.map(tool => <div className="control-row" key={tool.id}><i className={tool.status === "passed" ? "ok-dot" : tool.status === "warning" ? "warn-dot" : "error-dot"}></i><div><span>{tool.toolName}</span><strong>{tool.status} · {tool.durationMs}ms</strong></div></div>) : <div className="control-row"><i className="pending-dot"></i><div><span>Server workflow</span><strong>Awaiting execution</strong></div></div>}
      <div className="boundary-note"><span>PRODUCTION BOUNDARY</span><p>No production mutation capability exists. The public demo identity is not production authentication.</p></div>
    </aside><section className="main-panel"><div className="tabs">{(["evidence", "recommendation", "approval", "audit"] as const).map(item => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}{item === "evidence" && <b>{evidence.length}</b>}</button>)}</div>
      {tab === "evidence" && (evidence.length ? <div className="evidence-list">{evidence.map(item => <article key={item.id}><div className="evidence-icon">{item.kind.slice(0, 1).toUpperCase()}</div><div><div className="evidence-meta"><Tag tone={item.signal === "contradicts" ? "red" : item.signal === "supports" ? "green" : "slate"}>{item.signal}</Tag><span>{item.id} · {item.kind}</span></div><h3>{item.title}</h3><p>{item.detail}</p><small>Source: {item.source}</small></div><button aria-label={`Evidence ${item.id}`}>↗</button></article>)}</div> : <Empty title="No executed evidence yet" text="Run HVB-2847 to derive evidence from structured synthetic inputs." />)}
      {tab === "recommendation" && (!recommendation ? <Empty title="No structured recommendation yet" text="The server must complete validation, tools, retrieval, synthesis, citation validation, and policy first." /> : <div className="recommendation"><div className="rec-head"><div><span>STRUCTURED RECOMMENDATION · {run?.provider}</span><h2>{failClosed ? "Failed closed — root cause not confirmed" : recommendation.candidates[0].cause}</h2></div><div className={`confidence ${failClosed ? "low" : ""}`}><strong>{recommendation.confidence}%</strong><span>validated confidence</span></div></div><div className="claim"><span>DERIVED ASSESSMENT</span><p>{recommendation.analystSummary} {recommendation.candidates[0].evidenceReferences.map(id => <button key={id} onClick={() => setTab("evidence")}>[{id}]</button>)}</p></div><div className="claim"><span>RECOMMENDED NEXT ACTION</span><p>{recommendation.recommendedNextAction} {recommendation.actionEvidenceReferences.map(id => <button key={id} onClick={() => setTab("evidence")}>[{id}]</button>)}</p></div><div className="guardrail"><strong>Policy: {run?.policyDecision?.result}</strong><p>{recommendation.uncertaintyExplanation}</p></div><button className="primary" onClick={() => setTab("approval")}>{failClosed ? "Review failed-closed result" : "Review for approval"}</button></div>)}
      {tab === "approval" && (!run?.policyDecision || !recommendation ? <Empty title="No recommendation awaiting decision" text="Complete the executable workflow first." /> : <div className="approval"><div className="approval-banner"><i>!</i><div><strong>{failClosed ? "Approval prohibited by policy" : "Human decision required"}</strong><p>Recommendations have no operational effect. Identity is the labelled demo persona, not authentication.</p></div></div><dl><div><dt>Proposed action</dt><dd>{recommendation.recommendedNextAction}</dd></div><div><dt>Escalation path</dt><dd>{recommendation.escalationPath}</dd></div><div><dt>Evidence snapshot</dt><dd>{run.citationValidation?.checkedEvidenceIds.join(", ")}</dd></div><div><dt>Policy result</dt><dd>{run.policyDecision.result} · operational effect: none</dd></div></dl>{run.approval ? <div className={`decision-record ${run.approval.decision}`}><strong>Recommendation {run.approval.decision}</strong><span>{run.approval.identity} · {new Date(run.approval.decidedAt).toLocaleString()}</span></div> : !failClosed && <div className="decision-actions"><button className="primary" disabled={loading} onClick={() => decide("approved")}>Accept recommendation</button><button className="secondary danger" disabled={loading} onClick={() => decide("rejected")}>Reject</button></div>}</div>)}
      {tab === "audit" && <div className="audit"><div className="audit-head"><h3>Persisted append-only activity record</h3><Tag tone="green">Redacted safe view</Tag></div>{run?.auditEvents.length ? run.auditEvents.map(event => <div key={event.id}><span>{String(event.sequence).padStart(2, "0")}</span><p>{new Date(event.occurredAt).toLocaleTimeString()} · {event.summary}</p><code>{event.eventType}</code></div>) : <Empty title="No persisted activity yet" text="Server workflow events appear here after execution." />}</div>}
    </section></div>
  </>;
}
