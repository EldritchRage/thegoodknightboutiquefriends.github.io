import { CHECKOUT_API_URL } from "./checkout-config.js";

export async function createCheckoutSession(cartItems) {
  const lineItems = cartItems.map((item) => ({
    price_id: item.priceId,
    quantity: item.quantity
  }));

  const response = await fetch(CHECKOUT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      line_items: lineItems,
      success_url: `${window.location.origin}/checkout-success.html`,
      cancel_url: `${window.location.origin}/checkout-cancel.html`
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Checkout failed" }));
    throw new Error(error.error || "Failed to create checkout session");
  }

  const data = await response.json();
  return data.url;
}
