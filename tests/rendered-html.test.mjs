import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import test, { after, before } from "node:test";

const previewUrl = "http://127.0.0.1:4179/";
let preview;

before(async () => {
  preview = spawn("npx", ["vinext", "dev", "--port", "4179"], { cwd: new URL("../", import.meta.url), env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/test.log" }, stdio: "ignore" });
  for (let attempt = 0; attempt < 80; attempt++) {
    try { const response = await fetch(previewUrl); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the Cloudflare-compatible preview.");
});

after(() => preview?.kill("SIGTERM"));

async function render() { return fetch(previewUrl, { headers: { accept: "text/html" } }); }

test("server-renders the Murex FDE Workbench", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Murex FDE Workbench/);
  assert.match(html, /HarbourView Bank/);
  assert.match(html, /Start investigation/);
  assert.match(html, /No production connectivity/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the required scenarios, boundaries, and documentation", async () => {
  const [page, data, readme, plan] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../data/scenarios.ts", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../PLAN.md", import.meta.url), "utf8"),
  ]);
  for (const id of ["HVB-2847", "HVB-2841", "HVB-2836", "HVB-2829", "HVB-2822"]) assert.match(data, new RegExp(id));
  assert.match(page, /Fail closed/);
  assert.match(page, /Start one-click tour/);
  for (const id of ["HVB-2847", "HVB-2829", "HVB-2822"]) assert.match(page, new RegExp(id));
  assert.match(page, /Evidence-backed assistance, accountable decisions/);
  const executable = await readFile(new URL("../app/components/ExecutableInvestigation.tsx", import.meta.url), "utf8");
  assert.match(executable, /Human approval is a real execution boundary/);
  assert.match(executable, /Request more investigation/);
  assert.match(executable, /Execute approved synthetic recovery/);
  assert.match(executable, /Resolved only after controls pass/);
  assert.match(executable, /refresh_fx_market_data_and_rerun_risk_controls/);
  assert.match(executable, /SIMULATED \/ SYNTHETIC REMEDIATION/);
  const workflow = await readFile(new URL("../src/investigation/workflow.ts", import.meta.url), "utf8");
  assert.match(workflow, /deterministic_resolution_policy/);
  assert.match(workflow, /Requested remediation action is not allow-listed/);
  assert.match(executable, /Persisted append-only activity record/);
  assert.match(readme, /not affiliated with or endorsed by Murex/i);
  assert.match(plan, /server-side investigation workflow/i);
});
