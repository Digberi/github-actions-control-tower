import { randomUUID } from "node:crypto";

/** @typedef {{ quantity: number, priceCents: number }} OrderItem */
/** @typedef {{ orderId: string, status: string, totalCents: number }} Order */
/**
 * @typedef {Object} OrderStore
 * @property {(items: OrderItem[], key?: string) => Order | Promise<Order>} create
 * @property {(id: string) => Order | null | Promise<Order | null>} get
 * @property {(() => Promise<boolean>) | undefined} [ready]
 */

/** @param {OrderItem[]} items */
export function calculateTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new TypeError("items must be a non-empty array");
  }
  const total = items.reduce((sum, item) => {
    if (
      !Number.isInteger(item.quantity) ||
      item.quantity <= 0 ||
      !Number.isInteger(item.priceCents) ||
      item.priceCents < 0
    ) {
      throw new TypeError("quantity and priceCents must be valid integers");
    }
    const lineTotal = item.quantity * item.priceCents;
    const nextTotal = sum + lineTotal;
    if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(nextTotal)) {
      throw new TypeError("order total exceeds Number.MAX_SAFE_INTEGER");
    }
    return nextTotal;
  }, 0);
  // A deliberately injected bug for the teaching scenario, never enabled in CI by default.
  return process.env.CI_DEMO_SCENARIO === "unit" ? total + 1 : total;
}

/** @returns {OrderStore} */
export function makeOrderStore() {
  const orders = new Map();
  const keyed = new Map();
  return {
    /** @param {OrderItem[]} items @param {string} [key] */
    create(items, key) {
      const totalCents = calculateTotal(items);
      if (key !== undefined && keyed.has(key)) {
        const existing = keyed.get(key);
        if (existing.fingerprint !== JSON.stringify(items)) {
          const error = Object.assign(new Error("idempotency_key_conflict"), {
            statusCode: 409,
          });
          throw error;
        }
        return existing.order;
      }
      const order = {
        orderId: randomUUID(),
        status: "created",
        totalCents,
      };
      orders.set(order.orderId, order);
      if (key !== undefined) {
        keyed.set(key, { fingerprint: JSON.stringify(items), order });
      }
      return order;
    },
    /** @param {string} id */
    get(id) {
      return orders.get(id) ?? null;
    },
  };
}
