# Stripe Checkout + Cloudflare Worker Setup

## Frontend files

| File | Purpose |
|------|---------|
| `cart.js` | localStorage cart (`stripe_cart`) |
| `checkout.js` | POST Price IDs + quantities to backend |
| `checkout-config.js` | **Paste your Cloudflare Worker URL here** |
| `sampleProducts.js` | Optional Firestore doc ID → Price ID map |
| `cart.html` | Cart + Secure Checkout button |
| `checkout-success.html` | Clears cart after payment |
| `checkout-cancel.html` | Cart preserved, safe return |

## 1. Stripe products

1. Create products/prices in [Stripe Dashboard](https://dashboard.stripe.com/products).
2. Copy each **Price ID** (`price_...`).
3. In **admin.html**, add the Price ID to each product, or map IDs in `sampleProducts.js`.

## 2. Deploy Cloudflare Worker

1. Use `cloudflare-worker.js` in a Cloudflare Workers project.
2. Set secrets:
   - `STRIPE_SECRET_KEY` — your Stripe secret key (never put this in the frontend)
   - `ALLOWED_ORIGIN` — `https://psitsavibe.com` (and `https://www.psitsavibe.com` if needed)
3. Deploy and copy the Worker URL.

## 3. Connect frontend

Edit `checkout-config.js`:

```js
export const CHECKOUT_API_URL = "https://your-worker.workers.dev";
```

## 4. Upload to GitHub Pages

Upload all site files at the **repo root**. Key new/updated files:

- `cart.js`, `checkout.js`, `checkout-config.js`, `sampleProducts.js`, `nav-cart.js`
- `cart.html`, `cart-page.js`
- `checkout-success.html`, `checkout-success.js`, `checkout-cancel.html`
- `shop.html`, `shop.js`, `styles.css`, `admin.html`, `admin.js`

## Security

- Frontend sends only `price_id` and `quantity`.
- Display prices in the cart are for UI only; Stripe calculates totals server-side.
- No Stripe secret keys in client code.
