# P.S. It's A Vibe Homepage - Firestore Setup Guide

## Overview
This document describes the Firestore structure for managing all homepage content. The Android admin app reads and writes to these collections to dynamically update the homepage without requiring code changes or redeployment.

## Firestore Collections Structure

### 1. `homepage/config` (Document)
**Purpose:** Stores hero section and about section configuration.

**Document Path:** `homepage/config`

**Fields:**
```json
{
  "hero": {
    "image": "gs://bucket/images/hero-banner.jpg",
    "headline": "Discover Your Vibe",
    "subheading": "Shop unique collections and express yourself",
    "buttonText": "Shop Now",
    "buttonLink": "/shop.html"
  },
  "about": {
    "text": "P.S. It's A Vibe is a curated collection of high-quality products that match your unique style and personality. From fashion to lifestyle, we bring together the best in contemporary design.",
    "image": "gs://bucket/images/about-section.jpg"
  }
}
```

### 2. `homepage/config/promotions` (Subcollection)
**Purpose:** Stores active and inactive promotion banners with scheduling.

**Collection Path:** `homepage/config/promotions`

**Document Structure (Example - `promo-1`):**
```json
{
  "id": "promo-1",
  "title": "Summer Sale",
  "description": "Up to 50% off select items",
  "image": "gs://bucket/images/promo-summer.jpg",
  "buttonText": "Shop Sale",
  "buttonLink": "/shop.html?category=sale",
  "enabled": true,
  "startDate": "2025-06-01",
  "endDate": "2025-08-31",
  "displayOrder": 1,
  "createdAt": "2025-05-15T10:30:00Z",
  "updatedAt": "2025-05-15T10:30:00Z"
}
```

**Fields:**
- `id` (string): Unique identifier for this promo
- `title` (string): Display title
- `description` (string): Promo description/details
- `image` (string): Firebase Storage URL for promo image
- `buttonText` (string): Call-to-action button text
- `buttonLink` (string): URL the button links to
- `enabled` (boolean): Whether this promo is active
- `startDate` (string): ISO 8601 date (e.g., "2025-06-01"). Null/empty = no start date
- `endDate` (string): ISO 8601 date (e.g., "2025-08-31"). Null/empty = no end date
- `displayOrder` (number): Sort order for display
- `createdAt` (timestamp): When this promo was created
- `updatedAt` (timestamp): When this promo was last modified

**Notes:**
- Only promos with `enabled: true` are shown
- Scheduling works with optional `startDate` and `endDate`
- If a promo has a `startDate` in the future, it won't display until that date
- If a promo has an `endDate` in the past, it won't display
- Promos are rotated automatically every 5 seconds
- If only one promo exists, no rotation happens

### 3. `homepage/config/featured_products` (Subcollection)
**Purpose:** Stores references to products featured on the homepage.

**Collection Path:** `homepage/config/featured_products`

**Document Structure (Example - `featured-1`):**
```json
{
  "productId": "prod-123",
  "displayOrder": 1,
  "createdAt": "2025-05-15T10:30:00Z"
}
```

**Fields:**
- `productId` (string): Reference to a product document in the `products` collection
- `displayOrder` (number): Order of appearance in carousel (ascending)
- `createdAt` (timestamp): When this was added

**Notes:**
- The actual product data is fetched from `products/{productId}`
- Products are sorted by `displayOrder` in ascending order
- Up to 10 products recommended for performance

### 4. `homepage/config/categories` (Subcollection)
**Purpose:** Stores category display configuration for the categories section.

**Collection Path:** `homepage/config/categories`

**Document Structure (Example - `cat-wearables`):**
```json
{
  "id": "cat-wearables",
  "name": "Wearables",
  "image": "gs://bucket/images/cat-wearables.jpg",
  "enabled": true,
  "displayOrder": 1,
  "createdAt": "2025-05-15T10:30:00Z",
  "updatedAt": "2025-05-15T10:30:00Z"
}
```

**Fields:**
- `id` (string): Unique category identifier (matches product categories)
- `name` (string): Display name for the category
- `image` (string): Firebase Storage URL for category image
- `enabled` (boolean): Whether to show this category
- `displayOrder` (number): Sort order (ascending)
- `createdAt` (timestamp): When created
- `updatedAt` (timestamp): When last modified

**Notes:**
- Only categories with `enabled: true` are displayed
- Must match existing product categories in your system

## Sample Firestore Data Setup

### Initialize Hero & About
```javascript
// In Firebase Console or Cloud Functions
const heroConfig = {
  hero: {
    image: "gs://good-knight-boutique.appspot.com/homepage/hero-banner.jpg",
    headline: "Discover Your Vibe",
    subheading: "Shop unique collections and express yourself",
    buttonText: "Shop Now",
    buttonLink: "/shop.html"
  },
  about: {
    text: "P.S. It's A Vibe is your destination for curated, high-quality products that match your unique style and personality. From fashion to lifestyle, we bring together the best in contemporary design.",
    image: "gs://good-knight-boutique.appspot.com/homepage/about-section.jpg"
  }
};

db.collection("homepage").doc("config").set(heroConfig, { merge: true });
```

### Add Sample Promotions
```javascript
const promotions = [
  {
    id: "promo-summer",
    title: "Summer Sale",
    description: "Up to 50% off select summer collection items",
    image: "gs://good-knight-boutique.appspot.com/homepage/promo-summer.jpg",
    buttonText: "Shop Sale",
    buttonLink: "/shop.html?filter=summer-sale",
    enabled: true,
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    displayOrder: 1
  },
  {
    id: "promo-new",
    title: "New Arrivals",
    description: "Check out our latest collection",
    image: "gs://good-knight-boutique.appspot.com/homepage/promo-new.jpg",
    buttonText: "Explore New",
    buttonLink: "/shop.html?sort=newest",
    enabled: true,
    startDate: null,
    endDate: null,
    displayOrder: 2
  }
];

promotions.forEach(promo => {
  db.collection("homepage").doc("config").collection("promotions").doc(promo.id).set(promo);
});
```

### Add Featured Products
```javascript
const featured = [
  { productId: "prod-123", displayOrder: 1 },
  { productId: "prod-456", displayOrder: 2 },
  { productId: "prod-789", displayOrder: 3 }
];

featured.forEach(item => {
  db.collection("homepage").doc("config").collection("featured_products").add(item);
});
```

### Add Categories
```javascript
const categories = [
  {
    id: "fun-t-shirts",
    name: "Fun T Shirts",
    image: "gs://good-knight-boutique.appspot.com/categories/t-shirts.jpg",
    enabled: true,
    displayOrder: 1
  },
  {
    id: "cups",
    name: "Cups & Drinkware",
    image: "gs://good-knight-boutique.appspot.com/categories/cups.jpg",
    enabled: true,
    displayOrder: 2
  },
  {
    id: "handmade-jewelry",
    name: "Handmade Jewelry",
    image: "gs://good-knight-boutique.appspot.com/categories/jewelry.jpg",
    enabled: true,
    displayOrder: 3
  },
  {
    id: "personal-care",
    name: "Personal Care",
    image: "gs://good-knight-boutique.appspot.com/categories/personal-care.jpg",
    enabled: true,
    displayOrder: 4
  }
];

categories.forEach(cat => {
  db.collection("homepage").doc("config").collection("categories").doc(cat.id).set(cat);
});
```

## Firestore Security Rules

Add these rules to your `firestore.rules` to protect the data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read access to homepage config
    match /homepage/{document=**} {
      allow read;
      allow write: if request.auth.uid != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }

    // ... rest of your rules
  }
}
```

## Android Admin App Integration

The Android admin app should provide:

### Hero Section Editor
- **Input fields:**
  - Hero image (upload to Firebase Storage)
  - Headline (text)
  - Subheading (text)
  - Button text (text)
  - Button link (URL)
- **Action:** Updates `homepage/config` document

### Promo Manager
- **Features:**
  - Add new promo
  - Edit existing promo
  - Delete promo
  - Enable/disable toggle
  - Upload promo image
  - Set start/end dates with date picker
  - Drag-to-reorder via `displayOrder`
- **Actions:** Create/update/delete in `homepage/config/promotions`

### Featured Products Manager
- **Features:**
  - Search and add products
  - Drag-to-reorder carousel items
  - Remove from featured
- **Actions:** Add/remove/reorder in `homepage/config/featured_products`

### Categories Manager
- **Features:**
  - Show all available categories
  - Enable/disable toggle
  - Upload category image
  - Drag-to-reorder
- **Actions:** Create/update in `homepage/config/categories`

### About Section Editor
- **Input fields:**
  - About text (long text/textarea)
  - About image (optional, upload to Firebase Storage)
- **Action:** Updates `homepage/config` document

## Image Storage

Store all homepage images in Firebase Storage at:
```
gs://good-knight-boutique.appspot.com/homepage/
  ├── hero-banner.jpg
  ├── about-section.jpg
  ├── promo-summer.jpg
  ├── promo-new.jpg
  └── categories/
      ├── t-shirts.jpg
      ├── cups.jpg
      └── jewelry.jpg
```

## Real-time Updates

The website listens for real-time changes to the `homepage/config` document and its subcollections. When the Android app updates:

1. User makes changes in admin app
2. Changes are written to Firestore
3. Website detects the change via Firestore listener
4. Homepage automatically re-renders with new content
5. No page refresh or redeploy needed

## Troubleshooting

### Promos not showing?
- Check if `enabled: true`
- Verify `startDate` is in the past or empty
- Verify `endDate` is in the future or empty
- Check Firebase Console for document existence

### Featured products not loading?
- Verify `productId` exists in `products` collection
- Check Firebase Storage URLs are accessible
- Look for errors in browser console

### Categories not appearing?
- Check if `enabled: true`
- Verify category `id` exists in your system
- Check category image URLs

### Admin changes not reflecting on website?
- Check browser console for JavaScript errors
- Verify Firestore read permissions
- Clear browser cache
- Check network tab to see if Firestore queries are completing
