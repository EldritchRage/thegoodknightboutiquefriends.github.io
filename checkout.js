import { CHECKOUT_API_URL } from "./checkout-config.js";
import { buildCheckoutRequest } from "./stripe-contract.js";

export async function createCheckoutSession(cartItems) {
  const payload = buildCheckoutRequest(cartItems, window.location.origin);

  const response = await fetch(CHECKOUT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Checkout failed" }));
    throw new Error(error.error || "Failed to create checkout session");
  }

  const data = await response.json();
  return data.url;
}
