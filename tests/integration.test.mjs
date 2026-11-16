import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.mjs";

async function serve(fn) {
  const server = createApp();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  try {
    await fn("http://127.0.0.1:" + address.port);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test("health and order creation respond with the expected HTTP contract", async () => {
  await serve(async base => {
    const health = await fetch(base + "/health");
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });
    const response = await fetch(base + "/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [{ quantity: 2, priceCents: 199 }] })
    });
    assert.equal(response.status, 201);
    const order = await response.json();
    assert.match(order.orderId, /^[a-f0-9-]+$/);
    assert.equal(order.totalCents, 398);
  });
});
