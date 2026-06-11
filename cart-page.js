import {
  getCartItems,
  getCartCount,
  removeFromCart,
  updateQuantity,
  onCartUpdated
} from "./cart.js";
import { createCheckoutSession } from "./checkout.js";
import { CHECKOUT_API_URL } from "./checkout-config.js";

const emptyCartEl = document.getElementById("empty-cart");
const cartContentEl = document.getElementById("cart-content");
const cartItemsEl = document.getElementById("cart-items");
const summaryLinesEl = document.getElementById("summary-lines");
const cartItemCountEl = document.getElementById("cart-item-count");
const checkoutBtn = document.getElementById("checkout-btn");
const checkoutMessageEl = document.getElementById("checkout-message");

function setCheckoutMessage(text, isError = false) {
  checkoutMessageEl.textContent = text;
  checkoutMessageEl.style.color = isError ? "#fca5a5" : "#9ba7bf";
}

function renderCart() {
  const items = getCartItems();

  if (!items.length) {
    emptyCartEl.classList.remove("hidden");
    cartContentEl.classList.add("hidden");
    return;
  }

  emptyCartEl.classList.add("hidden");
  cartContentEl.classList.remove("hidden");

  const count = getCartCount();
  cartItemCountEl.textContent = `${count} ${count === 1 ? "item" : "items"}`;

  cartItemsEl.innerHTML = items
    .map(
      (item) => `
        <li class="cart-item cart-item-full">
          <img src="${item.image || "https://via.placeholder.com/80x80?text=Item"}" alt="${item.name}" class="cart-thumb">
          <div class="cart-item-details">
            <strong>${item.name}</strong>
            <span class="muted">${item.displayPrice || "Price at checkout"}</span>
            <div class="qty-controls">
              <button type="button" class="qty-btn" data-price-id="${item.priceId}" data-action="dec">-</button>
              <span>${item.quantity}</span>
              <button type="button" class="qty-btn" data-price-id="${item.priceId}" data-action="inc">+</button>
            </div>
          </div>
          <button type="button" class="button secondary remove-btn" data-price-id="${item.priceId}">Remove</button>
        </li>
      `
    )
    .join("");

  summaryLinesEl.innerHTML = items
    .map(
      (item) => `
        <div class="summary-line">
          <span>${item.name} × ${item.quantity}</span>
          <span>${item.displayPrice || "—"}</span>
        </div>
      `
    )
    .join("");
}

cartItemsEl.addEventListener("click", (event) => {
  const qtyBtn = event.target.closest(".qty-btn");
  if (qtyBtn) {
    const priceId = qtyBtn.dataset.priceId;
    const item = getCartItems().find((entry) => entry.priceId === priceId);
    if (!item) {
      return;
    }
    if (qtyBtn.dataset.action === "inc") {
      updateQuantity(priceId, item.quantity + 1);
    } else {
      updateQuantity(priceId, item.quantity - 1);
    }
    renderCart();
    return;
  }

  const removeBtn = event.target.closest(".remove-btn");
  if (removeBtn) {
    removeFromCart(removeBtn.dataset.priceId);
    renderCart();
  }
});

checkoutBtn.addEventListener("click", async () => {
  const items = getCartItems();
  if (!items.length) {
    return;
  }

  if (CHECKOUT_API_URL.includes("YOUR_CLOUDFLARE_WORKER_URL")) {
    setCheckoutMessage("Set your Cloudflare Worker URL in checkout-config.js before checkout.", true);
    return;
  }

  checkoutBtn.disabled = true;
  checkoutBtn.textContent = "Redirecting to Stripe…";
  setCheckoutMessage("");

  try {
    const url = await createCheckoutSession(items);
    window.location.href = url;
  } catch (error) {
    console.error("checkout failed", error);
    setCheckoutMessage(error.message || "Failed to start checkout. Please try again.", true);
    checkoutBtn.disabled = false;
    checkoutBtn.textContent = "Secure Checkout";
  }
});

onCartUpdated(renderCart);
renderCart();
