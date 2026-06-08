const CART_KEY = "gkb_cart";

export function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function loadCart() {
  try {
    const raw = sessionStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error("loadCart failed", error);
    return {};
  }
}

export function clearCart() {
  sessionStorage.removeItem(CART_KEY);
}
