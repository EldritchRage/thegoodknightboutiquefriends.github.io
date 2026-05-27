import { auth, db, isFirebaseReady, storage } from "./firebase-client.js";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  getDoc
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
const creatorImageFile = document.getElementById("creator-image-file");
const creatorImageUrl = document.getElementById("creator-image-url");
const creatorSaveBtn = document.getElementById("creator-save-btn");
const productCreatorSelect = document.getElementById("product-creator");

let productsCache = [];
let creatorsCache = [];

Object.entries(categoryLabels).forEach(([value, label]) => {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  categorySelect.appendChild(option);
});

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.style.color = isError ? "#fca5a5" : "#9ba7bf";
}

async function uploadImageToPath(storagePath, file) {
  if (!file || !storagePath) {
    return "";
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const cleanExt = ext.replace(/[^a-z0-9]/gi, "") || "jpg";
  const imageRef = ref(storage, `${storagePath}.${cleanExt}`);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
}

async function uploadProductImage(docId, file) {
  if (!file || !docId) {
    return "";
  }
  try {
    return await uploadImageToPath(`products/${docId}`, file);
  } catch (error) {
    console.error("uploadProductImage failed", error);
    throw error;
  }
}

async function uploadCreatorImage(docId, file) {
  if (!file || !docId) {
    return "";
  }
  try {
    return await uploadImageToPath(`creators/${docId}`, file);
  } catch (error) {
    console.error("uploadCreatorImage failed", error);
    throw error;
  }
}

function renderCreators() {
  productCreatorSelect.innerHTML = '<option value="">Seller / Creator</option>';
  creatorsCache.forEach((creator) => {
    const option = document.createElement("option");
    option.value = creator.id;
    option.textContent = creator.name;
    productCreatorSelect.appendChild(option);
  });

  if (creatorsCache.length === 1) {
    productCreatorSelect.value = creatorsCache[0].id;
  }

  if (!creatorsCache.length) {
    creatorsList.innerHTML = "<p class='muted'>No creators yet. Save Shelby Knight above to unlock products.</p>";
    return;
  }

  creatorsList.innerHTML = creatorsCache
    .map(
      (creator) => `
        <article class="admin-product">
          <img src="${creator.imageUrl || "https://via.placeholder.com/300x200?text=Creator"}" alt="${creator.name}">
          <div>
            <h4>${creator.name}</h4>
            <p>${creator.bio || ""}</p>
            <button type="button" class="button secondary edit-creator-btn" data-id="${creator.id}">Edit</button>
          </div>
        </article>
      `
    )
    .join("");
}

function fillCreatorForm(creator) {
  creatorForm.elements.creatorId.value = creator.id;
  creatorForm.elements.name.value = creator.name || "";
  creatorForm.elements.bio.value = creator.bio || "";
  creatorImageUrl.value = creator.imageUrl || "";
  creatorForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearCreatorForm() {
  creatorForm.reset();
  creatorForm.elements.creatorId.value = "";
}

async function saveCreator(event) {
  event.preventDefault();
  const originalLabel = creatorSaveBtn.textContent;
  creatorSaveBtn.disabled = true;
  creatorSaveBtn.textContent = "Saving Creator...";
  setMessage(creatorMessage, "Saving creator...");

  const creatorId = creatorForm.elements.creatorId.value.trim();
  const name = creatorForm.elements.name.value.trim();
  const bio = creatorForm.elements.bio.value.trim();
  const file = creatorImageFile.files[0];

  if (!name) {
    setMessage(creatorMessage, "Creator name is required.", true);
    creatorSaveBtn.disabled = false;
    creatorSaveBtn.textContent = originalLabel;
    return;
  }

  try {
    const creatorsCol = collection(db, "creators");
    const isUpdate = Boolean(creatorId);
    const targetDoc = isUpdate ? doc(db, "creators", creatorId) : doc(creatorsCol);
    let imageUrl = creatorImageUrl.value.trim();

    if (file) {
      imageUrl = await uploadCreatorImage(targetDoc.id, file);
    }

    const payload = {
      name,
      bio,
      imageUrl,
      updatedAt: serverTimestamp()
    };

    if (!isUpdate) {
      payload.createdAt = serverTimestamp();
    }

    await setDoc(targetDoc, payload, { merge: isUpdate });
    setMessage(creatorMessage, isUpdate ? "Creator updated." : "Creator saved.");
    clearCreatorForm();
  } catch (error) {
    console.error("saveCreator failed", error);
    const code = error?.code || "";
    if (code === "permission-denied") {
      setMessage(
        creatorMessage,
        "Permission denied. Publish Firestore rules for creators + siteConfig (see firestore.rules).",
        true
      );
    } else {
      setMessage(creatorMessage, error.message || "Could not save creator.", true);
    }
  } finally {
    creatorSaveBtn.disabled = false;
    creatorSaveBtn.textContent = originalLabel;
  }
}

function renderProducts() {
  if (!productsCache.length) {
    productsList.innerHTML = "<p class='muted'>No products yet. Add your first listing above.</p>";
    return;
  }

  productsList.innerHTML = productsCache
    .map(
      (product) => `
        <article class="admin-product">
          <img src="${product.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}" alt="${product.name}">
          <div>
            <h4>${product.name}</h4>
            <p class="muted">${categoryLabels[product.category] || product.category}</p>
            <p>${product.description || ""}</p>
            <p><strong>$${Number(product.price).toFixed(2)}</strong></p>
            <div class="product-actions">
              <button class="button secondary edit-btn" data-id="${product.id}">Edit</button>
              <button class="button danger delete-btn" data-id="${product.id}">Delete</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

function fillProductForm(product) {
  productForm.elements.productId.value = product.id;
  productForm.elements.name.value = product.name || "";
  productForm.elements.price.value = product.price || "";
  productForm.elements.categoryId.value = product.category || "";
  productForm.elements.creatorId.value = product.creatorId || "";
  productForm.elements.description.value = product.description || "";
  imageUrlInput.value = product.imageUrl || "";
  productForm.elements.featured.checked = Boolean(product.featured);
  productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearProductForm() {
  productForm.reset();
  productForm.elements.productId.value = "";
}

async function saveProduct(event) {
  event.preventDefault();
  setMessage(productMessage, "Saving product...");

  const productId = productForm.elements.productId.value.trim();
  const name = productForm.elements.name.value.trim();
  const price = Number(productForm.elements.price.value);
  const category = productForm.elements.categoryId.value;
  const creatorId = productForm.elements.creatorId.value;
  const description = productForm.elements.description.value.trim();
  const featured = productForm.elements.featured.checked;
  const file = imageFileInput.files[0];

  if (!name || !category || Number.isNaN(price)) {
    setMessage(productMessage, "Name, price, and category are required.", true);
    return;
  }

  if (!creatorId) {
    setMessage(productMessage, "Choose a Seller / Creator first (save one above).", true);
    return;
  }

  try {
    const productsCol = collection(db, "products");
    const isUpdate = Boolean(productId);
    const targetDoc = isUpdate ? doc(db, "products", productId) : doc(productsCol);
    let imageUrl = imageUrlInput.value.trim();

    if (file) {
      imageUrl = await uploadProductImage(targetDoc.id, file);
    }

    const basePayload = {
      name,
      price,
      category,
      creatorId,
      description,
      imageUrl,
      featured: Boolean(featured)
    };

    const payload = isUpdate
      ? {
          ...basePayload,
          updatedAt: serverTimestamp()
        }
      : {
          ...basePayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

    await setDoc(targetDoc, payload, { merge: isUpdate });
    setMessage(productMessage, isUpdate ? "Product updated." : "Product created.");

    clearProductForm();
  } catch (error) {
    console.error("saveProduct failed", error);
    setMessage(productMessage, "Could not save product. Check Firebase config and rules.", true);
  }
}

async function savePromo(event) {
  event.preventDefault();
  setMessage(promoMessage, "Saving promo...");

  const title = promoForm.elements.title.value.trim();
  const message = promoForm.elements.message.value.trim();
  const buttonLabel = promoForm.elements.buttonLabel.value.trim();
  const buttonUrl = promoForm.elements.buttonUrl.value.trim();

  try {
    await setDoc(doc(db, "siteConfig", "homepage"), {
      promoTitle: title,
      promoMessage: message,
      promoButtonText: buttonLabel,
      promoButtonLink: buttonUrl,
      updatedAt: serverTimestamp()
    });
    setMessage(promoMessage, "Promo panel saved.");
  } catch (error) {
    console.error("savePromo failed", error);
    setMessage(promoMessage, "Could not save promo.", true);
  }
}

async function loadPromoForForm() {
  try {
    const promoRef = doc(db, "siteConfig", "homepage");
    const snap = await getDoc(promoRef);
    if (!snap.exists()) {
      return;
    }
    const data = snap.data();
    promoForm.elements.title.value = data.promoTitle || "";
    promoForm.elements.message.value = data.promoMessage || "";
    promoForm.elements.buttonLabel.value = data.promoButtonText || "";
    promoForm.elements.buttonUrl.value = data.promoButtonLink || "";
  } catch (error) {
    console.error("loadPromoForForm failed", error);
  }
}

function bindAdminEvents() {
  creatorForm.addEventListener("submit", saveCreator);
  creatorsList.addEventListener("click", (event) => {
    const editBtn = event.target.closest(".edit-creator-btn");
    if (!editBtn) {
      return;
    }
    const target = creatorsCache.find((item) => item.id === editBtn.dataset.id);
    if (target) {
      fillCreatorForm(target);
    }
  });

  productForm.addEventListener("submit", saveProduct);
  promoForm.addEventListener("submit", savePromo);
  signOutButton.addEventListener("click", () => signOut(auth));
  document.getElementById("clear-product-form").addEventListener("click", clearProductForm);

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
      } catch (error) {
        console.error("delete product failed", error);
        setMessage(productMessage, "Could not delete product.", true);
      }
    }
  });
}

function bindAuthEvents() {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = registerForm.elements.email.value.trim();
    const password = registerForm.elements.password.value;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage(authMessage, "Admin account created. You are now signed in.");
      registerForm.reset();
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
      setMessage(authMessage, "Signed in.");
      loginForm.reset();
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
  bindAuthEvents();
  bindAdminEvents();

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      authPanel.classList.remove("hidden");
      adminPanel.classList.add("hidden");
      userLabel.textContent = "";
      return;
    }

    userLabel.textContent = user.email;
    authPanel.classList.add("hidden");
    adminPanel.classList.remove("hidden");

    onSnapshot(
      collection(db, "creators"),
      (snapshot) => {
        creatorsCache = snapshot.docs
          .map((snap) => ({
            id: snap.id,
            ...snap.data()
          }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        renderCreators();
      },
      (error) => {
        console.error("creators onSnapshot failed", error);
        setMessage(
          creatorMessage,
          "Could not load creators. Add Firestore index or check rules for creators collection.",
          true
        );
      }
    );

    const productsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"));
    onSnapshot(
      productsQuery,
      (snapshot) => {
        productsCache = snapshot.docs.map((snap) => ({
          id: snap.id,
          ...snap.data()
        }));
        renderProducts();
      },
      (error) => {
        console.error("products onSnapshot failed", error);
        setMessage(productMessage, "Could not load products from Firestore.", true);
      }
    );

    await loadPromoForForm();
  });
}
