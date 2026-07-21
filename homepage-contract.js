export const HOMEPAGE_SCHEMA_VERSION = 2;

const text = (value) => typeof value === "string" ? value : "";

export function normalizeHomepageForRead(config = {}) {
  const unsupported = config.schemaVersion != null && config.schemaVersion !== HOMEPAGE_SCHEMA_VERSION;
  return {
    ...config,
    schemaVersion: config.schemaVersion ?? 1,
    hero: {
      headline: text(config.hero?.headline),
      subheading: text(config.hero?.subheading),
      buttonText: text(config.hero?.buttonText),
      buttonLink: text(config.hero?.buttonLink),
      image: text(config.hero?.image),
    },
    about: { text: text(config.about?.text), image: text(config.about?.image) },
    contractIssues: unsupported ? ["unsupported_schema_version"] : [],
  };
}

export function buildCompatibleHomepageWrite(config = {}, updatedByUid = null) {
  const normalized = normalizeHomepageForRead(config);
  if (normalized.contractIssues.length) throw new Error("Unsupported homepage schema version");
  return { ...config, schemaVersion: HOMEPAGE_SCHEMA_VERSION, hero: normalized.hero, about: normalized.about, updatedByUid: config.updatedByUid ?? updatedByUid };
}

export function compareLegacyHomepage(canonical = {}, legacy = {}) {
  const pairs = [
    ["promoTitle", canonical.promoTitle, legacy.promoTitle],
    ["promoMessage", canonical.promoMessage, legacy.promoMessage],
    ["promoButtonText", canonical.promoButtonText, legacy.promoButtonText],
    ["promoButtonLink", canonical.promoButtonLink, legacy.promoButtonLink],
  ];
  return pairs.filter(([, current, old]) => text(current) && text(old) && current !== old)
    .map(([field, current, old]) => ({ field, canonicalValue: current, legacyValue: old }));
}
