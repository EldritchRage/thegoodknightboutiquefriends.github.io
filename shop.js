import { db, isFirebaseReady } from "./firebase-client.js";
import { braintreeConfig } from "./braintree-config.js";
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const SHIPPING_RATES = {
  standard: 5,
  expedited: 12,
  overnight: 25
};

let dropinInstance = null;
let dropinReady = false;

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
      imageUrl: "https://via.placeholder.com/600x400?text=Add+Products+in+Admin",
      description: "Use the Admin page to replace this sample with Shelby's real listings."
    }
  ]
};

let activeCategory = "crocheted-outfits";
const cart = {};
const catalog = {};

function money(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function getCartSubtotal() {
  return Object.entries(cart).reduce((sum, [productId, qty]) => {
    const product = getProductById(productId);
    if (!product) {
      return sum;
    }
    return sum + Number(product.price) * qty;
  }, 0);
}

function getShippingCost(method) {
  return SHIPPING_RATES[method] || 0;
}

function getOrderTotal(shippingMethod) {
  return getCartSubtotal() + getShippingCost(shippingMethod);
}

function setPaymentMessage(text, isError = false) {
  const el = document.getElementById("payment-message");
  if (!el) {
    return;
  }
  el.textContent = text;
  el.style.color = isError ? "#fca5a5" : "#9ba7bf";
}

function updateOrderTotalDisplay() {
  const checkoutForm = document.getElementById("checkout-form");
  const orderTotalEl = document.getElementById("order-total");
  if (!checkoutForm || !orderTotalEl) {
    return;
  }
  const shippingMethod = checkoutForm.elements.shippingMethod.value;
  orderTotalEl.textContent = money(getOrderTotal(shippingMethod));
}

async function fetchBraintreeClientToken() {
  const url = braintreeConfig.clientTokenUrl?.trim();
  if (!url) {
    throw new Error("Set braintreeConfig.clientTokenUrl in braintree-config.js");
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Client token request failed (${response.status})`);
  }
  const data = await response.json();
  if (!data.clientToken) {
    throw new Error("Server response missing clientToken");
  }
  return data.clientToken;
}

function teardownDropin() {
  if (dropinInstance) {
    dropinInstance.teardown(() => {
      dropinInstance = null;
      dropinReady = false;
    });
    return;
  }
  dropinReady = false;
}

async function initBraintreeDropin() {
  if (typeof braintree === "undefined") {
    throw new Error("Braintree Drop-in script did not load");
  }

  const checkoutForm = document.getElementById("checkout-form");
  const shippingMethod = checkoutForm?.elements.shippingMethod?.value || "standard";
  const amount = getOrderTotal(shippingMethod).toFixed(2);

  teardownDropin();

  const clientToken = await fetchBraintreeClientToken();

  return new Promise((resolve, reject) => {
    braintree.dropin.create(
      {
        authorization: clientToken,
        container: document.getElementById("dropin-container"),
        paypal: {
          flow: "checkout",
          amount,
          currency: "USD"
        }
      },
      (error, instance) => {
        if (error) {
          console.error("braintree.dropin.create failed", error);
          reject(error);
          return;
        }
        dropinInstance = instance;
        dropinReady = true;
        setPaymentMessage("Choose PayPal or enter card details below.");
        resolve(instance);
      }
    );
  });
}

function allProducts() {
  return Object.values(catalog).flat();
}

function getProductById(productId) {
  return allProducts().find((item) => item.id === productId) || null;
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
    .map(
      (product) => `
        <article class="product-card">
          <div class="product-image-wrap">
            <img src="${product.imageUrl || "https://via.placeholder.com/600x400?text=No+Image"}" alt="${product.name}">
            <span class="price-badge">${money(product.price)}</span>
          </div>
          <div class="product-body">
            <h4>${product.name}</h4>
            <div class="product-actions">
              <button class="button secondary details-btn" data-id="${product.id}">Item Details</button>
              <button class="button add-btn" data-id="${product.id}">Add To Cart</button>
            </div>
            <div class="product-description hidden" id="desc-${product.id}">
              ${product.description || "No description yet."}
            </div>
          </div>
        </article>
      `
    )
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
      return `
        <li class="cart-item">
          <div>
            <strong>${product.name}</strong><br>
            <span class="muted">${money(product.price)} each</span>
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
  updateOrderTotalDisplay();
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
  const checkoutForm = document.getElementById("checkout-form");
  const thankYouMessage = document.getElementById("thank-you");
  const makePurchaseBtn = document.getElementById("make-purchase-btn");

  checkoutToggle.addEventListener("click", async () => {
    const opening = checkoutSection.classList.contains("hidden");
    checkoutSection.classList.toggle("hidden");
    if (!opening) {
      teardownDropin();
      return;
    }
    checkoutSection.scrollIntoView({ behavior: "smooth", block: "start" });
    updateOrderTotalDisplay();
    setPaymentMessage("Loading payment options...");
    try {
      await initBraintreeDropin();
    } catch (error) {
      console.error("initBraintreeDropin failed", error);
      setPaymentMessage(error.message, true);
    }
  });

  checkoutForm.elements.shippingMethod.addEventListener("change", async () => {
    updateOrderTotalDisplay();
    if (!checkoutSection.classList.contains("hidden")) {
      try {
        await initBraintreeDropin();
      } catch (error) {
        console.error("reinit dropin after shipping change failed", error);
        setPaymentMessage(error.message, true);
      }
    }
  });

  checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!Object.keys(cart).length) {
      return;
    }
    if (!dropinInstance || !dropinReady) {
      setPaymentMessage("Payment form is not ready yet. Wait a moment and try again.", true);
      return;
    }

    const originalLabel = makePurchaseBtn.textContent;
    makePurchaseBtn.disabled = true;
    makePurchaseBtn.textContent = "Processing...";
    setPaymentMessage("Processing payment...");

    const fullName = checkoutForm.elements.fullName.value.trim();
    const address = checkoutForm.elements.address.value.trim();
    const shippingMethod = checkoutForm.elements.shippingMethod.value;
    const subtotal = getCartSubtotal();
    const shippingCost = getShippingCost(shippingMethod);
    const total = getOrderTotal(shippingMethod);

    try {
      const payload = await new Promise((resolve, reject) => {
        dropinInstance.requestPaymentMethod((error, payload) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(payload);
        });
      });

      const orderRecord = {
        fullName,
        address,
        shippingMethod,
        subtotal,
        shippingCost,
        total,
        paymentNonce: payload.nonce,
        paymentType: payload.type,
        items: Object.entries(cart).map(([productId, qty]) => {
          const product = getProductById(productId);
          return {
            productId,
            name: product?.name || "Unknown",
            price: product?.price || 0,
            qty
          };
        }),
        status: braintreeConfig.checkoutUrl ? "pending_capture" : "paid_demo",
        createdAt: serverTimestamp()
      };

      if (braintreeConfig.checkoutUrl) {
        const chargeResponse = await fetch(braintreeConfig.checkoutUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethodNonce: payload.nonce,
            amount: total.toFixed(2),
            order: orderRecord
          })
        });
        if (!chargeResponse.ok) {
          throw new Error(`Checkout server failed (${chargeResponse.status})`);
        }
        const chargeResult = await chargeResponse.json();
        if (!chargeResult.success) {
          throw new Error(chargeResult.message || "Payment was not approved");
        }
        orderRecord.transactionId = chargeResult.transactionId || "";
        orderRecord.status = "paid";
      } else if (isFirebaseReady) {
        await addDoc(collection(db, "orders"), orderRecord);
      }

      Object.keys(cart).forEach((key) => delete cart[key]);
      renderCart();
      teardownDropin();
      checkoutSection.classList.add("hidden");
      checkoutForm.reset();
      thankYouMessage.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setPaymentMessage("");
    } catch (error) {
      console.error("checkout failed", error);
      setPaymentMessage(error.message || "Payment failed. Please try again.", true);
    } finally {
      makePurchaseBtn.disabled = false;
      makePurchaseBtn.textContent = originalLabel;
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
      const product = { id: docSnap.id, ...docSnap.data() };
      if (!product.category) {
        return;
      }
      if (!catalog[product.category]) {
        catalog[product.category] = [];
      }
      catalog[product.category].push(product);
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
  renderCart();
  bindEvents();
}

init();
