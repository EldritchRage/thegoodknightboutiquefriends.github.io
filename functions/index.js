const functions = require("firebase-functions");
const admin = require("firebase-admin");
const braintree = require("braintree");
const cors = require("cors")({ origin: true });

admin.initializeApp();

function getGateway() {
  const cfg = functions.config().braintree || {};
  const merchantId = cfg.merchant_id || process.env.BRAINTREE_MERCHANT_ID;
  const publicKey = cfg.public_key || process.env.BRAINTREE_PUBLIC_KEY;
  const privateKey = cfg.private_key || process.env.BRAINTREE_PRIVATE_KEY;
  const environmentName = (cfg.environment || process.env.BRAINTREE_ENVIRONMENT || "sandbox").toLowerCase();

  if (!merchantId || !publicKey || !privateKey) {
    throw new Error(
      "Braintree credentials missing. Run: firebase functions:config:set braintree.merchant_id=\"...\" braintree.public_key=\"...\" braintree.private_key=\"...\" braintree.environment=\"sandbox\""
    );
  }

  const environment =
    environmentName === "production"
      ? braintree.Environment.Production
      : braintree.Environment.Sandbox;

  return new braintree.BraintreeGateway({
    environment,
    merchantId,
    publicKey,
    privateKey
  });
}

function runCors(req, res, handler) {
  return cors(req, res, async () => {
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: error.message || "Server error"
      });
    }
  });
}

exports.braintreeClientToken = functions.https.onRequest((req, res) => {
  runCors(req, res, async () => {
    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).json({ success: false, message: "Method not allowed" });
      return;
    }

    const gateway = getGateway();
    const response = await gateway.clientToken.generate({});
    res.status(200).json({ clientToken: response.clientToken });
  });
});

exports.braintreeCheckout = functions.https.onRequest((req, res) => {
  runCors(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ success: false, message: "Method not allowed" });
      return;
    }

    const { paymentMethodNonce, amount, order } = req.body || {};

    if (!paymentMethodNonce || !amount) {
      res.status(400).json({
        success: false,
        message: "paymentMethodNonce and amount are required"
      });
      return;
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, message: "Invalid amount" });
      return;
    }

    const gateway = getGateway();
    const result = await gateway.transaction.sale({
      amount: numericAmount.toFixed(2),
      paymentMethodNonce,
      options: { submitForSettlement: true }
    });

    if (!result.success) {
      const message =
        result.message ||
        (result.transaction && result.transaction.processorResponseText) ||
        "Payment declined";
      res.status(402).json({ success: false, message });
      return;
    }

    const transaction = result.transaction;
    const orderPayload = {
      ...(order || {}),
      transactionId: transaction.id,
      status: "paid",
      paidAt: admin.firestore.FieldValue.serverTimestamp()
    };

    try {
      await admin.firestore().collection("orders").add(orderPayload);
    } catch (firestoreError) {
      console.error("order save failed after successful charge", firestoreError);
    }

    res.status(200).json({
      success: true,
      transactionId: transaction.id
    });
  });
});
