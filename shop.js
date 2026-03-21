import { db, isFirebaseReady } from "./firebase-client.js";
import { paypalClientId as fallbackShelbyPaypalId } from "./paypal-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const categoryLabels = {
  "crocheted-outfits": "Crocheted Outfits",
  "heat-pressed": "Heat-Pressed",
  earrings: "Earrings",
  necklaces: "Necklaces",
  bracelets: "Bracelets",
  rings: "Rings",
  keychains: "Keychains",
  totes: "Totes",
  purses: "Purses",
  "cross-body-bags": "Cross Body Bags",
  pouches: "Pouches",
  wallets: "Wallets",
  mugs: "Mugs",
  tumblers: "Tumblers",
  "water-bottles": "Water Bottles",
  "wine-glasses": "Wine Glasses",
  coasters: "Coasters",
  figurines: "Figurines",
  ornaments: "Ornaments",
  "desk-toys": "Desk Toys",
  planters: "Planters",
  "wall-hooks": "Wall Hooks",
  "fidget-toys": "Fidget Toys",
  "phone-stands": "Phone Stands",
  "cable-organizers": "Cable Organizers",
  "cookie-cutters": "Cookie Cutters",
  "custom-replacement-parts": "Custom Replacement Parts"
};

const fallbackCatalog = {
  "crocheted-outfits": [
    {
      id: "sample-crochet",
      name: "Sample Crocheted Outfit",
      price: 48,
      creatorId: "shelby",
      imageUrl: "https://via.placeholder.com/600x400?text=Add+Products+in+Admin",
      description: "Use the Admin page to replace this sample with Shelby's real listings."
    }
  ]
};

let activeCategory = "crocheted-outfits";
const cart = {};
const catalog = {};
/** @type {Record<string, { displayName: string, paypalClientId: string }>} */
let creatorsMap = {};

function money(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function isValidPaypalClientId(id) {
  return (
    typeof id === "string" &&
    id.length > 20 &&
    !id.includes("PASTE_YOUR_PAYPAL")
  );
}

function getCreatorId(product) {
  return (product && product.creatorId) || "shelby";
}

function getCreatorLabel(creatorId) {
  const c = creatorsMap[creatorId];
  return (c && c.displayName) || creatorId;
}

function resolvePaypalClientId(creatorId) {
  const fromDb = creatorsMap[creatorId];
  if (fromDb && isValidPaypalClientId(fromDb.paypalClientId)) {
    return fromDb.paypalClientId;
  }
  if (creatorId === "shelby" && isValidPaypalClientId(fallbackShelbyPaypalId)) {
    return fallbackShelbyPaypalId;
  }
  return null;
}

function allProducts() {
  return Object.values(catalog).flat();
}

function getProductById(productId) {
  return allProducts().find((item) => item.id === productId) || null;
}

function getCartSubtotal() {
  let subtotal = 0;
  for (const [productId, qty] of Object.entries(cart)) {
    const product = getProductById(productId);
    if (product) {
      subtotal += Number(product.price) * qty;
    }
  }
  return Math.round(subtotal * 100) / 100;
}

function groupCartByCreator() {
  /** @type {Record<string, { subtotal: number }>} */
  const groups = {};
  for (const [productId, qty] of Object.entries(cart)) {
    const product = getProductById(productId);
    if (!product) {
      continue;
    }
    const cid = getCreatorId(product);
    if (!groups[cid]) {
      groups[cid] = { subtotal: 0 };
    }
    groups[cid].subtotal += Number(product.price) * qty;
  }
  for (const k of Object.keys(groups)) {
    groups[k].subtotal = Math.round(groups[k].subtotal * 100) / 100;
  }
  return groups;
}

function clearCartForCreator(creatorId) {
  for (const productId of Object.keys({ ...cart })) {
    const product = getProductById(productId);
    if (!product) {
      delete cart[productId];
      continue;
    }
    if (getCreatorId(product) === creatorId) {
      delete cart[productId];
    }
  }
}

function validateCheckoutForm() {
  const form = document.getElementById("checkout-form");
  const fullName = form.elements.fullName.value.trim();
  const address = form.elements.address.value.trim();
  const shippingMethod = form.elements.shippingMethod.value;
  if (!fullName || !address || !shippingMethod) {
    return {
      ok: false,
      message:
        "Please fill in your name, shipping address, and shipping method before paying with PayPal."
    };
  }
  return { ok: true };
}

function isCheckoutVisible() {
  const el = document.getElementById("checkout-section");
  return Boolean(el && !el.classList.contains("hidden"));
}

function renderSellerPayPalFrames() {
  const container = document.getElementById("paypal-sellers-container");
  const placeholder = document.getElementById("paypal-config-placeholder");
  if (!container) {
    return;
  }
  container.innerHTML = "";

  const groups = groupCartByCreator();
  const creatorIds = Object.keys(groups);
  if (!creatorIds.length) {
    if (placeholder) {
      placeholder.classList.add("hidden");
    }
    return;
  }

  const check = validateCheckoutForm();
  if (!check.ok) {
    container.innerHTML =
      "<p class='muted'>Fill in your shipping details above. Then each creator's PayPal button will appear for their portion of the order.</p>";
    if (placeholder) {
      placeholder.classList.add("hidden");
    }
    return;
  }

  const form = document.getElementById("checkout-form");
  const custom = [
    form.elements.fullName.value.trim(),
    form.elements.address.value.trim(),
    form.elements.shippingMethod.value
  ].join(" | ");

  let anyMissing = false;
  for (const creatorId of creatorIds) {
    const subtotal = groups[creatorId].subtotal;
    const paypalId = resolvePaypalClientId(creatorId);
    const label = getCreatorLabel(creatorId);

    const wrap = document.createElement("div");
    wrap.className = "seller-checkout-block";

    if (!paypalId) {
      anyMissing = true;
      wrap.innerHTML = `<p><strong>${escapeHtml(label)}</strong> — ${money(subtotal)}</p><p class="muted">PayPal Client ID not set yet. In Admin → Creators & PayPal, add this creator and paste their PayPal Client ID (or use <code>paypal-config.js</code> as a fallback for <strong>shelby</strong> only).</p>`;
      container.appendChild(wrap);
      continue;
    }

    wrap.innerHTML = `<p class="seller-checkout-title"><strong>${escapeHtml(label)}</strong> — pay <strong>${money(subtotal)}</strong> <span class="muted">(this creator's items only)</span></p>`;
    const iframe = document.createElement("iframe");
    iframe.title = `PayPal — ${label}`;
    iframe.className = "paypal-creator-iframe";
    iframe.setAttribute("loading", "lazy");
    const qs = new URLSearchParams({
      clientId: paypalId,
      value: subtotal.toFixed(2),
      creatorId,
      custom: custom.slice(0, 500)
    });
    iframe.src = `paypal-embed.html?${qs.toString()}`;
    wrap.appendChild(iframe);
    container.appendChild(wrap);
  }

  if (placeholder) {
    placeholder.classList.toggle("hidden", !anyMissing);
  }
}

function renderCatalog(categoryId) {
  activeCategory = categoryId;
  const catalogTitle = document.getElementById("catalog-title");
  const catalogGrid = document.getElementById("catalog-grid");
  const categoryButtons = document.querySelectorAll(".category-button");

  const categoryTitle = categoryLabels[categoryId] || "Category";
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
      const seller = escapeHtml(getCreatorLabel(getCreatorId(product)));
      return `
        <article class="product-card">
          <div class="product-image-wrap">
            <img src="${product.imageUrl || "https://via.placeholder.com/600x400?text=No+Image"}" alt="${escapeHtml(product.name)}">
            <span class="price-badge">${money(product.price)}</span>
          </div>
          <div class="product-body">
            <h4>${escapeHtml(product.name)}</h4>
            <p class="muted product-seller-line">Seller: ${seller}</p>
            <div class="product-actions">
              <button class="button secondary details-btn" data-id="${product.id}">Item Details</button>
              <button class="button add-btn" data-id="${product.id}">Add To Cart</button>
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

function renderCart() {
  const cartList = document.getElementById("cart-list");
  const subtotalEl = document.getElementById("subtotal");
  const checkoutButton = document.getElementById("checkout-toggle");
  const entries = Object.entries(cart);

  if (!entries.length) {
    cartList.innerHTML = "<li class='muted'>Cart is empty.</li>";
    subtotalEl.textContent = money(0);
    checkoutButton.disabled = true;
    if (isCheckoutVisible()) {
      renderSellerPayPalFrames();
    }
    return;
  }

  let subtotal = 0;
  cartList.innerHTML = entries
    .map(([productId, qty]) => {
      const product = getProductById(productId);
      if (!product) {
        return "";
      }
      const line = Number(product.price) * qty;
      subtotal += line;
      const seller = escapeHtml(getCreatorLabel(getCreatorId(product)));
      return `
        <li class="cart-item">
          <div>
            <strong>${escapeHtml(product.name)}</strong><br>
            <span class="muted">${money(product.price)} each · ${seller}</span>
          </div>
          <div>
            <div class="qty-controls">
              <button class="qty-btn" data-id="${product.id}" data-action="dec">-</button>
              <span>${qty}</span>
              <button class="qty-btn" data-id="${product.id}" data-action="inc">+</button>
            </div>
            <div style="text-align:right; margin-top:4px;">${money(line)}</div>
          </div>
        </li>
      `;
    })
    .join("");

  subtotalEl.textContent = money(subtotal);
  checkoutButton.disabled = false;

  if (isCheckoutVisible()) {
    renderSellerPayPalFrames();
  }
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const catBtn = event.target.closest(".category-button");
    if (catBtn && catBtn.dataset.category) {
      event.preventDefault();
      renderCatalog(catBtn.dataset.category);
      return;
    }

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
    if (addButton) {
      const productId = addButton.dataset.id;
      cart[productId] = (cart[productId] || 0) + 1;
      renderCart();
      return;
    }

    const qtyButton = event.target.closest(".qty-btn");
    if (qtyButton) {
      const productId = qtyButton.dataset.id;
      const action = qtyButton.dataset.action;
      if (!cart[productId]) {
        return;
      }
      if (action === "inc") {
        cart[productId] += 1;
      } else {
        cart[productId] -= 1;
      }
      if (cart[productId] <= 0) {
        delete cart[productId];
      }
      renderCart();
    }
  });

  const checkoutToggle = document.getElementById("checkout-toggle");
  const checkoutSection = document.getElementById("checkout-section");
  checkoutToggle.addEventListener("click", () => {
    checkoutSection.classList.toggle("hidden");
    checkoutSection.scrollIntoView({ behavior: "smooth", block: "start" });
    if (!checkoutSection.classList.contains("hidden")) {
      renderSellerPayPalFrames();
    }
  });

  const checkoutForm = document.getElementById("checkout-form");
  checkoutForm.addEventListener("input", () => {
    if (isCheckoutVisible()) {
      renderSellerPayPalFrames();
    }
  });
  checkoutForm.addEventListener("change", () => {
    if (isCheckoutVisible()) {
      renderSellerPayPalFrames();
    }
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) {
      return;
    }
    if (!event.data || event.data.type !== "paypal-creator-paid") {
      return;
    }
    const paidCreatorId = event.data.creatorId;
    clearCartForCreator(paidCreatorId);
    renderCart();
    const checkoutFormEl = document.getElementById("checkout-form");
    const thankYouMessage = document.getElementById("thank-you");
    const checkoutSectionEl = document.getElementById("checkout-section");
    if (Object.keys(cart).length === 0) {
      checkoutSectionEl.classList.add("hidden");
      checkoutFormEl.reset();
      thankYouMessage.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
}

async function loadCreators() {
  creatorsMap = {};
  if (isFirebaseReady) {
    try {
      const snap = await getDocs(collection(db, "creators"));
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        creatorsMap[docSnap.id] = {
          displayName: (d.displayName || docSnap.id).trim(),
          paypalClientId: (d.paypalClientId || "").trim()
        };
      });
    } catch (error) {
      console.error(error);
    }
  }
  if (!Object.keys(creatorsMap).length) {
    creatorsMap.shelby = {
      displayName: "Shelby Knight",
      paypalClientId: isValidPaypalClientId(fallbackShelbyPaypalId) ? fallbackShelbyPaypalId : ""
    };
  }
}

async function loadProducts() {
  if (!isFirebaseReady) {
    Object.assign(catalog, fallbackCatalog);
    return;
  }

  try {
    const snap = await getDocs(collection(db, "products"));
    snap.forEach((docSnap) => {
      const product = { id: docSnap.id, ...docSnap.data() };
      if (!product.categoryId) {
        return;
      }
      if (!product.creatorId) {
        product.creatorId = "shelby";
      }
      if (!catalog[product.categoryId]) {
        catalog[product.categoryId] = [];
      }
      catalog[product.categoryId].push(product);
    });
  } catch (error) {
    console.error(error);
    Object.assign(catalog, fallbackCatalog);
  }
}

async function init() {
  await loadCreators();
  await loadProducts();
  if (!catalog[activeCategory]) {
    const firstCategoryWithData = Object.keys(catalog)[0];
    if (firstCategoryWithData) {
      activeCategory = firstCategoryWithData;
    }
  }
  renderCatalog(activeCategory);
  renderCart();
  bindEvents();
}

init();
