import { auth, db, isFirebaseReady, storage } from "./firebase-client.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";

const categoryLabels = {
  "crocheted-outfits": "Wearables > Apparel > Crocheted Outfits",
  "heat-pressed": "Wearables > Apparel > Heat-Pressed",
  earrings: "Wearables > Jewelry > Earrings",
  necklaces: "Wearables > Jewelry > Necklaces",
  bracelets: "Wearables > Jewelry > Bracelets",
  rings: "Wearables > Jewelry > Rings",
  keychains: "Wearables > Jewelry > Keychains",
  totes: "Wearables > Bags and Accessories > Totes",
  purses: "Wearables > Bags and Accessories > Purses",
  "cross-body-bags": "Wearables > Bags and Accessories > Cross Body Bags",
  pouches: "Wearables > Bags and Accessories > Pouches",
  wallets: "Wearables > Bags and Accessories > Wallets",
  mugs: "Drinkware and Kitchen > Sublimated Items > Mugs",
  tumblers: "Drinkware and Kitchen > Sublimated Items > Tumblers",
  "water-bottles": "Drinkware and Kitchen > Sublimated Items > Water Bottles",
  "wine-glasses": "Drinkware and Kitchen > Sublimated Items > Wine Glasses",
  coasters: "Drinkware and Kitchen > Sublimated Items > Coasters",
  figurines: "3D Printed > Home Decor > Figurines",
  ornaments: "3D Printed > Home Decor > Ornaments",
  "desk-toys": "3D Printed > Home Decor > Desk Toys",
  planters: "3D Printed > Home Decor > Planters",
  "wall-hooks": "3D Printed > Home Decor > Wall Hooks",
  "fidget-toys": "3D Printed > Home Decor > Fidget Toys",
  "phone-stands": "3D Printed > Function Prints > Phone Stands",
  "cable-organizers": "3D Printed > Function Prints > Cable Organizers",
  "cookie-cutters": "3D Printed > Function Prints > Cookie Cutters",
  "custom-replacement-parts": "3D Printed > Function Prints > Custom Replacement Parts"
};

const setupNotice = document.getElementById("setup-notice");
const authPanel = document.getElementById("auth-panel");
const adminPanel = document.getElementById("admin-panel");
const userLabel = document.getElementById("user-label");
const authMessage = document.getElementById("auth-message");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const signOutButton = document.getElementById("sign-out");
const productForm = document.getElementById("product-form");
const imageFileInput = document.getElementById("product-image-file");
const imageUrlInput = document.getElementById("product-image-url");
const productsList = document.getElementById("products-list");
const productMessage = document.getElementById("product-message");
const promoForm = document.getElementById("promo-form");
const promoMessage = document.getElementById("promo-message");
const categorySelect = document.getElementById("product-category");
const creatorForm = document.getElementById("creator-form");
const creatorMessage = document.getElementById("creator-message");
const creatorsList = document.getElementById("creators-list");
const creatorEditingId = document.getElementById("creator-editing-id");
// Older deploys may omit id="creator-slug-input"; still match by form + name.
const creatorSlugInput =
  document.getElementById("creator-slug-input") ||
  (creatorForm && creatorForm.querySelector('[name="slug"]'));
const productCreatorSelect = document.getElementById("product-creator");

let productsCache = [];
let creatorsCache = [];

if (categorySelect) {
  Object.entries(categoryLabels).forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    categorySelect.appendChild(option);
  });
}

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? "#fca5a5" : "#9ba7bf";
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function normalizeCreatorSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fieldByName(root, name) {
  return root.querySelector(`[name="${name}"]`);
}

async function uploadImageIfNeeded(file) {
  if (!file) {
    return "";
  }
  const cleanName = file.name.replace(/\s+/g, "-").toLowerCase();
  const imageRef = ref(storage, `product-images/${Date.now()}-${cleanName}`);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
}

function creatorDisplayName(creatorId) {
  const row = creatorsCache.find((c) => c.id === creatorId);
  return row?.displayName || creatorId || "—";
}

function renderProducts() {
  if (!productsList) {
    return;
  }
  if (!productsCache.length) {
    productsList.innerHTML = "<p class='muted'>No products yet. Add your first listing above.</p>";
    return;
  }

  productsList.innerHTML = productsCache
    .map(
      (product) => {
        const cid = product.creatorId || "shelby";
        return `
        <article class="admin-product">
          <img src="${product.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}" alt="${escapeHtml(product.name)}">
          <div>
            <h4>${escapeHtml(product.name)}</h4>
            <p class="muted">Seller: ${escapeHtml(creatorDisplayName(cid))} (${escapeHtml(cid)})</p>
            <p class="muted">${categoryLabels[product.categoryId] || product.categoryId}</p>
            <p>${product.description || ""}</p>
            <p><strong>$${Number(product.price).toFixed(2)}</strong></p>
            <div class="product-actions">
              <button class="button secondary edit-btn" data-id="${product.id}">Edit</button>
              <button class="button danger delete-btn" data-id="${product.id}">Delete</button>
            </div>
          </div>
        </article>
      `;
      }
    )
    .join("");
}

function populateCreatorSelect() {
  if (!productCreatorSelect) {
    return;
  }
  productCreatorSelect.innerHTML = '<option value="">Seller / creator</option>';
  const sorted = [...creatorsCache].sort((a, b) =>
    (a.displayName || a.id).localeCompare(b.displayName || b.id, undefined, { sensitivity: "base" })
  );
  sorted.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.displayName || c.id} (${c.id})`;
    productCreatorSelect.appendChild(opt);
  });
}


function ensureCreatorOption(creatorId) {
  if (!creatorId || !productCreatorSelect) {
    return;
  }
  const exists = Array.from(productCreatorSelect.options).some((o) => o.value === creatorId);
  if (!exists) {
    const opt = document.createElement("option");
    opt.value = creatorId;
    opt.textContent = `${creatorId} (add in Creators & PayPal)`;
    productCreatorSelect.appendChild(opt);
  }
}

function renderCreatorsList() {
  if (!creatorsList) {
    return;
  }
  if (!creatorsCache.length) {
    creatorsList.innerHTML =
      "<p class='muted'>No creators yet. Add one (e.g. ID <code>shelby</code>) and paste that creator's PayPal Client ID.</p>";
    return;
  }

  const sorted = [...creatorsCache].sort((a, b) =>
    (a.displayName || a.id).localeCompare(b.displayName || b.id, undefined, { sensitivity: "base" })
  );

  creatorsList.innerHTML = sorted
    .map((c) => {
      const tail = c.paypalClientId
        ? `…${escapeHtml(String(c.paypalClientId).slice(-10))}`
        : "missing";
      return `
      <article class="admin-creator-row">
        <div><strong>${escapeHtml(c.displayName || c.id)}</strong> <span class="muted">(${escapeHtml(c.id)})</span></div>
        <p class="muted">PayPal Client ID: ${tail}</p>
        <button type="button" class="button secondary edit-creator-btn" data-id="${c.id}">Edit</button>
      </article>
    `;
    })
    .join("");
}

async function refreshCreators() {
  const snaps = await getDocs(collection(db, "creators"));
  creatorsCache = snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
  renderCreatorsList();
  populateCreatorSelect();
}

async function refreshProducts() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snaps = await getDocs(q);
    productsCache = snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
  } catch (error) {
    console.error("Products query (ordered) failed, retrying without order:", error);
    const snaps = await getDocs(collection(db, "products"));
    productsCache = snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
  }
  renderProducts();
}

/**
 * Single place that shows either the sign-in panel or the admin dashboard.
 * Called from onAuthStateChanged and again after sign-in/register so the UI
 * updates even if the auth listener is delayed or a Firestore call throws.
 */
async function syncAuthUI(user) {
  if (!user) {
    authPanel.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    userLabel.textContent = "";
    return;
  }

  userLabel.textContent = user.email || "";
  authPanel.classList.add("hidden");
  adminPanel.classList.remove("hidden");

  try {
    await refreshCreators();
    await refreshProducts();
    setMessage(authMessage, "");
  } catch (error) {
    console.error(error);
    setMessage(
      authMessage,
      "Signed in, but loading creators/products failed. Check Firestore rules (creators + products), your connection, then refresh the page.",
      true
    );
  }
}

function fillProductForm(product) {
  fieldByName(productForm, "productId").value = product.id;
  fieldByName(productForm, "name").value = product.name || "";
  fieldByName(productForm, "price").value = product.price || "";
  const cid = product.creatorId || "shelby";
  ensureCreatorOption(cid);
  productCreatorSelect.value = cid;
  categorySelect.value = product.categoryId || "";
  fieldByName(productForm, "description").value = product.description || "";
  imageUrlInput.value = product.imageUrl || "";
  fieldByName(productForm, "featured").checked = Boolean(product.featured);
  productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearProductForm() {
  productForm.reset();
  fieldByName(productForm, "productId").value = "";
}

async function saveProduct(event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  if (!auth?.currentUser) {
    setMessage(productMessage, "You are not signed in. Please sign in again.", true);
    return;
  }
  if (!productForm || !categorySelect || !productCreatorSelect) {
    setMessage(
      productMessage,
      "Product form is missing from the page. Deploy the latest admin.html (product form + category + seller fields).",
      true
    );
    return;
  }

  setMessage(productMessage, "Saving product...");

  let productId;
  let name;
  let price;
  let creatorId;
  let categoryId;
  let description;
  let featured;
  let file;
  try {
    productId = fieldByName(productForm, "productId").value.trim();
    name = fieldByName(productForm, "name").value.trim();
    price = Number(fieldByName(productForm, "price").value);
    creatorId = productCreatorSelect.value.trim();
    categoryId = categorySelect.value;
    description = fieldByName(productForm, "description").value.trim();
    featured = fieldByName(productForm, "featured").checked;
    file = imageFileInput.files[0];
  } catch (readErr) {
    console.error(readErr);
    setMessage(productMessage, "Could not read the form. Refresh the page and try again.", true);
    return;
  }

  if (!name || !creatorId || !categoryId || Number.isNaN(price)) {
    setMessage(productMessage, "Name, seller, price, and category are required.", true);
    return;
  }

  try {
    let imageUrl = imageUrlInput.value.trim();
    if (file) {
      imageUrl = await uploadImageIfNeeded(file);
    }

    const payload = {
      name,
      price,
      creatorId,
      categoryId,
      description,
      imageUrl,
      featured,
      updatedAt: serverTimestamp()
    };

    if (productId) {
      await setDoc(doc(db, "products", productId), payload, { merge: true });
      setMessage(productMessage, "Product updated.");
    } else {
      await addDoc(collection(db, "products"), {
        ...payload,
        createdAt: serverTimestamp()
      });
      setMessage(productMessage, "Product created.");
    }

    clearProductForm();
    await refreshProducts();
  } catch (error) {
    console.error(error);
    setMessage(productMessage, "Could not save product. Check Firebase config and rules.", true);
  }
}

async function savePromo(event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  if (!auth?.currentUser) {
    setMessage(promoMessage, "You are not signed in. Please sign in again.", true);
    return;
  }
  setMessage(promoMessage, "Saving promo...");

  const title = fieldByName(promoForm, "title").value.trim();
  const message = fieldByName(promoForm, "message").value.trim();
  const buttonLabel = fieldByName(promoForm, "buttonLabel").value.trim();
  const buttonUrl = fieldByName(promoForm, "buttonUrl").value.trim();

  try {
    await setDoc(doc(db, "siteContent", "homepagePromo"), {
      title,
      message,
      buttonLabel,
      buttonUrl,
      updatedAt: serverTimestamp()
    });
    setMessage(promoMessage, "Promo panel saved.");
  } catch (error) {
    console.error(error);
    setMessage(promoMessage, "Could not save promo.", true);
  }
}

function clearCreatorForm() {
  if (creatorEditingId) {
    creatorEditingId.value = "";
  }
  if (creatorSlugInput) {
    creatorSlugInput.value = "";
    creatorSlugInput.readOnly = false;
  }
  if (creatorForm) {
    fieldByName(creatorForm, "displayName").value = "";
    fieldByName(creatorForm, "paypalClientId").value = "";
  }
}

async function saveCreator(event) {
  if (event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }
  if (!auth?.currentUser) {
    setMessage(creatorMessage, "You are not signed in. Please sign in again.", true);
    return;
  }
  setMessage(creatorMessage, "Saving creator…");

  if (!creatorSlugInput || !creatorForm || !creatorEditingId) {
    setMessage(creatorMessage, "Creator form is missing from the page. Deploy the latest admin.html.", true);
    return;
  }

  const editing = creatorEditingId.value.trim();
  const slug = normalizeCreatorSlug(creatorSlugInput.value);
  const displayName = fieldByName(creatorForm, "displayName").value.trim();
  const paypalId = fieldByName(creatorForm, "paypalClientId").value.trim();

  if (!slug || !displayName || !paypalId) {
    setMessage(creatorMessage, "Creator ID, display name, and PayPal Client ID are required.", true);
    return;
  }

  const docId = editing || slug;

  try {
    await setDoc(
      doc(db, "creators", docId),
      {
        displayName,
        paypalClientId: paypalId,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    setMessage(creatorMessage, "Creator saved.");
    clearCreatorForm();
    await refreshCreators();
    renderProducts();
  } catch (error) {
    console.error(error);
    setMessage(creatorMessage, "Could not save creator. Check Firestore rules.", true);
  }
}

function bindAdminEvents() {
  // Bind products/promo first so a missing creator DOM never blocks saving listings.
  const saveProductBtn = document.getElementById("save-product-btn");
  if (saveProductBtn && productForm) {
    saveProductBtn.addEventListener("click", () => void saveProduct());
    productForm.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      void saveProduct(e);
    });
  }

  const savePromoBtn = document.getElementById("save-promo-btn");
  if (savePromoBtn && promoForm) {
    savePromoBtn.addEventListener("click", () => void savePromo());
    promoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      void savePromo(e);
    });
  }

  if (signOutButton) {
    signOutButton.addEventListener("click", () => signOut(auth));
  }

  const clearProductFormBtn = document.getElementById("clear-product-form");
  if (clearProductFormBtn) {
    clearProductFormBtn.addEventListener("click", clearProductForm);
  }

  if (productsList) {
    productsList.addEventListener("click", async (event) => {
      const editButton = event.target.closest(".edit-btn");
      if (editButton) {
        const target = productsCache.find((item) => item.id === editButton.dataset.id);
        if (target) {
          fillProductForm(target);
        }
        return;
      }

      const deleteButton = event.target.closest(".delete-btn");
      if (deleteButton) {
        const approved = window.confirm("Delete this product?");
        if (!approved) {
          return;
        }
        try {
          await deleteDoc(doc(db, "products", deleteButton.dataset.id));
          await refreshProducts();
        } catch (error) {
          console.error(error);
          setMessage(productMessage, "Could not delete product.", true);
        }
      }
    });
  }

  if (creatorSlugInput) {
    creatorSlugInput.addEventListener("blur", () => {
      if (creatorSlugInput.readOnly) {
        return;
      }
      creatorSlugInput.value = normalizeCreatorSlug(creatorSlugInput.value);
    });
  }

  const saveCreatorBtn = document.getElementById("save-creator-btn");
  if (saveCreatorBtn) {
    saveCreatorBtn.addEventListener("click", () => void saveCreator());
  }
  if (creatorForm) {
    creatorForm.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      void saveCreator(e);
    });
  }

  const clearCreatorFormBtn = document.getElementById("clear-creator-form");
  if (clearCreatorFormBtn) {
    clearCreatorFormBtn.addEventListener("click", () => {
      clearCreatorForm();
      setMessage(creatorMessage, "");
    });
  }

  if (creatorsList && creatorEditingId && creatorSlugInput && creatorForm) {
    creatorsList.addEventListener("click", (event) => {
      const btn = event.target.closest(".edit-creator-btn");
      if (!btn) {
        return;
      }
      const id = btn.dataset.id;
      const row = creatorsCache.find((c) => c.id === id);
      if (!row) {
        return;
      }
      creatorEditingId.value = row.id;
      creatorSlugInput.value = row.id;
      creatorSlugInput.readOnly = true;
      fieldByName(creatorForm, "displayName").value = row.displayName || "";
      fieldByName(creatorForm, "paypalClientId").value = row.paypalClientId || "";
      setMessage(creatorMessage, `Editing ${row.id}. Save to update, or click New creator.`);
      creatorForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function bindAuthEvents() {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = registerForm.elements.email.value.trim();
    const password = registerForm.elements.password.value;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      registerForm.reset();
      setMessage(authMessage, "Account created.");
      await syncAuthUI(auth.currentUser);
    } catch (error) {
      setMessage(authMessage, error.message, true);
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = loginForm.elements.email.value.trim();
    const password = loginForm.elements.password.value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      loginForm.reset();
      setMessage(authMessage, "Signed in.");
      await syncAuthUI(auth.currentUser);
    } catch (error) {
      setMessage(authMessage, error.message, true);
    }
  });
}

if (!isFirebaseReady) {
  setupNotice.classList.remove("hidden");
  authPanel.classList.add("hidden");
  adminPanel.classList.add("hidden");
} else {
  // Register auth listener FIRST. If bindAdminEvents() threw, we used to never attach
  // onAuthStateChanged — admin-panel stayed hidden even when Firebase had a signed-in user.
  onAuthStateChanged(auth, (user) => {
    void syncAuthUI(user);
  });

  bindAuthEvents();

  try {
    bindAdminEvents();
  } catch (err) {
    console.error("Admin dashboard bindings failed (products/creators may not work):", err);
  }
}
