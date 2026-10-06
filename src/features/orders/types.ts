export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipping",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ShippingAddress = {
  province: string;
  ward: string;
  street: string;
  note: string | null;
};

export type TrackedOrder = {
  order_code: string;
  status: OrderStatus;
  customer_name: string;
  shipping_address: ShippingAddress;
  subtotal: number;
  shipping_fee: number;
  total: number;
  payment_method: string;
  created_at: string;
  items: {
    product_name: string;
    sku: string;
    image_path: string | null;
    unit_price: number;
    quantity: number;
  }[];
  history: { to_status: OrderStatus; created_at: string }[];
};
