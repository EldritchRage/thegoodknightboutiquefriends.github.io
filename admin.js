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

let productsCache = [];

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

async function uploadImageIfNeeded(file) {
  if (!file) {
    return "";
  }
  const cleanName = file.name.replace(/\s+/g, "-").toLowerCase();
  const imageRef = ref(storage, `product-images/${Date.now()}-${cleanName}`);
  await uploadBytes(imageRef, file);
  return getDownloadURL(imageRef);
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
            <p class="muted">${categoryLabels[product.categoryId] || product.categoryId}</p>
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

async function refreshProducts() {
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snaps = await getDocs(q);
  productsCache = snaps.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
  renderProducts();
}

function fillProductForm(product) {
  productForm.elements.productId.value = product.id;
  productForm.elements.name.value = product.name || "";
  productForm.elements.price.value = product.price || "";
  productForm.elements.categoryId.value = product.categoryId || "";
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
  const categoryId = productForm.elements.categoryId.value;
  const description = productForm.elements.description.value.trim();
  const featured = productForm.elements.featured.checked;
  const file = imageFileInput.files[0];

  if (!name || !categoryId || Number.isNaN(price)) {
    setMessage(productMessage, "Name, price, and category are required.", true);
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
  event.preventDefault();
  setMessage(promoMessage, "Saving promo...");

  const title = promoForm.elements.title.value.trim();
  const message = promoForm.elements.message.value.trim();
  const buttonLabel = promoForm.elements.buttonLabel.value.trim();
  const buttonUrl = promoForm.elements.buttonUrl.value.trim();

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

function bindAdminEvents() {
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
        await refreshProducts();
      } catch (error) {
        console.error(error);
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
    await refreshProducts();
  });
}
