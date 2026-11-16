import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateTotal } from "../src/domain.mjs";

// Reproducible xorshift32 seeds, so a CI failure can be replayed exactly.
function random(seed = 0x5eed2026) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
}

test("G05 · deterministic property fuzz: cents always equal integer arithmetic", () => {
  const next = random();
  for (let iteration = 0; iteration < 3000; iteration++) {
    const length = 1 + (next() % 6);
    const items = [];
    let expected = 0n;
    for (let i = 0; i < length; i++) {
      const quantity = 1 + (next() % 20);
      const priceCents = next() % 100000;
      items.push({ quantity, priceCents });
      expected += BigInt(quantity) * BigInt(priceCents);
    }
    assert.equal(calculateTotal(items), Number(expected), `seed 0x5eed2026, iteration ${iteration}`);
  }
});

test("G05 · numeric safety invariant: reject totals beyond safe integer precision", () => {
  assert.throws(
    () => calculateTotal([{ quantity: 2, priceCents: Number.MAX_SAFE_INTEGER }]),
    { name: "TypeError" }
  );
  assert.throws(
    () => calculateTotal([
      { quantity: 1, priceCents: Number.MAX_SAFE_INTEGER },
      { quantity: 1, priceCents: 1 }
    ]),
    { name: "TypeError" }
  );
});
