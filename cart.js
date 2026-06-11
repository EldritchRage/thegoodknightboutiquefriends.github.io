const CART_KEY = "stripe_cart";

function getCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item) =>
        item &&
        typeof item.priceId === "string" &&
        item.priceId.startsWith("price_") &&
        typeof item.name === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartItems() {
  return getCart();
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function addToCart({ priceId, name, image, displayPrice }) {
  const cart = getCart();
  const existing = cart.find((item) => item.priceId === priceId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ priceId, name, image, displayPrice, quantity: 1 });
  }

  saveCart(cart);
}

export function removeFromCart(priceId) {
  const cart = getCart().filter((item) => item.priceId !== priceId);
  saveCart(cart);
}

export function updateQuantity(priceId, quantity) {
  const cart = getCart();
  const item = cart.find((entry) => entry.priceId === priceId);
  if (!item) {
    return;
  }

  if (quantity <= 0) {
    removeFromCart(priceId);
    return;
  }

  item.quantity = Math.min(quantity, 99);
  saveCart(cart);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("cart-updated"));
}

export function onCartUpdated(callback) {
  const handler = () => callback();
  window.addEventListener("cart-updated", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("cart-updated", handler);
    window.removeEventListener("storage", handler);
  };
}
