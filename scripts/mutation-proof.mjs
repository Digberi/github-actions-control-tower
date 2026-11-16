// A deliberate single-mutant proof, not a replacement for a complete Stryker run.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const child = spawnSync(process.execPath, ["--test", "tests/property.test.mjs"], {
  encoding: "utf8",
  env: { ...process.env, CI_DEMO_SCENARIO: "unit" },
  timeout: 30_000,
  maxBuffer: 8 * 1024 * 1024
});
const output = (child.stdout ?? "") + (child.stderr ?? "");
const mutantKilled = child.status === 1 &&
  /not ok\s+\d+\s+-\s+G05/.test(output) &&
  /assertion|Expected values|AssertionError/i.test(output);
const report = {
  check: "single-controlled-mutation-proof",
  mutation: "CI_DEMO_SCENARIO=unit -> calculateTotal adds one cent",
  expected: "property suite detects mutation via failing assertions",
  processExitCode: child.status,
  killed: mutantKilled,
  error: child.error?.message ?? null,
  outputSnippet: output.slice(-2400)
};
mkdirSync("reports", { recursive: true });
writeFileSync("reports/mutation-proof.json", JSON.stringify(report, null, 2) + "\n");
console.log(`Single mutant ${mutantKilled ? "KILLED (test assertion failed)" : "SURVIVED OR INFRA ERROR"}`);
if (!mutantKilled) process.exitCode = 1;
