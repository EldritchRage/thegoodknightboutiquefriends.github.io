import { db, isFirebaseReady } from "./firebase-client.js";
import { doc, getDoc, collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { normalizeHomepageForRead } from "./homepage-contract.js";
import { normalizeProductForRead } from "./product-contract.js";
import { recordContractEvent } from "./contract-telemetry.js";
import { filterStripeAvailableProducts } from "./stripe-availability.js";

// =============================================================================
// DATA FETCHING
// =============================================================================

async function loadHomepageConfig() {
  try {
    const configRef = doc(db, "homepage", "config");
    const snap = await getDoc(configRef);
    if (!snap.exists()) return null;
    const config = normalizeHomepageForRead(snap.data());
    if (config.contractIssues.length) {
      recordContractEvent("homepage_contract_issue", { schemaVersion: config.schemaVersion, reason: config.contractIssues[0] });
    }
    return config;
  } catch (error) {
    console.error("Failed to load homepage config:", error);
    return null;
  }
}

async function loadActivePromotions() {
  try {
    const now = new Date();
    const promoQuery = query(
      collection(db, "homepage", "config", "promotions"),
      where("enabled", "==", true),
      orderBy("displayOrder", "asc")
    );
    const snap = await getDocs(promoQuery);
    
    return snap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(promo => {
        if (promo.startDate) {
          const start = new Date(promo.startDate);
          if (now < start) return false;
        }
        if (promo.endDate) {
          const end = new Date(promo.endDate);
          if (now > end) return false;
        }
        return true;
      });
  } catch (error) {
    console.error("Failed to load promotions:", error);
    return [];
  }
}

async function loadFeaturedProducts() {
  try {
    // Get featured product references
    const featuredRef = collection(db, "homepage", "config", "featured_products");
    const snap = await getDocs(query(featuredRef, orderBy("displayOrder", "asc")));
    const productIds = snap.docs.map(doc => doc.data().productId);
    
    // Fetch actual products from products collection
    const products = [];
    for (const productId of productIds) {
      const productRef = doc(db, "products", productId);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        products.push(normalizeProductForRead({ id: productId, ...productSnap.data() }));
      }
    }
    return filterStripeAvailableProducts(products);
  } catch (error) {
    console.error("Failed to load featured products:", error);
    return [];
  }
}

async function loadCategories() {
  try {
    const catQuery = query(
      collection(db, "homepage", "config", "categories"),
      where("enabled", "==", true),
      orderBy("displayOrder", "asc")
    );
    const snap = await getDocs(catQuery);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Failed to load categories:", error);
    return [];
  }
}

// =============================================================================
// HERO SECTION
// =============================================================================

async function renderHero() {
  const config = await loadHomepageConfig();
  const heroImage = document.getElementById("hero-image");
  const heroHeadline = document.getElementById("hero-headline");
  const heroSubheading = document.getElementById("hero-subheading");
  const heroButton = document.getElementById("hero-button");

  if (config?.hero) {
    const hero = config.hero;
    if (hero.image) heroImage.src = hero.image;
    if (hero.headline) heroHeadline.textContent = hero.headline;
    if (hero.subheading) heroSubheading.textContent = hero.subheading;
    if (hero.buttonText) heroButton.textContent = hero.buttonText;
    if (hero.buttonLink) heroButton.href = hero.buttonLink;
  }
}

// =============================================================================
// PROMO SECTION
// =============================================================================

let currentPromoIndex = 0;
let promos = [];

async function renderPromos() {
  promos = await loadActivePromotions();
  
  if (promos.length === 0) {
    document.getElementById("promo-section").classList.add("hidden");
    return;
  }

  document.getElementById("promo-section").classList.remove("hidden");
  renderPromoCarousel();
  
  if (promos.length > 1) {
    startPromoRotation();
  }
}

function renderPromoCarousel() {
  const carousel = document.getElementById("promo-carousel");
  const indicators = document.getElementById("promo-indicators");
  
  carousel.innerHTML = promos.map((promo, idx) => `
    <div class="promo-item ${idx === currentPromoIndex ? 'active' : ''}" data-index="${idx}">
      ${promo.image ? `<img src="${promo.image}" alt="${promo.title}" class="promo-image">` : ''}
      <div class="promo-content">
        <h3>${promo.title || ''}</h3>
        <p>${promo.description || ''}</p>
        ${promo.buttonText ? `<a href="${promo.buttonLink || '#'}" class="button button-promo">${promo.buttonText}</a>` : ''}
      </div>
    </div>
  `).join('');

  indicators.innerHTML = promos.map((_, idx) => `
    <button class="promo-dot ${idx === currentPromoIndex ? 'active' : ''}" data-index="${idx}" aria-label="Go to promo ${idx + 1}"></button>
  `).join('');

  indicators.querySelectorAll('.promo-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
      currentPromoIndex = parseInt(e.target.dataset.index);
      renderPromoCarousel();
      resetPromoRotation();
    });
  });
}

function startPromoRotation() {
  setInterval(() => {
    currentPromoIndex = (currentPromoIndex + 1) % promos.length;
    renderPromoCarousel();
  }, 5000);
}

function resetPromoRotation() {
  // Clear existing interval if needed - for simplicity, just update on click
  currentPromoIndex = currentPromoIndex;
}

// =============================================================================
// FEATURED PRODUCTS CAROUSEL
// =============================================================================

let scrollPosition = 0;

async function renderFeaturedProducts() {
  const products = await loadFeaturedProducts();
  const carousel = document.getElementById("featured-carousel");

  if (products.length === 0) {
    carousel.innerHTML = '<p class="muted">No featured products yet.</p>';
    return;
  }

  carousel.innerHTML = products.map(product => `
    <article class="featured-product-card">
      <div class="featured-product-image">
        <img src="${product.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'}" 
             alt="${product.name}" loading="lazy">
      </div>
      <h4>${product.name}</h4>
      <p class="price">${formatPrice(product.price)}</p>
      <a href="shop.html" class="button button-small">View</a>
    </article>
  `).join('');

  // Carousel navigation
  document.getElementById("carousel-prev").addEventListener("click", () => {
    carousel.scrollBy({ left: -320, behavior: "smooth" });
  });

  document.getElementById("carousel-next").addEventListener("click", () => {
    carousel.scrollBy({ left: 320, behavior: "smooth" });
  });
}

// =============================================================================
// CATEGORIES SECTION
// =============================================================================

async function renderCategories() {
  const categories = await loadCategories();
  const grid = document.getElementById("categories-grid");

  if (categories.length === 0) {
    grid.innerHTML = '<p class="muted">No categories available.</p>';
    return;
  }

  grid.innerHTML = categories.map(cat => `
    <a href="shop.html?category=${encodeURIComponent(cat.id)}" class="category-card">
      ${cat.image ? `<img src="${cat.image}" alt="${cat.name}" class="category-image">` : ''}
      <h3>${cat.name}</h3>
    </a>
  `).join('');
}

// =============================================================================
// ABOUT SECTION
// =============================================================================

async function renderAbout() {
  const config = await loadHomepageConfig();
  
  if (config?.about) {
    const about = config.about;
    const textEl = document.getElementById("about-text");
    const imageWrap = document.getElementById("about-image-wrap");
    const imageEl = document.getElementById("about-image");

    if (about.text) textEl.textContent = about.text;
    
    if (about.image) {
      imageEl.src = about.image;
      imageWrap.classList.remove("hidden");
    } else {
      imageWrap.classList.add("hidden");
    }
  }
}

// =============================================================================
// UTILITIES
// =============================================================================

function formatPrice(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

// =============================================================================
// INITIALIZATION
// =============================================================================

async function initializeHomepage() {
  if (!isFirebaseReady) {
    console.warn("Firebase not configured. Using fallback content.");
    return;
  }

  try {
    await Promise.all([
      renderHero(),
      renderPromos(),
      renderFeaturedProducts(),
      renderCategories(),
      renderAbout()
    ]);
  } catch (error) {
    console.error("Error initializing homepage:", error);
  }
}

document.addEventListener("DOMContentLoaded", initializeHomepage);
