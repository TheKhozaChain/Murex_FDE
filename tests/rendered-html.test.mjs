import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Murex FDE Workbench", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Murex FDE Workbench/);
  assert.match(html, /HarbourView Bank/);
  assert.match(html, /Run controlled investigation/);
  assert.match(html, /No production connectivity/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the required scenarios, boundaries, and documentation", async () => {
  const [page, data, readme, plan] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/data.ts", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../PLAN.md", import.meta.url), "utf8"),
  ]);
  for (const id of ["HVB-2847", "HVB-2841", "HVB-2836", "HVB-2829", "HVB-2822"]) assert.match(data, new RegExp(id));
  assert.match(page, /Fail closed/);
  assert.match(page, /Human decision required/);
  assert.match(page, /Immutable activity record/);
  assert.match(readme, /not affiliated with or endorsed by Murex/i);
  assert.match(plan, /select an incident, gather deterministic evidence/i);
});
