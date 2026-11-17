// Real dependency-cruiser G14/G15 validation, not a regex-based demonstration.
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv[2] ?? "green";
if (!new Set(["green", "red"]).has(mode)) {
  console.error("Usage: node scripts/depgraph-check.mjs green|red");
  process.exit(2);
}

const root = resolve(import.meta.dirname, "..");
const targets = mode === "red" ? ["src", "fixtures/depgraph/red"] : ["src"];
const include = mode === "red" ? "^(src|fixtures/depgraph/red)" : "^src";
const bin = resolve(root, "node_modules/.bin/depcruise");
const args = [
  "--config", ".dependency-cruiser.cjs",
  "--include-only", include,
];
const opts = { cwd: root, encoding: "utf8", timeout: 60_000 };
// The JSON reporter emits a machine-readable graph, but deliberately exits 0
// on some versions even for errors. Run the validating `err-long` reporter
// separately and REQUIRE its non-zero exit. This is not an ornamental check.
const run = spawnSync(bin, [...args, "--output-type", "json", ...targets], opts);
const validation = spawnSync(bin, [...args, "--output-type", "err-long", ...targets], opts);

let graph;
try {
  graph = JSON.parse(run.stdout ?? "");
} catch {
  console.error(`G14/G15 scanner could not produce valid JSON: ${run.stderr || run.error?.message || "unknown error"}`);
  process.exit(2);
}

const violations = graph.summary?.violations ?? [];
const status = validation.status ?? 2;
const advisedExitCode = graph.summary?.advisedExitCode;
const evidence = {
  gates: ["G14", "G15"],
  mode,
  source: "ACTUAL_DEPENDENCY_CRUISER_GRAPH",
  scannerExitCode: status,
  scannerAdvisedExitCode: advisedExitCode,
  modules: graph.summary?.totalCruised ?? null,
  dependencies: graph.summary?.totalDependenciesCruised ?? null,
  violations: violations.map(v => ({
    rule: v.rule?.name,
    severity: v.rule?.severity,
    type: v.type,
    from: v.from,
    to: v.to,
    cycle: v.cycle?.map(edge => edge.name) ?? []
  }))
};
mkdirSync(resolve(root, "reports"), { recursive: true });
writeFileSync(resolve(root, `reports/depcruise-${mode}.json`), JSON.stringify(graph, null, 2) + "\n");
writeFileSync(resolve(root, `reports/g14-g15-${mode}.json`), JSON.stringify(evidence, null, 2) + "\n");
console.log(`G14/G15 ${mode}: ${evidence.modules} modules, ${evidence.dependencies} edges, ${violations.length} rule violations; scanner exit ${status}`);
if (validation.stdout) console.log(validation.stdout);
if (validation.stderr) console.error(validation.stderr);
for (const violation of evidence.violations) {
  console.error(`${violation.rule}: ${violation.from} -> ${violation.to}`);
}
// A missing source graph or a broken scanner is not a green pass.
if ((evidence.modules ?? 0) < 4 || advisedExitCode !== status ||
    (status === 0 && violations.length !== 0)) process.exitCode = 2;
else process.exitCode = status;
