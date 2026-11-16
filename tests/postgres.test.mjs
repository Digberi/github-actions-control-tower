import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { makePostgresOrderStore } from "../src/postgres.mjs";

test("PostgreSQL transactional/idempotent order lifecycle", {
  skip: !process.env.DATABASE_URL && !process.env.PG_REQUIRED
}, async () => {
  assert.ok(process.env.DATABASE_URL, "PG_REQUIRED means real DATABASE_URL is required");
  const store = makePostgresOrderStore(process.env.DATABASE_URL);
  try {
    await store.migrate();
    assert.equal(await store.ready(), true);
    const key = "ci-" + randomUUID();
    const items = [{ quantity: 2, priceCents: 345 }];
    const [first, retry] = await Promise.all([store.create(items, key), store.create(items, key)]);
    assert.deepEqual(first, retry, "concurrent retries must return one order");
    assert.deepEqual(await store.get(first.orderId), first);
    await assert.rejects(
      store.create([{ quantity: 1, priceCents: 999 }], key),
      { message: "idempotency_key_conflict", statusCode: 409 }
    );
    const other = await store.create(items);
    assert.notEqual(other.orderId, first.orderId, "without a key creates new order");
  } finally {
    await store.close();
  }
});
