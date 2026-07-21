export const PRODUCT_SCHEMA_VERSION = 2;

const validId = (value, prefix) => typeof value === 'string' && value.startsWith(prefix);
const finiteNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const nonNegativeInteger = (value) => Math.max(0, Math.trunc(finiteNumber(value)));

function normalizeImages(product) {
  const canonical = Array.isArray(product?.images) ? product.images : [];
  const legacy = [product?.imageUrl, ...(Array.isArray(product?.imageUrls) ? product.imageUrls : [])]
    .filter(Boolean)
    .map((url) => ({ url, storagePath: null, altText: product?.name || "" }));
  const seen = new Set();
  return [...canonical, ...legacy].filter((image) => {
    if (!image?.url || seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}

export function normalizeProductForRead(product = {}) {
  const isCanonical = product.schemaVersion === PRODUCT_SCHEMA_VERSION;
  const isUnknownVersion = product.schemaVersion != null && product.schemaVersion !== PRODUCT_SCHEMA_VERSION;
  const images = normalizeImages(product);
  const stripe = {
    productId: product.stripe?.productId || product.stripeProductId || null,
    priceId: product.stripe?.priceId || product.stripePriceId || null,
  };
  const variants = product.variants && typeof product.variants === "object" ? product.variants : null;
  const status = isCanonical ? product.status : (product.published === true ? "published" : "draft");
  const issues = Array.isArray(product.migration?.issues) ? [...product.migration.issues] : [];
  if (isUnknownVersion && !issues.includes("unsupported_schema_version")) {
    issues.push("unsupported_schema_version");
  }
  const quantity = nonNegativeInteger(product.quantity);
  const variantEntries = variants ? Object.values(variants) : [];
  const variantSellable = variantEntries.length > 0 && variantEntries.some((variant) =>
    nonNegativeInteger(variant.quantity) > 0 && validId(variant.stripePriceId, "price_")
  );
  const exactPriceReady = variants ? variantSellable : validId(stripe.priceId, "price_");
  const categoryId = product.categoryId || product.category || null;

  return {
    ...product,
    schemaVersion: product.schemaVersion ?? 1,
    categoryId,
    category: product.category || categoryId,
    status,
    currency: product.currency || "usd",
    price: finiteNumber(product.price),
    quantity,
    images,
    imageUrl: product.imageUrl || images[0]?.url || "",
    imageUrls: Array.isArray(product.imageUrls) ? product.imageUrls : images.map((image) => image.url),
    stripe,
    stripeProductId: product.stripeProductId || stripe.productId,
    stripePriceId: product.stripePriceId || stripe.priceId,
    variants,
    contractIssues: issues,
    isPublicEligible: status === "published"
      && Boolean(product.name?.trim())
      && Boolean(categoryId)
      && images.length > 0
      && quantity > 0
      && exactPriceReady
      && issues.length === 0,
  };
}

export function buildCompatibleProductWrite(input = {}, { createdByUid = null } = {}) {
  const normalized = normalizeProductForRead(input);
  return {
    ...input,
    schemaVersion: PRODUCT_SCHEMA_VERSION,
    categoryId: normalized.categoryId,
    category: normalized.categoryId,
    createdByUid: input.createdByUid ?? createdByUid,
    status: input.status || normalized.status,
    currency: normalized.currency,
    price: normalized.price,
    quantity: normalized.quantity,
    images: normalized.images,
    imageUrl: normalized.imageUrl,
    imageUrls: normalized.images.map((image) => image.url),
    stripe: normalized.stripe,
    stripeProductId: normalized.stripe.productId,
    stripePriceId: normalized.stripe.priceId,
    variants: normalized.variants,
  };
}
