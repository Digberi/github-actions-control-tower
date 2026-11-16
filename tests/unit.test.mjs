import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateTotal, makeOrderStore } from "../src/domain.mjs";

test("calculates a multi-item order in integer cents", () => {
  assert.equal(calculateTotal([{ quantity: 2, priceCents: 125 }, { quantity: 3, priceCents: 50 }]), 400);
});

test("rejects missing and invalid items", () => {
  assert.throws(() => calculateTotal([]), TypeError);
  assert.throws(() => calculateTotal([{ quantity: -1, priceCents: 300 }]), TypeError);
});

test("store keeps created orders", () => {
  const store = makeOrderStore();
  const order = store.create([{ quantity: 1, priceCents: 299 }]);
  assert.equal(store.get(order.orderId)?.totalCents, 299);
  assert.equal(store.get("absent"), null);
});
