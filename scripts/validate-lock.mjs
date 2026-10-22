import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const raw = await readFile("package-lock.json", "utf8");
const lock = JSON.parse(raw);
for (const marker of ["pkgs.visualstudio.com", "ms-feed-", "packagefeedproxy", "pkgs.dev.azure.com"]) {
  assert.ok(!raw.toLowerCase().includes(marker), `Private registry marker found: ${marker}`);
}
const root = lock.packages?.[""];
const installed = lock.packages?.["node_modules/kovari"];
assert.equal(root?.name, "@kovari/code");
assert.equal(root?.version, "0.2.0");
assert.equal(root?.dependencies?.kovari, "^0.1.12");
assert.equal(installed?.version, "0.1.12");
assert.ok(installed?.integrity, "kovari lock entry must include integrity");
console.log("Lockfile valid");
