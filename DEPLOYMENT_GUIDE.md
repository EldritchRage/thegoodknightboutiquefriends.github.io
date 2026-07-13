# P.S. It's A Vibe Homepage - Deployment & Setup Guide

## Quick Start (5 Minutes)

### Step 1: Verify Firebase Configuration
Ensure `firebase-config.js` has valid Firebase credentials:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 2: Initialize Firestore Structure
Choose one method:

**Method A: Using Firebase Console (Recommended for first-time setup)**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project → Firestore Database
3. Create collection `homepage`
4. Create document `config` in `homepage` collection
5. Add the initial data from `HOMEPAGE_FIRESTORE_SETUP.md`

**Method B: Using Cloud Function (Automated)**
1. Deploy `homepage-init.js` as a Cloud Function
2. Call the function once
3. Firestore structure and sample data are created automatically

**Method C: Manual via Code**
1. Open the homepage in a browser with developer console open
2. Import and run initialization:
```javascript
import { initializeHomepageData } from './homepage-init.js';
await initializeHomepageData();
```

### Step 3: Upload Initial Images
1. Go to Firebase Console → Storage
2. Create folder `homepage`
3. Upload images:
   - `hero-banner.jpg` (recommended: 1400x600px)
   - `about-section.jpg` (optional: 500x400px)
   - Sample category images (300x300px each)

### Step 4: Update Firestore with Real Data
1. In Firebase Console, edit `homepage/config` document
2. Update `hero` section with your real image URL and text
3. Update `about` section with brand description

### Step 5: Test
1. Visit the homepage
2. Verify all sections load correctly
3. Check that images display
4. Test responsive design on mobile

## Detailed Setup Instructions

### 1. Firestore Collections Setup

#### Create `homepage` Collection
```
Firestore → Create Collection
Name: homepage
```

#### Create `config` Document
```
Collection: homepage
Document ID: config
```

Add these initial fields:
```json
{
  "hero": {
    "image": "https://your-storage-url/hero-banner.jpg",
    "headline": "Discover Your Vibe",
    "subheading": "Shop unique collections and express yourself",
    "buttonText": "Shop Now",
    "buttonLink": "/shop.html"
  },
  "about": {
    "text": "P.S. It's A Vibe is a curated collection...",
    "image": "https://your-storage-url/about-section.jpg"
  }
}
```

#### Create `promotions` Subcollection
```
Collection: homepage/config/promotions
```

Add sample promotion (Document ID: `promo-1`):
```json
{
  "id": "promo-1",
  "title": "Welcome to P.S. It's A Vibe",
  "description": "Explore our curated collection",
  "image": "https://your-storage-url/promo-1.jpg",
  "buttonText": "Shop Now",
  "buttonLink": "/shop.html",
  "enabled": true,
  "startDate": null,
  "endDate": null,
  "displayOrder": 1
}
```

#### Create `featured_products` Subcollection
```
Collection: homepage/config/featured_products
```

Add featured products (auto-generate IDs or use custom IDs):
```json
{
  "productId": "prod-123",
  "displayOrder": 1
}
```

**Important:** Replace `prod-123` with actual product IDs from your `products` collection.

#### Create `categories` Subcollection
```
Collection: homepage/config/categories
```

Add categories (Document IDs: use category names like `fun-t-shirts`):
```json
{
  "id": "fun-t-shirts",
  "name": "Fun T Shirts",
  "image": "https://your-storage-url/categories/t-shirts.jpg",
  "enabled": true,
  "displayOrder": 1
}
```

### 2. Firebase Storage Setup

#### Upload Images
1. Firebase Console → Storage
2. Create folder structure:
   ```
   gs://your-bucket/homepage/
   ├── hero-banner.jpg
   ├── about-section.jpg
   ├── promo-1.jpg
   ├── promo-2.jpg
   └── categories/
       ├── t-shirts.jpg
       └── jewelry.jpg
   ```

#### Image Specifications
- **Hero Banner**: 1400×600px (16:9 aspect ratio) - 200-400KB
- **Promo Images**: 800×400px (2:1 aspect ratio) - 150-300KB
- **Category Images**: 300×300px (1:1 aspect ratio) - 100-200KB
- **About Image**: 500×400px - 150-250KB

**Recommended Format**: WebP with JPEG fallback

### 3. Update Firestore Security Rules

Edit your `firestore.rules` to include homepage access:

```javascript
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

    // ... rest of your existing rules
  }
}
```

Deploy with: `firebase deploy --only firestore:rules`

### 4. Update Firebase Storage Rules

Edit your `storage.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Public read access to homepage images
    match /homepage/{allPaths=**} {
      allow read;
      // Only admins can upload/delete
      allow write: if request.auth.uid != null && 
                      request.auth.token.role == "admin";
    }

    // ... rest of your existing rules
  }
}
```

Deploy with: `firebase deploy --only storage`

### 5. Testing Checklist

Run through these tests after setup:

- [ ] Homepage loads without errors
- [ ] Hero section displays image and text
- [ ] Hero button links to correct URL
- [ ] Promo banner appears and rotates (if multiple enabled)
- [ ] Promo dates filter correctly (enable/disable based on dates)
- [ ] Featured products carousel scrolls smoothly
- [ ] Category cards display with images
- [ ] Categories link to shop with correct filter
- [ ] About section displays text and image
- [ ] All responsive breakpoints work (mobile, tablet, desktop)
- [ ] Images load fast and display properly
- [ ] No console errors
- [ ] Real-time updates work (change Firestore doc, see page update)

### 6. Performance Optimization

#### Image Optimization
```bash
# Optimize images before uploading
# Using ImageMagick or similar tool:

# Resize and optimize hero banner
convert hero.png -resize 1400x600 -quality 80 hero-banner.jpg

# Resize and optimize promo images
convert promo.png -resize 800x400 -quality 80 promo.jpg

# Resize and optimize category images
convert category.png -resize 300x300 -quality 80 category.jpg
```

#### Enable Caching
Firebase automatically caches data. Additionally:

1. Set Cache-Control headers in storage:
   - Homepage images: 30 days
   - Promo images: 7 days (changes frequently)

2. Browser caching is automatic via Service Worker (if enabled)

#### Monitor Usage
- Firebase Console → Firestore → Usage
- Firebase Console → Storage → Usage
- Track growth over time

## Troubleshooting

### Hero section shows placeholder image
**Solution:**
- Verify image URL in `homepage/config` → `hero.image`
- Check Firebase Storage Security Rules allow read access
- Test URL directly in browser

### Promos not rotating
**Solution:**
- Check at least 2 promos have `enabled: true`
- Verify `displayOrder` is set for each promo
- Check browser console for JavaScript errors
- Check current date vs promo `startDate` and `endDate`

### Featured products not showing
**Solution:**
- Verify product IDs exist in `products` collection
- Check `homepage/config/featured_products` has documents
- Ensure `displayOrder` is set
- Verify product documents have required fields (`name`, `imageUrl`, `price`)

### Categories not appearing
**Solution:**
- Check `enabled: true` for each category
- Verify category `id` field is set
- Check category image URLs are accessible
- Verify `displayOrder` is set

### Real-time updates not working
**Solution:**
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for Firestore errors
- Verify Firestore read permissions
- Check Network tab for failed requests
- Try incognito/private window to rule out cache

### Images loading slowly
**Solution:**
- Optimize image file sizes (see Image Optimization section)
- Use CDN for Firebase Storage (automatic)
- Consider WebP format for faster delivery
- Upload to region closest to most users

## Deployment Checklist

Before going live:

### Code Review
- [ ] All "Good Knight Boutique" references removed
- [ ] Firebase config is correct
- [ ] No hardcoded test data in production code
- [ ] Security rules are updated
- [ ] Error handling is robust

### Firebase Setup
- [ ] Firestore collections created
- [ ] Sample data populated
- [ ] Images uploaded and accessible
- [ ] Security rules deployed
- [ ] Storage rules configured

### Testing
- [ ] Homepage renders without errors
- [ ] All sections display correctly
- [ ] Images load properly
- [ ] Responsive design works
- [ ] Real-time updates function
- [ ] Links navigate correctly
- [ ] No console errors or warnings

### Performance
- [ ] Images optimized
- [ ] Page loads quickly
- [ ] Caching configured
- [ ] No unused resources

### Documentation
- [ ] Admin team has access to guides
- [ ] Admin app developers have integration guide
- [ ] Deployment notes documented
- [ ] Support contact information clear

### Admin Preparation
- [ ] Admin app developers have `ADMIN_INTEGRATION_GUIDE.md`
- [ ] Admin app connected to Firebase
- [ ] Admin user roles configured in `users` collection
- [ ] Testing completed in admin app
- [ ] Team trained on usage

## Rollback Plan

If issues occur after deployment:

### Quick Rollback
1. In Firebase Console, update `homepage/config` with fallback content
2. Site updates immediately without redeployment

### File Rollback
1. If code has bugs, revert commit: `git revert <commit-hash>`
2. Deploy previous version

### Full Rollback
If critical issues:
1. Comment out module imports in `index.html`
2. Replace with static fallback content
3. Investigate and fix root cause
4. Re-enable Firebase integration

## Monitoring

### Weekly Checks
- Verify homepage loads correctly
- Check Firestore usage trends
- Monitor Firebase performance

### Monthly Reviews
- Analyze promo performance
- Review analytics data
- Update content as needed

### Quarterly Audits
- Review security rules
- Audit image usage
- Optimize performance
- Update documentation

## Support Contact

For technical support, refer to:
- Firebase Documentation: https://firebase.google.com/docs
- Firestore Guides: https://firebase.google.com/docs/firestore
- Homepage Documentation: See `HOMEPAGE_FIRESTORE_SETUP.md`

For admin app questions, see `ADMIN_INTEGRATION_GUIDE.md`.
