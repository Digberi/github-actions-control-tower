import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, dirname, extname } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createApp } from "../src/app.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scenario = process.env.CI_DEMO_SCENARIO ?? "happy";
const check = process.argv[2];

function fail(message) {
  throw new Error(message);
}

async function files(dir, predicate) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if ([".git", "node_modules", "coverage", "reports"].includes(entry.name)) continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...await files(path, predicate));
    else if (predicate(path)) result.push(path);
  }
  return result;
}

async function syntax() {
  const targets = await files(root, path => [".mjs", ".js"].includes(extname(path)));
  for (const path of targets) {
    const code = await readFile(path, "utf8");
    if (/\r\n/.test(code) || !code.endsWith("\n") || /[ \t]+$/m.test(code)) {
      fail("Whitespace policy failed: " + relative(root, path));
    }
    const result = spawnSync(process.execPath, ["--check", path], { encoding: "utf8" });
    if (result.status !== 0) fail(result.stderr);
  }
  process.stdout.write("PASS syntax/hygiene: " + targets.length + " JS files\n");
}

async function architecture() {
  const targets = await files(resolve(root, "src"), path => path.endsWith(".mjs"));
  const edges = new Map();
  for (const path of targets) {
    const name = relative(root, path);
    const source = await readFile(path, "utf8");
    const imports = [];
    for (const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
      const imported = relative(root, resolve(dirname(path), match[1]));
      if (!imported.startsWith("src/")) fail(name + " reaches outside src/");
      imports.push(imported);
    }
    edges.set(name, imports);
  }
  if (scenario === "architecture") {
    edges.get("src/domain.mjs").push("src/app.mjs");
  }
  if (scenario === "boundary") {
    edges.get("src/domain.mjs").push("src/server.mjs");
  }
  for (const [from, imports] of edges) {
    if (from === "src/domain.mjs" &&
        imports.some(to => to === "src/app.mjs" || to === "src/server.mjs")) {
      fail("G14 architectural boundary violation: domain must not import transport");
    }
  }
  const visiting = new Set();
  const visited = new Set();
  function dfs(node, path) {
    if (visiting.has(node)) fail("Import cycle detected: " + [...path, node].join(" -> "));
    if (visited.has(node)) return;
    visiting.add(node);
    for (const next of edges.get(node) ?? []) dfs(next, [...path, node]);
    visiting.delete(node);
    visited.add(node);
  }
  for (const node of edges.keys()) dfs(node, []);
  process.stdout.write("PASS architecture: import graph is acyclic\n");
}

async function contract() {
  const baseline = JSON.parse(await readFile(resolve(root, "contracts/baseline.json"), "utf8"));
  const filename = scenario === "contract" ? "fixtures/contract-breaking.json" : "contracts/current.json";
  const current = JSON.parse(await readFile(resolve(root, filename), "utf8"));
  for (const [route, methods] of Object.entries(baseline.paths)) {
    for (const [method, api] of Object.entries(methods)) {
      const candidate = current.paths?.[route]?.[method];
      if (!candidate) fail("Removed endpoint: " + method.toUpperCase() + " " + route);
      if (candidate.status !== api.status) fail("Changed status: " + method + " " + route);
      for (const [key, type] of Object.entries(api.response)) {
        if (candidate.response?.[key] !== type) {
          fail("Breaking response change: " + method + " " + route + " missing " + key + ":" + type);
        }
      }
    }
  }
  process.stdout.write("PASS API contract: no breaking response changes\n");
}

async function secrets() {
  const targets = await files(root, path => /\.(mjs|js|json|yml|yaml|md|html)$/.test(path));
  const signatures = [
    { name: "GitHub classic-token pattern", regex: /ghp_[A-Za-z0-9]{36}/ },
    { name: "AWS access-key pattern", regex: /AKIA[A-Z0-9]{16}/ },
    { name: "private-key header", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ }
  ];
  for (const path of targets) {
    const content = await readFile(path, "utf8");
    for (const signature of signatures) {
      if (signature.regex.test(content)) fail(signature.name + " in " + relative(root, path));
    }
  }
  if (scenario === "security") {
    // Generate a fake sentinel only at runtime to avoid committing secret-looking fixtures.
    const fakeSentinel = "ghp_" + "X".repeat(36);
    if (signatures[0].regex.test(fakeSentinel)) {
      fail("GitHub classic-token pattern found in injected training fixture");
    }
  }
  process.stdout.write("PASS secret patterns: " + targets.length + " scanned text files\n");
}

async function workflows() {
  const dir = resolve(root, ".github/workflows");
  const targets = await files(dir, path => /\.(yml|yaml)$/.test(path));
  if (!targets.length) fail("No GitHub Actions workflows");
  for (const path of targets) {
    const body = await readFile(path, "utf8");
    if (body.includes("pull_request_target:")) fail("Forbidden privileged PR trigger: " + path);
    if (!body.includes("permissions:")) fail("Missing explicit permissions: " + path);
    if (!body.includes("jobs:")) fail("Missing jobs: " + path);
  }
  process.stdout.write("PASS workflow policy (basic structural rules; not a YAML parser)\n");
}

async function performanceSmoke() {
  const server = createApp();
  await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
  const url = "http://127.0.0.1:" + server.address().port + "/health";
  const durations = [];
  try {
    const responses = await Promise.all(Array.from({ length: 24 }, async () => {
      const start = performance.now();
      const response = await fetch(url);
      const payload = await response.json();
      durations.push(performance.now() - start);
      return response.status === 200 && payload.status === "ok";
    }));
    if (responses.some(value => !value)) fail("HTTP error in performance test");
    durations.sort((a, b) => a - b);
    const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
    const threshold = 1200;
    process.stdout.write("Measured p95 = " + Math.round(p95) + "ms (threshold " + threshold + "ms)\n");
    if (p95 > threshold) fail("Performance regression: p95 exceeded threshold");
    process.stdout.write("PASS local performance smoke\n");
  } finally {
    await new Promise(resolveClose => server.close(resolveClose));
  }
}

const checks = {
  syntax, architecture, contract, secrets, workflows,
  performance: performanceSmoke
};
if (!checks[check]) {
  process.stderr.write("Usage: node scripts/gates.mjs " + Object.keys(checks).join("|") + "\n");
  process.exitCode = 2;
} else {
  try {
    await checks[check]();
  } catch (error) {
    process.stderr.write("FAIL " + check + ": " + error.message + "\n");
    process.exitCode = 1;
  }
}
