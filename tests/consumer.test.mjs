import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.mjs";
import { placeOrder } from "../consumer/order-client.mjs";

test("G11 independent consumer requires the previous public HTTP response", async () => {
  const server = createApp();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    const base = "http://127.0.0.1:" + server.address().port;
    const receipt = await placeOrder(base, [{ quantity: 2, priceCents: 500 }]);
    assert.match(receipt.orderId, /^[a-f0-9-]{36}$/);
    assert.equal(receipt.totalCents, 1000);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
