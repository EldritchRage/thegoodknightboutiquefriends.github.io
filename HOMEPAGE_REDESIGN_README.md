# P.S. It's A Vibe - Homepage Redesign

## Overview
The homepage has been completely redesigned to reflect the **P.S. It's A Vibe** brand. All content is now managed through Firebase/Firestore, allowing Shelby to make real-time updates from the Android admin app without requiring code changes or website redeployment.

## Key Changes

### ✨ Removed
- All references to "The Good Knight Boutique"
- Collaborative marketplace concept
- Creator profiles (Shelby Knight showcase)
- Artist/maker focus
- Seasonal spotlight section

### 🎉 Added
- **Hero Section** - Large banner with customizable image, headline, subheading, and CTA button
- **Promo Banners** - Rotating carousel with multiple promos, date scheduling, and automatic filtering
- **Featured Products** - Horizontally scrolling carousel of curated products
- **Categories Grid** - Clickable category tiles with visibility and ordering controls
- **About Section** - Brand introduction with optional supporting image
- **Firebase/Firestore Integration** - All content dynamically loaded and managed

### 🎨 Design
- Clean, modern design matching existing P.S. It's A Vibe brand
- Responsive layout for mobile, tablet, and desktop
- Smooth animations and transitions
- Dark theme with purple and cyan accents
- Consistent typography and spacing

## File Structure

### Core Files
- **`index.html`** - Homepage markup with semantic structure
- **`index.js`** - Firebase/Firestore data loading and rendering logic
- **`styles.css`** - Complete responsive styling for all sections

### Documentation
- **`HOMEPAGE_FIRESTORE_SETUP.md`** - Complete Firestore collection structure and sample data
- **`ADMIN_INTEGRATION_GUIDE.md`** - Detailed guide for Android admin app integration
- **`homepage-init.js`** - One-time initialization script to seed Firestore with sample data

## Firestore Structure

The homepage data is organized in Firebase as follows:

```
homepage/
├── config (Document)
│   ├── hero
│   │   ├── image
│   │   ├── headline
│   │   ├── subheading
│   │   ├── buttonText
│   │   └── buttonLink
│   ├── about
│   │   ├── text
│   │   └── image
│   └── promotions/ (Subcollection)
│       ├── promo-1 { title, description, image, enabled, startDate, endDate, ... }
│       └── promo-2 { ... }
├── featured_products/ (Subcollection)
│   ├── auto-id-1 { productId, displayOrder }
│   └── auto-id-2 { ... }
└── categories/ (Subcollection)
    ├── cat-1 { id, name, image, enabled, displayOrder }
    └── cat-2 { ... }
```

## Getting Started

### 1. Initialize Firestore (One-time Setup)
The `homepage-init.js` file contains sample initialization data. You can:

**Option A: Use Cloud Functions**
1. Deploy the initialization as a Cloud Function
2. Call it once to set up the structure

**Option B: Manual Setup**
1. Go to Firebase Console → Firestore Database
2. Create the document structure as described in `HOMEPAGE_FIRESTORE_SETUP.md`
3. Add sample data from the examples provided

### 2. Upload Images to Firebase Storage
Store images in: `gs://good-knight-boutique.appspot.com/homepage/`

Required images:
- `hero-banner.jpg` - Hero section background
- `about-section.jpg` - About section image (optional)
- `promo-*.jpg` - Individual promo images
- `categories/*.jpg` - Category tile images

### 3. Update Firestore with Real Data
Edit the `homepage/config` document with:
- Real hero image URL
- Your headline and subheading
- Real about text and image
- Add promotions with dates
- Add featured product IDs
- Configure categories

### 4. Test on Website
Visit the homepage and verify:
- ✅ Hero section loads with your image and text
- ✅ Promotions display and rotate every 5 seconds
- ✅ Featured products carousel works
- ✅ Categories display correctly
- ✅ About section shows your text

## How It Works

### Real-time Sync
1. Admin makes a change in the Android app (e.g., updates hero headline)
2. Admin app writes the change to Firestore
3. Website listens for changes and detects the update
4. Homepage automatically re-renders with new content
5. No page refresh or redeployment needed

### Promo Scheduling
```
Promo visibility logic:
- If enabled = false → Never show
- If startDate is in future → Don't show until that date
- If endDate is in past → Don't show
- If multiple promos enabled → Rotate every 5 seconds
- If only one promo → Show continuously
```

### Featured Products
- Displays products in carousel order
- Each product card shows image, name, and price
- Fetches actual product data from `products` collection
- Navigation arrows to scroll left/right

### Categories
- Each category links to shop with category filter
- Only enabled categories display
- Ordered by displayOrder field
- Category image serves as visual background

## Admin App Integration

The Android admin app can manage these sections through Firebase:

### Features Available in Admin App
1. **Hero Section Editor**
   - Upload/change hero image
   - Edit headline, subheading, button text, button link
   - Save changes instantly to Firestore

2. **Promo Manager**
   - Add new promotions
   - Edit existing promos
   - Delete promos
   - Enable/disable toggle
   - Set start and end dates with date picker
   - Drag to reorder promos
   - Upload promo images

3. **Featured Products**
   - Search products
   - Add to featured carousel
   - Remove from featured
   - Drag to reorder
   - Limit to 8-10 products for performance

4. **Categories Manager**
   - Show/hide categories
   - Upload category images
   - Drag to reorder
   - Edit category names

5. **About Section**
   - Edit about text
   - Upload about image
   - Save changes

See `ADMIN_INTEGRATION_GUIDE.md` for detailed integration instructions.

## Security

### Firestore Rules
```
// Public read access to homepage
match /homepage/{document=**} {
  allow read;
  // Only authenticated admins can write
  allow write: if request.auth.uid != null && 
                  get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
}
```

### Firebase Storage
Set public read access for homepage images while restricting write access to authenticated admins.

## Responsive Design

The homepage is fully responsive:
- **Desktop (1024px+)**: Full layout with all features
- **Tablet (768px-1023px)**: Adjusted spacing and sizing
- **Mobile (< 768px)**: Optimized for mobile with:
  - Full-width sections
  - Smaller carousels
  - Touch-friendly buttons
  - Single column layouts

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Optimization

### Image Optimization
- Use WebP format with JPEG fallback
- Optimize file sizes before upload
- Recommended max 500KB per image

### Lazy Loading
- Featured products use `loading="lazy"`
- Images load on-demand

### Caching
- Firebase caches data locally
- Reduces unnecessary network requests
- Instant updates when data changes

## Troubleshooting

### Homepage not loading?
1. Check browser console for errors (F12 → Console)
2. Verify Firebase config is correct in `firebase-config.js`
3. Check Firestore read permissions
4. Look at Network tab for failed requests

### Content not showing?
1. Verify documents exist in Firestore
2. Check field names match exactly (case-sensitive)
3. Verify images URLs are correct
4. Check Firestore data types (string vs URL)

### Images not loading?
1. Verify Firebase Storage URLs are correct
2. Check Storage security rules allow public read
3. Ensure images are uploaded successfully
4. Test URL in browser to confirm accessibility

### Promos not rotating?
1. Check `enabled: true` for each promo
2. Verify `displayOrder` is set
3. Check date scheduling (if applicable)
4. Look for JavaScript errors in console

## Maintenance

### Regular Tasks
- Monitor Firebase usage and costs
- Update promo images seasonally
- Archive old promotions
- Monitor analytics for engagement

### Updates to Content
- Use Android admin app for all changes
- Never edit Firestore documents directly unless necessary
- Document any manual Firestore changes
- Test changes on staging before production

## Future Enhancements

Possible improvements:
- [ ] A/B testing for different hero images
- [ ] Analytics tracking for promo performance
- [ ] Email notifications when promos are about to expire
- [ ] Scheduled auto-publish for time-zone-aware promotions
- [ ] Admin approval workflow for promotions
- [ ] Product recommendations based on user behavior
- [ ] Newsletter signup integration in about section

## Support & Documentation

For more information:
- **Firestore Structure**: See `HOMEPAGE_FIRESTORE_SETUP.md`
- **Admin Integration**: See `ADMIN_INTEGRATION_GUIDE.md`
- **Initialization**: See `homepage-init.js`

## License
Same as the rest of the P.S. It's A Vibe project.

---

**Last Updated:** 2026-07-13
**Maintained by:** Copilot CLI
