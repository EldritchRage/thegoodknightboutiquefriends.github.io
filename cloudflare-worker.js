// Deploy as a Cloudflare Worker: wrangler deploy
// Secrets: STRIPE_SECRET_KEY, ALLOWED_ORIGIN (e.g. https://psitsavibe.com)

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405, headers: corsHeaders });
    }

    try {
      const body = await request.json();
      const { line_items, success_url, cancel_url } = body;

      if (!Array.isArray(line_items) || line_items.length === 0) {
        return Response.json({ error: "No items provided" }, { status: 400, headers: corsHeaders });
      }

      if (line_items.length > 50) {
        return Response.json({ error: "Too many items" }, { status: 400, headers: corsHeaders });
      }

      const sanitizedItems = line_items.map((item) => {
        if (!item.price_id || typeof item.price_id !== "string") {
          throw new Error("Invalid price_id");
        }
        if (!item.price_id.startsWith("price_")) {
          throw new Error("Invalid price_id format");
        }
        const qty = Math.floor(Number(item.quantity));
        if (!qty || qty < 1 || qty > 99) {
          throw new Error("Invalid quantity");
        }
        return { price: item.price_id, quantity: qty };
      });

      const STRIPE_SECRET = env.STRIPE_SECRET_KEY;
      for (const item of sanitizedItems) {
        const priceRes = await fetch(`https://api.stripe.com/v1/prices/${item.price}`, {
          headers: { Authorization: `Bearer ${STRIPE_SECRET}` }
        });
        if (!priceRes.ok) {
          return Response.json(
            { error: `Invalid price: ${item.price}` },
            { status: 400, headers: corsHeaders }
          );
        }
      }

      const params = new URLSearchParams();
      params.append("mode", "payment");
      params.append("success_url", success_url || `${env.ALLOWED_ORIGIN}/checkout-success.html`);
      params.append("cancel_url", cancel_url || `${env.ALLOWED_ORIGIN}/checkout-cancel.html`);

      sanitizedItems.forEach((item, i) => {
        params.append(`line_items[${i}][price]`, item.price);
        params.append(`line_items[${i}][quantity]`, item.quantity);
      });

      const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      const session = await sessionRes.json();
      if (!sessionRes.ok) {
        return Response.json(
          { error: session.error?.message || "Failed to create session" },
          { status: 500, headers: corsHeaders }
        );
      }

      return Response.json({ url: session.url }, { headers: corsHeaders });
    } catch (err) {
      return Response.json(
        { error: err.message || "Internal server error" },
        { status: 500, headers: corsHeaders }
      );
    }
  }
};
