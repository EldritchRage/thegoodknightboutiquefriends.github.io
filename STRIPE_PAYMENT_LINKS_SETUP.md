# Stripe Payment Links + Firebase Auth (Spark plan, no backend)

This setup uses **only frontend code** — no Cloud Functions, no webhooks, no Stripe secret keys.

## File structure

```
├── firebase-config.js      ← Firebase web config (already set)
├── firebase-client.js      ← Auth + Firestore init
├── auth-service.js         ← Login guard, sign in/out helpers
├── stripe-config.js        ← PASTE YOUR STRIPE PAYMENT LINK URLs HERE
├── cart-storage.js         ← Passes cart from shop → buy page
├── login.html + login.js   ← Customer sign in / register
├── buy.html + buy.js       ← Protected checkout (auth required)
└── shop.html + shop.js     ← Cart → login → buy flow
```

## 1. Firebase Auth (Spark plan)

Firebase Console → **Authentication** → **Sign-in method** → enable **Email/Password**.

Add your site to **Authorized domains**:
- `localhost`
- `eldritchrage.github.io` (your GitHub Pages domain)

Customers use **`login.html`**. Shelby still uses **`admin.html`** (separate admin account).

## 2. Create Stripe Payment Links

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → **Payment Links**
2. Create a link for each product (or one general link)
3. Copy each URL (starts with `https://buy.stripe.com/...`)

## 3. Paste links in `stripe-config.js`

```js
export const stripeConfig = {
  defaultPaymentLink: "https://buy.stripe.com/YOUR_MAIN_LINK",

  productPaymentLinks: {
    "FIRESTORE_PRODUCT_DOC_ID": "https://buy.stripe.com/YOUR_PRODUCT_LINK"
  }
};
```

To find a product doc ID: Firebase Console → Firestore → `products` → copy document ID.

## 4. Customer flow

1. Browse **`shop.html`** → add to cart
2. **Proceed to Checkout**
3. If not signed in → **`login.html`** → sign in or create account
4. **`buy.html`** (protected) → **Buy Now** opens Stripe hosted checkout in a new tab

## 5. Upload to GitHub

Upload all new/updated files to repo root, including:
- `stripe-config.js` (with your real link)
- `login.html`, `login.js`
- `buy.html`, `buy.js`
- `auth-service.js`, `cart-storage.js`
- `shop.html`, `shop.js`

## Important limits (by design)

- Payment happens on **Stripe's hosted page** — your site only opens the link
- No automatic order sync back to Firestore (no webhooks without a backend)
- Each Payment Link has a **fixed price** set in Stripe Dashboard
- Auth protects the **buy page** on your site; Stripe link URLs themselves are still shareable if someone has the URL

## No longer needed

- `functions/` folder (Cloud Functions)
- `braintree-config.js`
- Braintree script on shop page
