import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const root = fileURLToPath(new URL("../", import.meta.url));
const reportDir = resolve(root, "reports");
const args = process.argv.slice(2);
const sub = args[0] ?? "help";
const option = key => {
  const position = args.indexOf("--" + key);
  return position < 0 ? null : args[position + 1] ?? null;
};

const cases = {
  G05: { title: "Unit pricing invariant", command: "test:unit", failure: "unit" },
  G08: { title: "HTTP integration invariant", command: "test:integration", failure: "integration" },
  G10: { title: "Backward-compatible API response", command: "check:contract", failure: "contract" },
  G11: { title: "Independent HTTP consumer contract", command: "test:consumer", failure: "consumer" },
  G13: { title: "Expand-only migration safety", heavy: true },
  G14: { title: "Domain to transport import forbidden", command: "check:architecture", failure: "boundary" },
  G15: { title: "Source import cycle", command: "check:architecture", failure: "architecture" },
  G16: { title: "Secret pattern in synthetic fixture", command: "check:secrets", failure: "security" },
  G19: { title: "License allowlist policy", heavy: true },
  G20: { title: "Kubernetes security policy", heavy: true },
  G24: { title: "Immutable digest promotion equality", heavy: true },
  G25: { title: "HTTP p95 performance threshold", command: "check:performance", failure: "performance" },
  G26: { title: "Cost delta budget predicate", heavy: true },
  G27: { title: "Cryptographic OIDC policy verification", heavy: true }
};

const liveEvidence = {
  G10: "https://github.com/Digberi/github-actions-control-tower/actions/runs/43889707611",
  G27: {
    red: "https://github.com/Digberi/github-actions-control-tower/actions/runs/43894863175",
    green: "https://github.com/Digberi/github-actions-control-tower/actions/runs/43894983037"
  }
};

function printHelp() {
  process.stdout.write([
    "CI/CD Control Tower classroom controller",
    "  npm run demo:preflight",
    "  npm run demo:list",
    "  npm run demo:case -- --id G10 --mode red --target local",
    "  npm run demo:case -- --id G10 --mode green --target local",
    "  npm run demo:case -- --id G27 --mode red --target prepared",
    "  npm run demo:show -- --id G27",
    "  npm run demo:report",
    "  npm run demo:cleanup -- --scope SESSION_ID --dry-run",
    ""
  ].join("\n"));
}

function preflight() {
  const major = Number(process.versions.node.split(".")[0]);
  const docker = spawnSync("docker", ["info", "--format", "{{.ServerVersion}}"], {
    encoding: "utf8", timeout: 4000
  });
  const gh = spawnSync("gh", ["auth", "status"], {
    encoding: "utf8", timeout: 4000
  });
  const statuses = {
    node: { version: process.versions.node, ready: major >= 22 },
    platform: os.platform() + "/" + os.arch(),
    memoryGiB: Number((os.totalmem() / 1024 ** 3).toFixed(1)),
    docker: { available: docker.status === 0 },
    githubCliAuthenticated: gh.status === 0,
    localDemoChecks: Object.keys(cases)
  };
  process.stdout.write(JSON.stringify(statuses, null, 2) + "\n");
  if (!statuses.node.ready) process.exitCode = 1;
  // Docker/GitHub auth are optional for fast local demo: do not fail on their absence.
}

function runCase() {
  const id = option("id");
  const mode = option("mode") ?? "green";
  const target = option("target") ?? "local";
  const test = cases[id];
  if (!test || !["green", "red"].includes(mode)) {
    throw new Error("Unknown ID/mode. Use demo:list.");
  }
  if (!["local", "github", "prepared"].includes(target)) {
    throw new Error("Supported targets: local, github, prepared");
  }
  if (target === "prepared") {
    const source = liveEvidence[id];
    const url = typeof source === "string"
      ? (mode === "red" ? source : null)
      : source?.[mode];
    if (!url) {
      throw new Error("No verified pre-recorded remote run for " + id + " " + mode);
    }
    process.stdout.write(JSON.stringify({
      source: "PREPARED_VERIFIED_GITHUB_RUN", gate: id, mode,
      workflowRunUrl: url,
      note: "Read-only link to an earlier real job; no new gate was executed."
    }, null, 2) + "\n");
    return;
  }
  if (target === "github" && process.env.GITHUB_ACTIONS !== "true") {
    throw new Error("GitHub target requires a real GitHub Actions runner");
  }
  const cmd = process.platform === "win32" ? "npm.cmd" : "npm";
  const invocation = test.heavy
    ? [process.execPath, ["scripts/heavy-gates.mjs", id, mode]]
    : [cmd, ["run", test.command]];
  const env = { ...process.env };
  if (!test.heavy && mode === "red") env.CI_DEMO_SCENARIO = test.failure;
  else delete env.CI_DEMO_SCENARIO;
  const started = Date.now();
  process.stdout.write("RUN " + id + " " + mode + " (" + target + ")\n");
  const result = spawnSync(invocation[0], invocation[1], {
    cwd: root, env, encoding: "utf8", timeout: 120000
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const actual = result.status ?? 124;
  const expected = mode === "green" ? 0 : 1;
  const passedAsDemonstration = actual === expected;
  const runUrl = target === "github" && process.env.GITHUB_RUN_ID
    ? process.env.GITHUB_SERVER_URL + "/" + process.env.GITHUB_REPOSITORY +
      "/actions/runs/" + process.env.GITHUB_RUN_ID
    : null;
  const session = (option("session") ?? "default").replace(/[^a-zA-Z0-9_-]/g, "");
  if (session.length === 0 || session.length > 64) {
    throw new Error("Invalid session ID");
  }
  const record = {
    gate: id, title: test.title, mode,
    source: target === "github" ? "GITHUB_REAL" : "LOCAL",
    expectedExit: expected, actualExit: actual, passedAsDemonstration,
    durationMs: Date.now() - started,
    timestamp: new Date().toISOString(),
    commitSha: process.env.GITHUB_SHA ?? null,
    workflowRunUrl: runUrl,
    command: invocation[0] === process.execPath
      ? "node " + invocation[1].join(" ") : "npm " + invocation[1].join(" "),
    expectedFailure: test.failure ?? id,
    signal: result.signal,
    // Do not put environment variables, raw stdout, JWTs or secret-like values into evidence.
    artifacts: []
  };
  mkdirSync(reportDir, { recursive: true });
  const filename = "session-" + session + "-" + id + "-" + mode + ".json";
  writeFileSync(resolve(reportDir, filename), JSON.stringify(record, null, 2) + "\n");
  process.stdout.write(JSON.stringify({
    verdict: passedAsDemonstration ? "EXPECTED" : "UNEXPECTED",
    gate: id, mode, actualExit: actual, report: "reports/" + filename
  }) + "\n");
  process.exitCode = target === "github"
    ? actual
    : passedAsDemonstration ? 0 : 1;
}

function list() {
  for (const [id, c] of Object.entries(cases)) {
    process.stdout.write(id + "  " + c.title + "\n");
  }
}

function show() {
  const id = option("id");
  if (!cases[id]) throw new Error("Unknown case");
  process.stdout.write(JSON.stringify({
    id, ...cases[id],
    modes: ["green", "red"], local: true,
    preparedRealRun: liveEvidence[id] ?? null,
    note: "A green demonstration verifies the narrow gate, not the whole product."
  }, null, 2) + "\n");
}

function report() {
  if (!existsSync(reportDir)) {
    process.stdout.write("No runs yet\n");
    return;
  }
  const paths = readdirSync(reportDir).filter(x => /^session-[\w-]+-G\d{2}-(red|green)\.json$/.test(x));
  const records = paths.map(file => JSON.parse(readFileSync(resolve(reportDir, file), "utf8")));
  for (const record of records.sort((a, b) => b.timestamp.localeCompare(a.timestamp))) {
    process.stdout.write(
      record.timestamp + " " + record.gate + " " + record.mode +
      " expected=" + record.expectedExit + " actual=" + record.actualExit +
      " " + (record.passedAsDemonstration ? "OK" : "MISMATCH") + "\n"
    );
  }
}

function cleanup() {
  const scope = option("scope");
  if (!scope || !/^[\w-]{1,64}$/.test(scope)) throw new Error("Specify exact --scope");
  if (!existsSync(reportDir)) return;
  const targets = readdirSync(reportDir)
    .filter(file => file.startsWith("session-" + scope + "-") && file.endsWith(".json"));
  for (const file of targets) process.stdout.write("Scoped evidence: " + basename(file) + "\n");
  if (!args.includes("--confirm")) {
    process.stdout.write("DRY RUN; add --confirm to delete only these scoped reports.\n");
    return;
  }
  for (const file of targets) unlinkSync(resolve(reportDir, file));
  process.stdout.write("Deleted " + targets.length + " scoped evidence file(s)\n");
}

try {
  switch (sub) {
    case "preflight": preflight(); break;
    case "list": list(); break;
    case "case": runCase(); break;
    case "show": show(); break;
    case "report": report(); break;
    case "cleanup": cleanup(); break;
    case "help": printHelp(); break;
    default: throw new Error("Unknown command: " + sub);
  }
} catch (error) {
  process.stderr.write("Demo controller: " + error.message + "\n");
  process.exitCode = 2;
}
