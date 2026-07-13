# P.S. It's A Vibe Homepage - Admin Integration Guide

## Overview
The homepage is now fully driven by Firebase/Firestore, allowing the Android admin app to manage all content without requiring code changes or website redeployment.

## What the Admin App Should Manage

### 1. Hero Section
**Firestore Path:** `homepage/config` → `hero`

**Editable Fields:**
- **Hero Image** - Upload to Firebase Storage, save URL in `hero.image`
- **Headline** - Main heading text (e.g., "Discover Your Vibe")
- **Subheading** - Descriptive text below headline
- **Button Text** - CTA button label (e.g., "Shop Now")
- **Button Link** - URL the button directs to (e.g., "/shop.html")

**Admin App UI:**
- Image picker with Firebase Storage upload
- Text input for headline
- Text input for subheading
- Text input for button text
- URL input for button link
- Save button (updates `homepage/config`)

---

### 2. Promo Banners
**Firestore Path:** `homepage/config/promotions` (Collection)

**Editable Fields per Promo:**
- **Title** - Promo name/title
- **Description** - Detailed promotion text
- **Image** - Promo banner image (Firebase Storage URL)
- **Button Text** - CTA button label
- **Button Link** - URL the button directs to
- **Enabled** - Toggle to show/hide the promo
- **Start Date** - When the promo becomes visible (optional)
- **End Date** - When the promo stops showing (optional)
- **Display Order** - Numeric order for carousel rotation

**Admin App Features:**
- **Add Promo**: Button to create new promotion document
- **Edit Promo**: Edit any existing promo's fields
- **Delete Promo**: Remove a promo (delete document)
- **Enable/Disable Toggle**: Quick toggle for `enabled` field
- **Date Picker**: Calendar UI for start/end dates
- **Image Upload**: Upload new image to Firebase Storage
- **Drag-to-Reorder**: Drag list items to reorder and update `displayOrder`
- **Save**: Stores changes to Firestore

**Scheduling Logic (Automatic in Website):**
- If `startDate` is in the future → Promo won't show until that date
- If `endDate` is in the past → Promo won't show
- If both dates are null/empty → No date restrictions
- Promos with `enabled: false` never show

**Example Document:**
```json
{
  "id": "promo-1",
  "title": "Summer Sale",
  "description": "Up to 50% off this summer",
  "image": "gs://bucket/promo-summer.jpg",
  "buttonText": "Shop Sale",
  "buttonLink": "/shop.html?filter=sale",
  "enabled": true,
  "startDate": "2025-06-01",
  "endDate": "2025-08-31",
  "displayOrder": 1
}
```

---

### 3. Featured Products
**Firestore Path:** `homepage/config/featured_products` (Collection)

**Editable Fields:**
- **Product ID** - Reference to product in `products` collection
- **Display Order** - Order in carousel (1, 2, 3, etc.)

**Admin App Features:**
- **Search Products**: Search by product name/ID
- **Add to Featured**: Select products to add to carousel
- **Remove from Featured**: Remove products from carousel
- **Drag-to-Reorder**: Reorder carousel items by dragging
- **Limit**: Show max 8-10 products for performance

**Example Documents:**
```json
// featured_products/auto-id-1
{
  "productId": "prod-123",
  "displayOrder": 1
}

// featured_products/auto-id-2
{
  "productId": "prod-456",
  "displayOrder": 2
}
```

**Notes:**
- The website fetches actual product data from the `products` collection
- Only products that exist in `products/{productId}` will display
- If a featured product is deleted, it won't crash—it just won't show

---

### 4. Categories
**Firestore Path:** `homepage/config/categories` (Collection)

**Editable Fields per Category:**
- **Category ID** - Unique identifier (e.g., "fun-t-shirts")
- **Name** - Display name (e.g., "Fun T Shirts")
- **Image** - Category thumbnail image (Firebase Storage URL)
- **Enabled** - Toggle to show/hide category
- **Display Order** - Order in the grid

**Admin App Features:**
- **Show All Categories**: List all available categories
- **Enable/Disable**: Toggle visibility for each category
- **Image Upload**: Upload/update category image
- **Drag-to-Reorder**: Drag to change `displayOrder`
- **Save**: Updates Firestore

**Example Document:**
```json
{
  "id": "fun-t-shirts",
  "name": "Fun T Shirts",
  "image": "gs://bucket/categories/t-shirts.jpg",
  "enabled": true,
  "displayOrder": 1
}
```

---

### 5. About Section
**Firestore Path:** `homepage/config` → `about`

**Editable Fields:**
- **About Text** - Main description (long text)
- **About Image** - Supporting image (optional, Firebase Storage URL)

**Admin App UI:**
- Large text area for about description
- Image picker with upload capability
- Save button (updates `homepage/config`)

**Example:**
```json
{
  "text": "P.S. It's A Vibe is a curated collection of high-quality products...",
  "image": "gs://bucket/about-section.jpg"
}
```

---

## Firebase Storage Organization

Recommended folder structure for uploaded images:

```
gs://good-knight-boutique.appspot.com/
├── homepage/
│   ├── hero-banner.jpg          (Hero section image)
│   ├── about-section.jpg        (About section image)
│   ├── promo-summer.jpg         (Promo image)
│   ├── promo-new.jpg           (Promo image)
│   └── categories/              (Category images)
│       ├── fun-t-shirts.jpg
│       ├── cups.jpg
│       └── handmade-jewelry.jpg
```

---

## Admin App Implementation Checklist

### UI Components Needed

- [ ] **Hero Section Editor Screen**
  - [ ] Image upload field
  - [ ] Text inputs for headline, subheading, button text, button link
  - [ ] Save button

- [ ] **Promo Manager Screen**
  - [ ] List of all promotions
  - [ ] Add Promo button → Form with all fields
  - [ ] Edit Promo → Opens promo details in form
  - [ ] Delete Promo → Confirmation dialog then delete
  - [ ] Enable/Disable toggle for each promo
  - [ ] Image upload
  - [ ] Date picker for start/end dates
  - [ ] Drag-to-reorder functionality
  - [ ] Save button

- [ ] **Featured Products Screen**
  - [ ] Current featured products list with drag-to-reorder
  - [ ] Add Products button → Product search/selection
  - [ ] Remove from featured button for each item
  - [ ] Save button

- [ ] **Categories Screen**
  - [ ] List all categories
  - [ ] Enable/Disable toggle for each
  - [ ] Image upload/update
  - [ ] Drag-to-reorder
  - [ ] Save button

- [ ] **About Section Screen**
  - [ ] Text area for about text
  - [ ] Image upload field
  - [ ] Save button

---

## Firestore Operations in Admin App

### Read Operations
```javascript
// Get hero and about config
const configDoc = await db.collection('homepage').doc('config').get();
const heroData = configDoc.data().hero;
const aboutData = configDoc.data().about;

// Get all promotions
const promoSnapshots = await db.collection('homepage').doc('config')
  .collection('promotions')
  .orderBy('displayOrder', 'asc')
  .get();

// Get featured products
const featuredSnapshots = await db.collection('homepage').doc('config')
  .collection('featured_products')
  .orderBy('displayOrder', 'asc')
  .get();

// Get all categories
const categorySnapshots = await db.collection('homepage').doc('config')
  .collection('categories')
  .orderBy('displayOrder', 'asc')
  .get();
```

### Write Operations
```javascript
// Update hero/about
await db.collection('homepage').doc('config').update({
  'hero.headline': newHeadline,
  'hero.image': imageUrl,
  // ... other fields
});

// Add/Update promo
await db.collection('homepage').doc('config')
  .collection('promotions')
  .doc(promoId)
  .set(promoData, { merge: true });

// Delete promo
await db.collection('homepage').doc('config')
  .collection('promotions')
  .doc(promoId)
  .delete();

// Update display order (batch update)
const batch = db.batch();
updates.forEach(update => {
  batch.update(
    db.collection('homepage').doc('config').collection('promotions').doc(update.id),
    { displayOrder: update.order }
  );
});
await batch.commit();
```

---

## Firebase Storage Upload in Admin App

```javascript
// Upload image to Firebase Storage
const file = selectedFile;
const storageRef = firebase.storage().ref(`homepage/${file.name}`);
const uploadTask = storageRef.put(file);

uploadTask.on(
  'state_changed',
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload progress:', progress);
  },
  (error) => {
    console.error('Upload failed:', error);
  },
  async () => {
    const downloadUrl = await storageRef.getDownloadURL();
    // Use downloadUrl in Firestore document
    console.log('Image URL:', downloadUrl);
  }
);
```

---

## Security Rules (Firestore)

Add to `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access to homepage
    match /homepage/{document=**} {
      allow read;
      // Only authenticated admins can write
      allow write: if request.auth.uid != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
  }
}
```

Ensure your `users` collection has a `role` field with value "admin" for admin users.

---

## Real-time Updates

The website listens for real-time changes to `homepage/config` and its subcollections. Changes made in the admin app are automatically reflected on the website without:
- Page refresh
- Server restart
- Code redeployment
- Build process

The website rerenders within milliseconds of the Firestore update.

---

## Testing the Integration

### Manual Testing Steps:
1. Open the homepage in a browser
2. Open the admin app and make a change (e.g., update hero headline)
3. Observe the website update in real-time
4. Try adding/removing promotions
5. Verify date scheduling (set end date to past = promo disappears)
6. Reorder featured products and verify carousel order

### Sample Test Cases:
- [ ] Update hero headline → Headline changes on homepage
- [ ] Add new promo with enabled=true → Promo appears in carousel
- [ ] Add new promo with enabled=false → Promo doesn't appear
- [ ] Set promo end date to past → Promo disappears
- [ ] Add/remove featured products → Carousel updates
- [ ] Reorder categories → Category grid reorders
- [ ] Update about text → About section updates

---

## Troubleshooting

### Admin app changes not showing on website?
1. Check browser console for JavaScript errors
2. Verify Firestore read permissions
3. Check that documents exist in Firestore
4. Look at Network tab to see if Firestore queries complete
5. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Images not loading?
1. Verify Firebase Storage URLs are correct
2. Check Storage security rules allow public read
3. Ensure images are uploaded successfully
4. Check image URLs in Firestore documents

### Promotions not rotating?
1. Verify multiple promos have `enabled: true`
2. Check `displayOrder` is set correctly
3. Check date scheduling (if applicable)
4. Look at browser console for JavaScript errors

---

## Quick Reference

| Feature | Firestore Path | Collection | Document Fields |
|---------|----------------|-----------|-----------------|
| Hero Section | `homepage/config` | Document | `hero.{image, headline, subheading, buttonText, buttonLink}` |
| About Section | `homepage/config` | Document | `about.{text, image}` |
| Promotions | `homepage/config/promotions` | Collection | `{id, title, description, image, buttonText, buttonLink, enabled, startDate, endDate, displayOrder}` |
| Featured Products | `homepage/config/featured_products` | Collection | `{productId, displayOrder}` |
| Categories | `homepage/config/categories` | Collection | `{id, name, image, enabled, displayOrder}` |

---

## Support

For questions about the homepage Firestore structure, see `HOMEPAGE_FIRESTORE_SETUP.md`.

For website code, see `index.html`, `index.js`, and `styles.css`.
