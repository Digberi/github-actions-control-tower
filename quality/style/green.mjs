export function calculateLineTotal(quantity, priceCents) {
  if (quantity <= 0) {
    throw new RangeError("quantity must be positive");
  }
  return quantity * priceCents;
}
