import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { makeSyntheticIssuer, syntheticClaims, verifyOidcJwt } from "./oidc-policy.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const gate = process.argv[2];
const mode = process.argv[3] ?? "green";
if (!["green", "red"].includes(mode)) {
  process.stderr.write("Expected green or red mode\n");
  process.exit(2);
}
const variant = process.env.CI_DEMO_VARIANT ?? "";

function load(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function requireInvariant(predicate, reason) {
  if (!predicate) throw new Error(reason);
}

function costGate() {
  const plan = load("fixtures/cost/preview-" + mode + ".json");
  requireInvariant(plan.source === "PULUMI_PREVIEW_FIXTURE", "Invalid fixture source label");
  let delta = 0;
  for (const resource of plan.resourceChanges) {
    requireInvariant(Number.isFinite(resource.monthlyDeltaUsd), "Unpriced resource");
    delta += resource.monthlyDeltaUsd;
  }
  const budget = Number(process.env.COST_DELTA_BUDGET_USD ?? 100);
  requireInvariant(budget > 0, "Invalid budget");
  process.stdout.write(JSON.stringify({ gate, source: plan.source, monthlyDeltaUsd: delta, budget }) + "\n");
  requireInvariant(delta <= budget, "Estimated monthly cost delta exceeds budget");
}

function licenseGate() {
  const components = load("fixtures/license/components-" + mode + ".json").components;
  const allowed = new Set(["MIT", "Apache-2.0", "BSD-3-Clause", "ISC"]);
  const denied = components.filter(component => !allowed.has(component.license));
  process.stdout.write(JSON.stringify({ gate, source: "FIXTURE", checked: components.length, denied }) + "\n");
  requireInvariant(denied.length === 0, "License policy rejected one or more components");
}

function k8sGate() {
  const manifest = process.env.CHECK_REAL_K8S_MANIFEST === "true" && mode === "green"
    ? load("infra/k8s/deployment.json")
    : load("fixtures/kubernetes/deployment-" + mode + ".json");
  const pod = manifest.spec?.template?.spec;
  const containers = pod?.containers ?? [];
  requireInvariant(pod?.securityContext?.runAsNonRoot === true, "Pod must run as non-root");
  requireInvariant(manifest.spec?.strategy?.rollingUpdate?.maxUnavailable === 0 ||
    process.env.CHECK_REAL_K8S_MANIFEST !== "true", "Rollout must maintain capacity");
  requireInvariant(containers.length > 0, "Container required");
  for (const c of containers) {
    requireInvariant(/@sha256:[a-f0-9]{64}$/.test(c.image), "Container image must use immutable digest");
    requireInvariant(c.securityContext?.allowPrivilegeEscalation === false,
      "Privilege escalation forbidden");
    requireInvariant(c.securityContext?.readOnlyRootFilesystem === true,
      "Readonly root filesystem required");
    requireInvariant(c.resources?.limits?.memory && c.resources?.limits?.cpu,
      "CPU/memory limits required");
    requireInvariant(c.readinessProbe && c.livenessProbe,
      "Readiness and liveness probes required");
  }
  process.stdout.write(JSON.stringify({ gate, source: "FIXTURE", containers: containers.length }) + "\n");
}

function digestGate() {
  const manifest = load("fixtures/digest/release-" + mode + ".json");
  const stage = manifest.staging.image;
  const prod = manifest.production.image;
  requireInvariant(/^ghcr\.io\/[a-z0-9/-]+@sha256:[a-f0-9]{64}$/.test(stage),
    "Staging must have a registry digest");
  requireInvariant(/^ghcr\.io\/[a-z0-9/-]+@sha256:[a-f0-9]{64}$/.test(prod),
    "Production must have a registry digest");
  process.stdout.write(JSON.stringify({ gate, source: "FIXTURE", staging: stage, production: prod }) + "\n");
  requireInvariant(stage === prod, "Promotion changed immutable image digest");
}

function oidcGate() {
  const issuer = makeSyntheticIssuer();
  const now = Math.floor(Date.now() / 1000);
  const claims = syntheticClaims(now);
  if (mode === "red") {
    switch (variant || "subject") {
      case "subject": claims.sub = "repo:someone-else/attacker:ref:refs/heads/main"; break;
      case "audience": claims.aud = "not-sts.amazonaws.com"; break;
      case "issuer": claims.iss = "https://example.invalid"; break;
      case "expired": claims.exp = now - 10; break;
      case "future": claims.nbf = now + 100; break;
      case "signature": break;
      case "algorithm": break;
      default: throw new Error("Unknown OIDC variant");
    }
  }
  const jwt = issuer.signClaims(claims, {
    algorithm: mode === "red" && variant === "algorithm" ? "none" : "RS256"
  });
  let key = issuer.publicKey;
  if (mode === "red" && variant === "signature") {
    key = makeSyntheticIssuer().publicKey;
  }
  const verified = verifyOidcJwt(jwt, key, { now });
  // Never print or persist the JWT itself.
  process.stdout.write(JSON.stringify({
    gate, source: "LOCAL_SYNTHETIC_SIGNED_JWT", allowed: verified.allowed,
    subject: verified.subject, expiresInSeconds: verified.expiresInSeconds
  }) + "\n");
}

const gates = {
  G19: licenseGate,
  G20: k8sGate,
  G24: digestGate,
  G26: costGate,
  G27: oidcGate
};
if (!Object.hasOwn(gates, gate)) {
  process.stderr.write("Available gates: " + Object.keys(gates).join(", ") + "\n");
  process.exit(2);
}
try {
  gates[gate]();
  process.stdout.write("PASS " + gate + "\n");
} catch (error) {
  process.stderr.write("FAIL " + gate + ": " + error.message + "\n");
  process.exitCode = 1;
}
