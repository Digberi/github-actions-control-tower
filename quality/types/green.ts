export type OrderLine = {
  quantity: number;
  priceCents: number;
};

export type CreatedOrder = {
  orderId: string;
  status: "created";
  totalCents: number;
};

export function createOrderResponse(orderId: string, items: OrderLine[]): CreatedOrder {
  return {
    orderId,
    status: "created",
    totalCents: items.reduce((sum, item) => sum + item.quantity * item.priceCents, 0)
  };
}
