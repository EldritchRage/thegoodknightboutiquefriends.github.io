// Firebase Cloud Functions URLs (deploy with: firebase deploy --only functions)
// See FIREBASE_FUNCTIONS_DEPLOY.md

const REGION = "us-central1";
const PROJECT_ID = "good-knight-boutique";
const BASE = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

export const braintreeConfig = {
  clientTokenUrl: `${BASE}/braintreeClientToken`,
  checkoutUrl: `${BASE}/braintreeCheckout`
};
