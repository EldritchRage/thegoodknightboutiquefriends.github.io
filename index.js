import { db, isFirebaseReady } from "./firebase-client.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const promoSection = document.getElementById("promo-section");
const promoTitle = document.getElementById("promo-title");
const promoText = document.getElementById("promo-text");
const promoButton = document.getElementById("promo-button");

async function loadPromo() {
  if (!isFirebaseReady) {
    promoTitle.textContent = "Seasonal Spotlight";
    promoText.textContent = "Connect Firebase to edit this panel from the admin dashboard.";
    promoButton.classList.add("hidden");
    return;
  }

  try {
    const promoRef = doc(db, "siteContent", "homepagePromo");
    const snap = await getDoc(promoRef);

    if (!snap.exists()) {
      promoTitle.textContent = "Seasonal Spotlight";
      promoText.textContent = "No promo has been published yet.";
      promoButton.classList.add("hidden");
      return;
    }

    const data = snap.data();
    promoTitle.textContent = data.title || "Seasonal Spotlight";
    promoText.textContent = data.message || "Check back for new offers.";

    if (data.buttonLabel && data.buttonUrl) {
      promoButton.textContent = data.buttonLabel;
      promoButton.href = data.buttonUrl;
      promoButton.classList.remove("hidden");
    } else {
      promoButton.classList.add("hidden");
    }
  } catch (error) {
    promoTitle.textContent = "Seasonal Spotlight";
    promoText.textContent = "Promo panel could not load right now.";
    promoButton.classList.add("hidden");
    console.error(error);
  }
}

promoSection.classList.remove("hidden");
loadPromo();
