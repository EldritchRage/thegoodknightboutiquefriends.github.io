import { getCartCount, onCartUpdated } from "./cart.js";

function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) {
    return;
  }
  const count = getCartCount();
  badge.textContent = String(count);
  badge.classList.toggle("hidden", count === 0);
}

updateCartBadge();
onCartUpdated(updateCartBadge);
