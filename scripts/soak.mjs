// Actual HTTP soak of the running demo app; no simulated measurements.
import { mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { createApp } from "../src/app.mjs";

const durationSeconds = Number(process.argv[2] ?? 20);
if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 120) {
  console.error("Usage: node scripts/soak.mjs <seconds 1..120>");
  process.exit(2);
}
const concurrency = 6;
const server = createApp();
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const base = "http://127.0.0.1:" + server.address().port;
const deadline = Date.now() + durationSeconds * 1000;
const samples = [];
const errors = [];
let iterations = 0;
let requests = 0;
const started = performance.now();

async function checkedFetch(url, options, expectedStatus) {
  const before = performance.now();
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(3000)
  });
  samples.push(performance.now() - before);
  requests++;
  if (response.status !== expectedStatus) {
    throw new Error(`HTTP ${response.status} instead of ${expectedStatus} at ${url}`);
  }
  return response;
}

async function worker(id) {
  let local = 0;
  while (Date.now() < deadline) {
    const quantity = 1 + (local % 3);
    const priceCents = 101 + (id * 7 + local) % 500;
    try {
      const created = await checkedFetch(base + "/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: [{ quantity, priceCents }] })
      }, 201);
      const order = await created.json();
      if (order.totalCents !== quantity * priceCents || !order.orderId) {
        throw new Error("Incorrect total or missing orderId");
      }
      const found = await checkedFetch(base + "/orders/" + order.orderId, {}, 200);
      const stored = await found.json();
      if (stored.orderId !== order.orderId || stored.totalCents !== order.totalCents) {
        throw new Error("Read-after-write or payload consistency violation");
      }
      if (local % 20 === 0) {
        await checkedFetch(base + "/health/ready", {}, 200);
      }
      iterations++;
    } catch (error) {
      if (errors.length < 50) errors.push(error.message);
      // A non-200/error during soak is a failure; stop only this worker.
      return;
    }
    local++;
  }
}

try {
  await Promise.all(Array.from({ length: concurrency }, (_, id) => worker(id)));
} finally {
  await new Promise(resolve => server.close(resolve));
}
samples.sort((a, b) => a - b);
const p95Ms = samples[Math.max(0, Math.ceil(samples.length * 0.95) - 1)] ?? 0;
const outcome = {
  durationSeconds,
  elapsedMs: Math.round(performance.now() - started),
  concurrency,
  iterations,
  requests,
  p95Ms: Math.round(p95Ms * 100) / 100,
  failedRequests: errors.length,
  errors,
  passed: errors.length === 0 && iterations >= 25 && p95Ms < 1500
};
mkdirSync("reports", { recursive: true });
writeFileSync("reports/http-soak.json", JSON.stringify(outcome, null, 2) + "\n");
console.log(JSON.stringify(outcome));
if (!outcome.passed) process.exitCode = 1;
