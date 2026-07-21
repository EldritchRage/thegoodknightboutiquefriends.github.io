export const STRIPE_AVAILABILITY_URL = "https://stripe-products.kylecataclysm-kc.workers.dev/availability";

function priceIdFor(product) {
  return product?.stripe?.priceId || product?.stripePriceId || null;
}

export async function filterStripeAvailableProducts(products, fetchImpl = fetch) {
  const candidates = products.filter((product) => priceIdFor(product));
  if (!candidates.length) return [];

  const priceIds = [...new Set(candidates.map(priceIdFor))];
  try {
    const response = await fetchImpl(`${STRIPE_AVAILABILITY_URL}?price_ids=${encodeURIComponent(priceIds.join(","))}`);
    if (!response.ok) throw new Error(`Availability lookup failed with ${response.status}`);
    const { availability = {} } = await response.json();
    return candidates.filter((product) => availability[priceIdFor(product)] === true);
  } catch (error) {
    console.error("Stripe availability lookup failed; preserving the Firestore catalogue.", error);
    return candidates;
  }
}
