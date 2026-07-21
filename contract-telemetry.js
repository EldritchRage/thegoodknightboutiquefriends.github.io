const allowedEvents = new Set([
  "product_normalized",
  "product_ineligible",
  "unsupported_schema_version",
  "homepage_contract_issue",
  "stripe_contract_rejected",
]);

export function recordContractEvent(name, dimensions = {}) {
  if (!allowedEvents.has(name)) return;
  const safe = {
    schemaVersion: Number.isInteger(dimensions.schemaVersion) ? dimensions.schemaVersion : undefined,
    mode: ["legacy", "dual", "canonical"].includes(dimensions.mode) ? dimensions.mode : undefined,
    reason: typeof dimensions.reason === "string" ? dimensions.reason.slice(0, 64) : undefined,
  };
  globalThis.dispatchEvent?.(new CustomEvent("psitsavibe-contract-telemetry", { detail: { name, ...safe } }));
}
