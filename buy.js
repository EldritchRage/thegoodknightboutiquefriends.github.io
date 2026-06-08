import { requireAuth, logOut } from "./auth-service.js";
import { loadCart } from "./cart-storage.js";
import { stripeConfig } from "./stripe-config.js";
import { db, isFirebaseReady } from "./firebase-client.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const userEmailEl = document.getElementById("user-email");
const signOutBtn = document.getElementById("sign-out-btn");
const cartListEl = document.getElementById("buy-cart-list");
const subtotalEl = document.getElementById("buy-subtotal");
const paymentLinksEl = document.getElementById("payment-links");
const buyMessageEl = document.getElementById("buy-message");

let productCatalog = {};

function money(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function setMessage(text, isError = false) {
  buyMessageEl.textContent = text;
  buyMessageEl.style.color = isError ? "#fca5a5" : "#9ba7bf";
}

function getPaymentLinkForProduct(productId) {
  const mapped = stripeConfig.productPaymentLinks?.[productId];
  if (mapped && mapped.startsWith("http")) {
    return mapped;
  }
  return stripeConfig.defaultPaymentLink;
}

function isValidStripeLink(url) {
  return typeof url === "string" && url.startsWith("https://buy.stripe.com/");
}

function openStripeLink(url) {
  if (!isValidStripeLink(url)) {
    setMessage("Paste a valid Stripe Payment Link in stripe-config.js", true);
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

function renderPaymentButtons(cartEntries) {
  if (!cartEntries.length) {
    paymentLinksEl.innerHTML = "<p class='muted'>Your cart is empty. <a href='shop.html'>Return to shop</a>.</p>";
    return;
  }

  const buttons = cartEntries.map(([productId, qty]) => {
    const product = productCatalog[productId];
    const name = product?.name || "Item";
    const link = getPaymentLinkForProduct(productId);
    const label = qty > 1 ? `Buy Now — ${name} (×${qty})` : `Buy Now — ${name}`;
    return `
      <article class="admin-product">
        <div>
          <h4>${name}</h4>
          <p class="muted">${money(product?.price || 0)} each</p>
          <button type="button" class="button stripe-buy-btn" data-url="${link}">
            ${label}
          </button>
        </div>
      </article>
    `;
  });

  const defaultLink = stripeConfig.defaultPaymentLink;
  const showDefault =
    cartEntries.length > 1 ||
    !isValidStripeLink(getPaymentLinkForProduct(cartEntries[0][0]));

  if (showDefault && isValidStripeLink(defaultLink)) {
    buttons.push(`
      <article class="admin-product">
        <div>
          <h4>Complete Order</h4>
          <p class="muted">Use your main Stripe Payment Link for the full cart.</p>
          <button type="button" class="button stripe-buy-btn" data-url="${defaultLink}">
            Buy Now — Complete Order
          </button>
        </div>
      </article>
    `);
  }

  paymentLinksEl.innerHTML = buttons.join("");

  paymentLinksEl.querySelectorAll(".stripe-buy-btn").forEach((button) => {
    button.addEventListener("click", () => openStripeLink(button.dataset.url));
  });
}

function renderCart(cart) {
  const entries = Object.entries(cart);
  if (!entries.length) {
    cartListEl.innerHTML = "<li class='muted'>Cart is empty.</li>";
    subtotalEl.textContent = money(0);
    renderPaymentButtons([]);
    return;
  }

  let subtotal = 0;
  cartListEl.innerHTML = entries
    .map(([productId, qty]) => {
      const product = productCatalog[productId];
      const line = Number(product?.price || 0) * qty;
      subtotal += line;
      return `
        <li class="cart-item">
          <div>
            <strong>${product?.name || "Item"}</strong><br>
            <span class="muted">Qty: ${qty}</span>
          </div>
          <div>${money(line)}</div>
        </li>
      `;
    })
    .join("");

  subtotalEl.textContent = money(subtotal);
  renderPaymentButtons(entries);
}

async function loadProducts() {
  if (!isFirebaseReady) {
    return;
  }
  try {
    const snap = await getDocs(collection(db, "products"));
    snap.forEach((docSnap) => {
      productCatalog[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
    });
  } catch (error) {
    console.error("loadProducts failed", error);
    setMessage("Could not load product details.", true);
  }
}

signOutBtn.addEventListener("click", async () => {
  await logOut();
  window.location.href = "login.html?next=buy.html";
});

requireAuth("login.html", "buy.html").then(async (user) => {
  userEmailEl.textContent = user.email || "Customer";
  await loadProducts();
  const cart = loadCart();
  renderCart(cart);

  if (!isValidStripeLink(stripeConfig.defaultPaymentLink)) {
    setMessage("Add your Stripe Payment Link in stripe-config.js → defaultPaymentLink", true);
  }
});
