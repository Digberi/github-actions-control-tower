import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const gate = process.argv[2] ?? "G03";
const mode = process.argv[3] ?? "green";
if (!["G03", "G04"].includes(gate) || !["green", "red"].includes(mode)) {
  process.stderr.write("Usage: node scripts/quality-check.mjs G03|G04 green|red\n");
  process.exit(2);
}

const bin = process.env.QUALITY_TOOL_BIN ?? path.join(root, "node_modules", ".bin");
const executable = process.platform === "win32" ? ".cmd" : "";
const target = mode === "red" ? "red" : "green";
const commands = gate === "G03"
  ? [
      ["eslint", ["src", "quality/style/" + target + ".mjs"]],
      ["prettier", ["--check", "src", "quality/style/" + target + ".mjs"]]
    ]
  : [
      ["tsc", ["--noEmit", "--project", "quality/types/tsconfig.src.json"]],
      ["tsc", ["--noEmit", "--project", "quality/types/tsconfig." + target + ".json"]]
    ];

let failed = false;
let missingTool = false;
const outcomes = [];
for (const [command, args] of commands) {
  const full = path.join(bin, command + executable);
  const result = spawnSync(full, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 60000,
    env: process.env
  });
  const code = result.status ?? 127;
  if (code !== 0) failed = true;
  if (result.error) missingTool = true;
  const output = (result.stdout ?? "") + (result.stderr ?? "") +
    (result.error ? result.error.message + "\n" : "");
  if (output) process.stdout.write(output);
  outcomes.push({ tool: command, args, exitCode: code });
}

const evidence = {
  gate, mode,
  source: process.env.GITHUB_ACTIONS === "true" ? "GITHUB_REAL" : "LOCAL",
  expectedExit: mode === "green" ? 0 : 1,
  // Missing npm tools are setup errors, never a successful RED demonstration.
  actualExit: missingTool ? 2 : failed ? 1 : 0,
  tools: outcomes,
  timestamp: new Date().toISOString(),
  workflowRunUrl: process.env.GITHUB_RUN_ID
    ? "https://github.com/" + process.env.GITHUB_REPOSITORY + "/actions/runs/" + process.env.GITHUB_RUN_ID
    : null,
  note: "Strict application src/*.mjs checks plus isolated RED/GREEN fixtures; scripts and tests are outside this gate."
};
mkdirSync(path.join(root, "reports"), { recursive: true });
const report = "reports/quality-" + gate + "-" + mode + ".json";
writeFileSync(path.join(root, report), JSON.stringify(evidence, null, 2) + "\n");
process.stdout.write(JSON.stringify({ gate, mode, actualExit: evidence.actualExit, report }) + "\n");
process.exitCode = evidence.actualExit;
