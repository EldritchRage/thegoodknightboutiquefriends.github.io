// Map Firestore product document IDs to Stripe Price IDs.
// In admin, you can also set stripePriceId on each product directly.
// Replace placeholders with real Price IDs from Stripe Dashboard (Products → Price ID).
export const productPriceIds = {
  // "FIRESTORE_PRODUCT_DOC_ID": "price_REPLACE_WITH_REAL_ID"
};

export function resolveStripePriceId(product) {
  if (!product) {
    return null;
  }
  if (product.stripePriceId && product.stripePriceId.startsWith("price_")) {
    return product.stripePriceId;
  }
  const mapped = productPriceIds[product.id];
  if (mapped && mapped.startsWith("price_") && !mapped.includes("REPLACE")) {
    return mapped;
  }
  return null;
}
