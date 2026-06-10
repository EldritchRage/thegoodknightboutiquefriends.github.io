import { db, isFirebaseReady } from "./firebase-client.js";
import { watchAuth } from "./auth-service.js";
import { saveCart } from "./cart-storage.js";
import { categoryLabels, defaultCategory } from "./categories.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const fallbackCatalog = {};

let activeCategory = defaultCategory;
const cart = {};
const catalog = {};
let currentUser = null;

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

function getProductById(productId) {
  return allProducts().find((item) => item.id === productId) || null;
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
}

function goToCheckout() {
  if (!Object.keys(cart).length) {
    return;
  }
  saveCart(cart);
  if (currentUser) {
    window.location.href = "buy.html";
    return;
  }
  window.location.href = "login.html?next=buy.html";
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

  document.getElementById("checkout-toggle").addEventListener("click", goToCheckout);
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
  watchAuth((user) => {
    currentUser = user;
  });

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
