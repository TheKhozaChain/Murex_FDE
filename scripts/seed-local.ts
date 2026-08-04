import { spawnSync } from "node:child_process";
import { hvb2847Input } from "../data/incidents/hvb-2847";

const escapeSql = (value: string) => value.replaceAll("'", "''");
const sql = `INSERT OR REPLACE INTO incidents (id, payload_json, seeded_at) VALUES ('${escapeSql(hvb2847Input.id)}', '${escapeSql(JSON.stringify(hvb2847Input))}', '${new Date().toISOString()}')`;
const result = spawnSync("wrangler", ["d1", "execute", "site-creator-d1", "--local", "--command", sql], { stdio: "inherit", shell: false });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Seeded synthetic incident HVB-2847 into the local D1 database.");
