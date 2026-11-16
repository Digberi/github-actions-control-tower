// Deliberate TS2322 error: a broken response cannot be assigned to its DTO.
type CreatedOrder = {
  orderId: string;
  status: "created";
  totalCents: number;
};

export const brokenResponse: CreatedOrder = {
  orderId: "demo-only-order-id",
  status: "created",
  totalCents: "199"
};
