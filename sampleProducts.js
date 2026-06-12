// Map Firestore product document IDs to Stripe Price IDs (optional).
// You can also set stripePriceId on each product in admin.html.
export const productPriceIds = {
  // "FIRESTORE_PRODUCT_DOC_ID": "price_1Th1YKCCPel8RYA2GwjuqYzK"
};

// Used when a product has no stripePriceId in Firestore and no entry in productPriceIds.
// Fine for one product / testing — add per-product IDs in admin when you have more items.
export const defaultStripePriceId = "price_1Th1YKCCPel8RYA2GwjuqYzK";

export function resolveStripePriceId(product) {
  if (!product) {
    return null;
  }
  if (product.stripePriceId && product.stripePriceId.startsWith("price_")) {
    return product.stripePriceId;
  }
  const mapped = productPriceIds[product.id];
  if (mapped && mapped.startsWith("price_")) {
    return mapped;
  }
  if (defaultStripePriceId && defaultStripePriceId.startsWith("price_")) {
    return defaultStripePriceId;
  }
  return null;
}
