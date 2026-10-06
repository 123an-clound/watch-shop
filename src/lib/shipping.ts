/** Mirrors lw_place_order: free shipping at/above the threshold. Display only — the DB decides. */
export function shippingFor(subtotal: number, fee: number, threshold: number) {
  return subtotal >= threshold ? 0 : fee;
}
