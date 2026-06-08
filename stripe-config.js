// Paste your Stripe Payment Link URLs from:
// Stripe Dashboard → Payment Links → copy link (starts with https://buy.stripe.com/...)
//
// No secret keys. No backend. Spark plan friendly.

export const stripeConfig = {
  // Used when a product has no specific link below
  defaultPaymentLink: "PASTE_YOUR_STRIPE_PAYMENT_LINK_HERE",

  // Optional: map Firestore product document IDs to their own Payment Links
  // Example:
  // productPaymentLinks: {
  //   "abc123firestoreId": "https://buy.stripe.com/test_xxxxx"
  // }
  productPaymentLinks: {}
};
