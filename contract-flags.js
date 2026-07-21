const allowedModes = new Set(["legacy", "dual", "canonical"]);

export function getProductReadMode() {
  const configured = globalThis.PSITSAVIBE_CONTRACT_MODE || "legacy";
  return allowedModes.has(configured) ? configured : "legacy";
}

export function productVisibleInMode(product, mode = getProductReadMode()) {
  if (mode === "canonical") return product.isPublicEligible === true;
  return true;
}
