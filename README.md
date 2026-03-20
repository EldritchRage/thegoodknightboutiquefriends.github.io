# thegoodknightboutiquefriends.github.io
A collaboration of a handful of creators to bring a selection of products to the community.

## Firebase (required for admin + live products)

Follow **`FIREBASE_SETUP.md`** step by step. Copy **`firestore.rules`** and **`storage.rules`** into the Firebase Console.

---

## Shelby Admin Dashboard (no Shopify)

This site now includes `admin.html`, which lets Shelby:

- sign in
- upload product images
- edit prices, descriptions, and categories
- create or update products
- update the homepage promo panel

### Firebase setup

1. Create a Firebase project and Web App.
2. Enable **Authentication > Email/Password**.
3. Enable **Firestore Database**.
4. Enable **Storage**.
5. Copy Firebase web config into `firebase-config.js`.
6. Deploy site updates to GitHub Pages.

### Firestore collections used

- `products` (one doc per product)
- `siteContent/homepagePromo` (single doc for homepage promo section)

### Suggested Firestore rules (starter)

Use stricter rules in production. This starter allows read access for everyone and write access only for signed-in users:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /siteContent/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Suggested Storage rules (starter)

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /product-images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
