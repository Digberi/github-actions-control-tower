/** Independent consumer: fails even when all producer unit tests are green. */
export async function placeOrder(base, items) {
  const response = await fetch(base + "/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ items })
  });
  if (response.status !== 201) {
    throw new Error("Consumer expected HTTP 201, got " + response.status);
  }
  const payload = await response.json();
  if (!/^[a-f0-9-]{36}$/.test(payload.orderId ?? "")) {
    throw new Error("Consumer contract broken: orderId missing or malformed");
  }
  if (!Number.isInteger(payload.totalCents) || payload.status !== "created") {
    throw new Error("Consumer contract broken: totalCents/status missing");
  }
  return { orderId: payload.orderId, totalCents: payload.totalCents };
}
