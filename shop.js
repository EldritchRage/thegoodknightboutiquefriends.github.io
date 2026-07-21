import { db, isFirebaseReady } from "./firebase-client.js";
import { addToCart, getCartCount, onCartUpdated } from "./cart.js";
import { resolveStripePriceId } from "./sampleProducts.js";
import { categoryLabels, defaultCategory } from "./categories.js";
import { normalizeProductForRead } from "./product-contract.js";
import { getProductReadMode, productVisibleInMode } from "./contract-flags.js";
import { recordContractEvent } from "./contract-telemetry.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const fallbackCatalog = {};

let activeCategory = defaultCategory;
const catalog = {};
const categoryAliases = {
  "rave-wear": "ravewear"
};

function normalizeCategory(category) {
  return categoryAliases[category] || category;
}

function money(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function allProducts() {
  return Object.values(catalog).flat();
}

function renderCatalog(categoryId) {
  activeCategory = categoryId;
  const catalogTitle = document.getElementById("catalog-title");
  const catalogGrid = document.getElementById("catalog-grid");
  const categoryButtons = document.querySelectorAll(".category-button");

  const fullLabel = categoryLabels[categoryId] || "Category";
  const categoryTitle = fullLabel.includes(">") ? fullLabel.split(">").pop().trim() : fullLabel;
  catalogTitle.textContent = `${categoryTitle} Catalog`;

  categoryButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.category === categoryId);
  });

  const products = catalog[categoryId] || [];
  if (!products.length) {
    catalogGrid.innerHTML = "<p class='muted'>No products added yet for this category.</p>";
    return;
  }

  catalogGrid.innerHTML = products
    .map((product) => {
      const priceId = resolveStripePriceId(product);
      const canAdd = Boolean(priceId);
      const addLabel = canAdd ? "Add To Cart" : "Stripe Price ID Needed";
      const addClass = canAdd ? "add-btn" : "add-btn disabled-btn";
      const addDisabled = canAdd ? "" : "disabled";

      return `
        <article class="product-card">
          <div class="product-image-wrap">
            <img src="${product.imageUrl || "https://via.placeholder.com/600x400?text=No+Image"}" alt="${product.name}">
            <span class="price-badge">${money(product.price)}</span>
          </div>
          <div class="product-body">
            <h4>${product.name}</h4>
            <div class="product-actions">
              <button class="button secondary details-btn" data-id="${product.id}">Item Details</button>
              <button
                class="button ${addClass}"
                data-id="${product.id}"
                data-price-id="${priceId || ""}"
                ${addDisabled}
              >${addLabel}</button>
            </div>
            <div class="product-description hidden" id="desc-${product.id}">
              ${product.description || "No description yet."}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCartPreview() {
  const previewEl = document.getElementById("cart-preview");
  const checkoutLink = document.getElementById("view-cart-link");
  if (!previewEl) {
    return;
  }

  const count = getCartCount();
  previewEl.textContent =
    count === 0
      ? "Your cart is empty."
      : `${count} ${count === 1 ? "item" : "items"} in your cart.`;

  if (checkoutLink) {
    checkoutLink.classList.toggle("hidden", count === 0);
  }
}

function bindEvents() {
  document.querySelectorAll(".category-button").forEach((button) => {
    button.addEventListener("click", () => renderCatalog(button.dataset.category));
  });

  document.addEventListener("click", (event) => {
    const detailsButton = event.target.closest(".details-btn");
    if (detailsButton) {
      const productId = detailsButton.dataset.id;
      const desc = document.getElementById(`desc-${productId}`);
      if (desc) {
        desc.classList.toggle("hidden");
      }
      return;
    }

    const addButton = event.target.closest(".add-btn");
    if (addButton && !addButton.disabled) {
      const productId = addButton.dataset.id;
      const product = allProducts().find((item) => item.id === productId);
      const priceId = addButton.dataset.priceId || resolveStripePriceId(product);
      if (!product || !priceId) {
        return;
      }

      addToCart({
        priceId,
        name: product.name,
        image: product.imageUrl || "",
        displayPrice: money(product.price)
      });

      addButton.textContent = "Added";
      setTimeout(() => {
        addButton.textContent = "Add To Cart";
      }, 1200);

      renderCartPreview();
    }
  });
}

async function loadProducts() {
  if (!isFirebaseReady) {
    Object.assign(catalog, fallbackCatalog);
    return;
  }

  try {
    const snap = await getDocs(collection(db, "products"));
    snap.forEach((docSnap) => {
      const product = normalizeProductForRead({ id: docSnap.id, ...docSnap.data() });
      const mode = getProductReadMode();
      recordContractEvent("product_normalized", { schemaVersion: product.schemaVersion, mode });
      if (!product.isPublicEligible) {
        recordContractEvent("product_ineligible", { schemaVersion: product.schemaVersion, mode, reason: product.contractIssues[0] || "eligibility" });
      }
      if (!productVisibleInMode(product)) {
        return;
      }
      const category = normalizeCategory(product.category);
      if (!category) {
        return;
      }
      if (!catalog[category]) {
        catalog[category] = [];
      }
      catalog[category].push(product);
    });
  } catch (error) {
    console.error("loadProducts failed", error);
    Object.assign(catalog, fallbackCatalog);
  }
}

async function init() {
  await loadProducts();
  if (!catalog[activeCategory]) {
    const firstCategoryWithData = Object.keys(catalog)[0];
    if (firstCategoryWithData) {
      activeCategory = firstCategoryWithData;
    }
  }
  renderCatalog(activeCategory);
  renderCartPreview();
  onCartUpdated(renderCartPreview);
  bindEvents();
}

init();
