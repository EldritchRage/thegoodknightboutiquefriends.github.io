export function normalizeCartItem(item = {}) {
  const priceId = item.priceId || item.price_id;
  const quantity = Math.trunc(Number(item.quantity));
  if (typeof priceId !== "string" || !priceId.startsWith("price_") || quantity < 1 || quantity > 99) {
    throw new Error("Invalid checkout line item");
  }
  return { priceId, quantity, name: String(item.name || ""), image: String(item.image || ""), displayPrice: String(item.displayPrice || "") };
}

export function buildCheckoutRequest(items, origin) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) throw new Error("Invalid checkout item count");
  const normalized = items.map(normalizeCartItem);
  return {
    line_items: normalized.map((item) => ({ price_id: item.priceId, quantity: item.quantity })),
    success_url: `${origin}/checkout-success.html`,
    cancel_url: `${origin}/checkout-cancel.html`,
  };
}
