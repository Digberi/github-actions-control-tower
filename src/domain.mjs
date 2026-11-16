import { randomUUID } from "node:crypto";

export function calculateTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new TypeError("items must be a non-empty array");
  }
  const total = items.reduce((sum, item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 ||
        !Number.isInteger(item.priceCents) || item.priceCents < 0) {
      throw new TypeError("quantity and priceCents must be valid integers");
    }
    return sum + item.quantity * item.priceCents;
  }, 0);
  // A deliberately injected bug for the teaching scenario, never enabled in CI by default.
  return process.env.CI_DEMO_SCENARIO === "unit" ? total + 1 : total;
}

export function makeOrderStore() {
  const orders = new Map();
  return {
    create(items) {
      const totalCents = calculateTotal(items);
      const order = {
        orderId: randomUUID(),
        status: "created",
        totalCents
      };
      orders.set(order.orderId, order);
      return order;
    },
    get(id) {
      return orders.get(id) ?? null;
    }
  };
}
