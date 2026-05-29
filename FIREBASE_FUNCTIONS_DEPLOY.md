# Deploy Braintree Firebase Functions

Project folder:

`c:\Users\kylec\Downloads\thegoodknightboutiquefriends.github.io-main (1)\thegoodknightboutiquefriends.github.io-main`

## 1. Install tools (one time)

```bash
npm install -g firebase-tools
```

Log in:

```bash
firebase login
```

## 2. Install function dependencies

```bash
cd functions
npm install
cd ..
```

## 3. Add Braintree sandbox keys

From [Braintree Sandbox](https://sandbox.braintreegateway.com/) → **Settings → API**.

Run (replace with your real values):

```bash
firebase functions:config:set ^
  braintree.merchant_id="YOUR_MERCHANT_ID" ^
  braintree.public_key="YOUR_PUBLIC_KEY" ^
  braintree.private_key="YOUR_PRIVATE_KEY" ^
  braintree.environment="sandbox"
```

On Mac/Linux use `\` instead of `^` for line breaks, or put it on one line.

## 4. Deploy functions

From the project folder (where `firebase.json` lives):

```bash
firebase deploy --only functions
```

You should get URLs like:

- `https://us-central1-good-knight-boutique.cloudfunctions.net/braintreeClientToken`
- `https://us-central1-good-knight-boutique.cloudfunctions.net/braintreeCheckout`

`braintree-config.js` is already set to use these URLs.

## 5. Upgrade Firebase plan

Cloud Functions require the **Blaze (pay-as-you-go)** plan. You still get a free tier; you only pay if usage exceeds it.

Firebase Console → Project → **Upgrade**.

## 6. Test checkout

1. Upload latest `shop.html`, `shop.js`, `braintree-config.js` to GitHub Pages.
2. Add items to cart → **Proceed to Checkout**.
3. Pay with Braintree sandbox card `4111111111111111` or sandbox PayPal.

## 7. Production

When ready for live payments:

```bash
firebase functions:config:set braintree.environment="production"
```

Use **live** Braintree keys, then redeploy:

```bash
firebase deploy --only functions
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| CORS blocked | Functions use `cors({ origin: true })` — redeploy functions |
| Client token missing | Check `functions:config` keys and deploy |
| 402 Payment declined | Use sandbox test card / PayPal sandbox account |
| Permission denied on orders | Publish `firestore.rules` with `orders` create allowed |
