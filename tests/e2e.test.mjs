import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.mjs";

test("create an order, read it, and reject an unknown route", async () => {
  const server = createApp();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const created = await fetch(base + "/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [{ quantity: 1, priceCents: 700 }] })
    });
    assert.equal(created.status, 201);
    const payload = await created.json();
    const found = await fetch(base + "/orders/" + payload.orderId);
    assert.equal(found.status, 200);
    assert.deepEqual(await found.json(), payload);
    assert.equal((await fetch(base + "/missing")).status, 404);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
