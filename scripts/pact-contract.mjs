// G11: genuine Pact V4 consumer contract generation and provider verification.
// The red scenario changes only an ephemeral local provider process.
import { Pact, Matchers, SpecificationVersion, Verifier } from "@pact-foundation/pact";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createApp } from "../src/app.mjs";
import { placeOrder } from "../consumer/order-client.mjs";

const mode = process.argv[2] ?? "green";
if (!new Set(["red", "green"]).has(mode)) {
  console.error("Usage: node scripts/pact-contract.mjs green|red");
  process.exit(2);
}

const pactDir = resolve("reports/pacts");
mkdirSync(pactDir, { recursive: true });
const pact = new Pact({
  consumer: "OrdersWebConsumer",
  provider: "OrdersApiProvider",
  spec: SpecificationVersion.SPECIFICATION_VERSION_V4,
  dir: pactDir,
  logLevel: "error"
});

const items = [{ quantity: 2, priceCents: 500 }];
const outcome = {
  gate: "G11",
  tool: "@pact-foundation/pact",
  mode,
  source: "PACT_V4_CONSUMER_AND_REAL_PROVIDER_VERIFIER",
  consumerVerifiedAgainstMock: false,
  contractFile: null,
  providerVerified: false,
  error: null
};

let server;
const oldScenario = process.env.CI_DEMO_SCENARIO;
try {
  // This executes the REAL independent consumer against Pact's mock server.
  await pact
    .addInteraction()
    .uponReceiving("a client creates an order requiring the public orderId")
    .withRequest("POST", "/orders", builder => {
      builder.headers({ "content-type": "application/json" });
      builder.jsonBody({ items });
    })
    .willRespondWith(201, builder => {
      builder.headers({ "content-type": "application/json" });
      builder.jsonBody({
        orderId: Matchers.regex("^[a-f0-9-]{36}$", "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"),
        status: "created",
        totalCents: 1000
      });
    })
    .executeTest(async mock => {
      const order = await placeOrder(mock.url, items);
      if (order.totalCents !== 1000) throw new Error("Pact mock returned an invalid total");
    });
  outcome.consumerVerifiedAgainstMock = true;

  const candidates = readdirSync(pactDir).filter(name => name.endsWith(".json"));
  if (candidates.length !== 1) {
    throw new Error(`Expected exactly one generated Pact contract, got ${candidates.length}`);
  }
  outcome.contractFile = `reports/pacts/${candidates[0]}`;

  // Verify the generated pact by replaying HTTP against the ACTUAL Orders API.
  // In RED it drops orderId; the Pact verifier itself, not a local regex,
  // decides whether the provider violated the contract.
  if (mode === "red") process.env.CI_DEMO_SCENARIO = "consumer";
  else delete process.env.CI_DEMO_SCENARIO;
  server = createApp();
  await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
  const providerBaseUrl = `http://127.0.0.1:${server.address().port}`;
  await new Verifier({
    provider: "OrdersApiProvider",
    providerBaseUrl,
    pactUrls: [resolve(outcome.contractFile)],
    logLevel: "info"
  }).verifyProvider();
  outcome.providerVerified = true;
} catch (error) {
  // Pact's verifier sometimes rejects with an entire JSON report. Keep the
  // CI artifact readable and bounded while stdout retains mismatch details.
  const message = error instanceof Error ? error.message : String(error);
  try {
    const result = JSON.parse(message);
    outcome.error = result.errors?.flatMap(item => item.mismatch?.mismatches?.map(
      mismatch => `${mismatch.path}: ${mismatch.mismatch}`
    ) ?? []).join("; ") || "Provider contract verification failed";
  } catch {
    outcome.error = message.slice(0, 2000);
  }
  process.exitCode = 1;
} finally {
  if (server) await new Promise(resolveClose => server.close(resolveClose));
  if (oldScenario === undefined) delete process.env.CI_DEMO_SCENARIO;
  else process.env.CI_DEMO_SCENARIO = oldScenario;
  mkdirSync("reports", { recursive: true });
  writeFileSync(`reports/g11-pact-${mode}.json`, JSON.stringify(outcome, null, 2) + "\n");
  console.log(`G11 Pact ${mode}: consumer=${outcome.consumerVerifiedAgainstMock}, provider=${outcome.providerVerified}`);
  if (outcome.error) console.error(outcome.error);
}
