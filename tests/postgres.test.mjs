import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
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

test("G13 PostgreSQL: expand keeps v1 alive; early contract breaks it", {
  skip: !process.env.DATABASE_URL && !process.env.PG_REQUIRED
}, async () => {
  assert.ok(process.env.DATABASE_URL, "G13 requires a real PostgreSQL service");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    // A temporary table and transaction isolate this drill from other tests.
    // Treat this SELECT as a still-running v1 reader during a v2 rollout.
    await client.query("BEGIN");
    await client.query("CREATE TEMP TABLE g13_orders (id integer PRIMARY KEY, legacy_code text NOT NULL)");
    await client.query("INSERT INTO g13_orders (id, legacy_code) VALUES (1, 'v1-order')");

    // Expand: an optional column is safe while old instances still run.
    await client.query("ALTER TABLE g13_orders ADD COLUMN metadata jsonb");
    const compatible = await client.query("SELECT legacy_code FROM g13_orders WHERE id = 1");
    assert.equal(compatible.rows[0].legacy_code, "v1-order");

    // Contract too early: PostgreSQL rejects a real v1 query. The error
    // happens *inside* the database rather than a hand-written SQL regex.
    await client.query("SAVEPOINT before_contract");
    await client.query("ALTER TABLE g13_orders DROP COLUMN legacy_code");
    await assert.rejects(
      client.query("SELECT legacy_code FROM g13_orders WHERE id = 1"),
      (error) => error.code === "42703", // PostgreSQL undefined_column
      "old application reads must fail when the column is removed"
    );

    // Roll back only the unsafe migration and verify v1 works again.
    await client.query("ROLLBACK TO SAVEPOINT before_contract");
    const recovered = await client.query("SELECT legacy_code FROM g13_orders WHERE id = 1");
    assert.equal(recovered.rows[0].legacy_code, "v1-order");
    await client.query("ROLLBACK");
  } finally {
    await client.end();
  }
});
