/**
 * HOMEPAGE FIRESTORE INITIALIZATION SCRIPT
 * 
 * This script initializes the homepage Firestore structure with sample data.
 * Run this once to set up the initial data structure.
 * 
 * Usage:
 * 1. Open Firebase Console → Firestore Database
 * 2. Copy and paste this script into the browser console
 * 3. Or use it in a Cloud Function for initial setup
 */

import { db } from "./firebase-client.js";
import { collection, doc, setDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

async function initializeHomepageData() {
  try {
    console.log("🚀 Initializing Homepage Firestore Data...");

    // 1. Initialize Hero & About Section
    console.log("📝 Setting up hero and about sections...");
    await setDoc(doc(db, "homepage", "config"), {
      hero: {
        image: "https://via.placeholder.com/1400x600?text=Hero+Banner",
        headline: "Discover Your Vibe",
        subheading: "Shop unique collections and express yourself",
        buttonText: "Shop Now",
        buttonLink: "/shop.html"
      },
      about: {
        text: "P.S. It's A Vibe is your destination for curated, high-quality products that match your unique style and personality. From fashion to lifestyle, we bring together the best in contemporary design. Express yourself with collections that celebrate individuality and creativity.",
        image: "https://via.placeholder.com/500x400?text=About+Section"
      }
    }, { merge: true });
    console.log("✅ Hero and About sections created");

    // 2. Initialize Sample Promotions
    console.log("🎯 Setting up promotions...");
    const promotionRef = collection(db, "homepage", "config", "promotions");
    
    const promotions = [
      {
        id: "promo-summer",
        title: "Summer Sale",
        description: "Up to 50% off select summer collection items. Limited time only!",
        image: "https://via.placeholder.com/800x400?text=Summer+Sale",
        buttonText: "Shop Sale",
        buttonLink: "/shop.html?category=summer",
        enabled: true,
        startDate: "2025-06-01",
        endDate: "2025-08-31",
        displayOrder: 1
      },
      {
        id: "promo-new",
        title: "New Arrivals",
        description: "Check out our latest collection of handpicked items",
        image: "https://via.placeholder.com/800x400?text=New+Arrivals",
        buttonText: "Explore New",
        buttonLink: "/shop.html?sort=newest",
        enabled: true,
        startDate: null,
        endDate: null,
        displayOrder: 2
      }
    ];

    for (const promo of promotions) {
      await setDoc(doc(promotionRef, promo.id), promo);
    }
    console.log("✅ Promotions created");

    // 3. Initialize Featured Products
    console.log("🌟 Setting up featured products...");
    const featuredRef = collection(db, "homepage", "config", "featured_products");
    
    // Note: These should reference actual product IDs from your products collection
    const featured = [
      { productId: "sample-1", displayOrder: 1 },
      { productId: "sample-2", displayOrder: 2 },
      { productId: "sample-3", displayOrder: 3 }
    ];

    for (const item of featured) {
      await addDoc(featuredRef, item);
    }
    console.log("✅ Featured products set up (using sample IDs)");
    console.log("⚠️  Remember to replace sample product IDs with actual product IDs from your system");

    // 4. Initialize Categories
    console.log("📂 Setting up categories...");
    const categoriesRef = collection(db, "homepage", "config", "categories");
    
    const categories = [
      {
        id: "fun-t-shirts",
        name: "Fun T Shirts",
        image: "https://via.placeholder.com/300x300?text=T+Shirts",
        enabled: true,
        displayOrder: 1
      },
      {
        id: "cups",
        name: "Cups & Drinkware",
        image: "https://via.placeholder.com/300x300?text=Cups",
        enabled: true,
        displayOrder: 2
      },
      {
        id: "freshies",
        name: "Freshies",
        image: "https://via.placeholder.com/300x300?text=Freshies",
        enabled: true,
        displayOrder: 3
      },
      {
        id: "handmade-jewelry",
        name: "Handmade Jewelry",
        image: "https://via.placeholder.com/300x300?text=Jewelry",
        enabled: true,
        displayOrder: 4
      },
      {
        id: "ravewear",
        name: "RaveWear",
        image: "https://via.placeholder.com/300x300?text=RaveWear",
        enabled: true,
        displayOrder: 5
      },
      {
        id: "personal-care",
        name: "Personal Care",
        image: "https://via.placeholder.com/300x300?text=Personal+Care",
        enabled: true,
        displayOrder: 6
      }
    ];

    for (const cat of categories) {
      await setDoc(doc(categoriesRef, cat.id), cat);
    }
    console.log("✅ Categories created");

    console.log("✨ Homepage initialization complete!");
    console.log("\n📚 Next Steps:");
    console.log("1. Upload real images to Firebase Storage");
    console.log("2. Update promotion image URLs");
    console.log("3. Replace sample product IDs with real product IDs");
    console.log("4. Customize hero headline, subheading, and about text");
    console.log("5. Access the admin app to make further changes");

  } catch (error) {
    console.error("❌ Error initializing homepage data:", error);
  }
}

// Export for use in other modules
export { initializeHomepageData };
