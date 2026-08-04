import { spawnSync } from "node:child_process";
import { hvb2847Input } from "../data/incidents/hvb-2847";
import { hvb2829Input } from "../data/incidents/hvb-2829";
import { hvb2822Input } from "../data/incidents/hvb-2822";

const escapeSql = (value: string) => value.replaceAll("'", "''");
for (const incident of [hvb2847Input, hvb2829Input, hvb2822Input]) {
  const sql = `INSERT OR REPLACE INTO incidents (id, payload_json, seeded_at) VALUES ('${escapeSql(incident.id)}', '${escapeSql(JSON.stringify(incident))}', '${new Date().toISOString()}')`;
  const result = spawnSync("wrangler", ["d1", "execute", "site-creator-d1", "--local", "--command", sql], { stdio: "inherit", shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("Seeded three synthetic executable incidents into the local D1 database.");
