// Copy this file to paypal-config.js and set Shelby's Client ID from:
// https://developer.paypal.com/dashboard/applications
//
// Multi-creator payouts: each creator's PayPal Client ID is stored in Firestore (Admin → Creators & PayPal).
// This file is only a fallback for creator ID "shelby" when Firestore has no creators yet.
//
// Never put your PayPal Secret in the website.

export const paypalClientId = "PASTE_YOUR_PAYPAL_CLIENT_ID_HERE";
