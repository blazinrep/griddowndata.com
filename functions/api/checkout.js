import { getStripe } from './_shared/stripe.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const product = String(body.product || 'complete-kit');

    // Two SKUs: physical drive (ships) and DIY guide PDF (digital, no shipping).
    // TODO: create both prices in Stripe and set STRIPE_PRICE_KIT + STRIPE_PRICE_DIY.
    const CATALOG = {
      'complete-kit': { priceEnv: 'STRIPE_PRICE_KIT', physical: true },
      'diy-guide': { priceEnv: 'STRIPE_PRICE_DIY', physical: false },
    };

    const item = CATALOG[product];
    if (!item) {
      return jsonResponse({ error: 'Invalid product selection.' }, 400);
    }

    const priceId = env[item.priceEnv];
    if (!priceId || !priceId.startsWith('price_')) {
      return jsonResponse(
        { error: `Stripe price not configured. Set ${item.priceEnv}.` },
        500
      );
    }

    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      return jsonResponse({ error: 'Stripe secret key not configured.' }, 500);
    }

    const stripe = getStripe(env);
    const baseUrl = env.BASE_URL || 'https://www.griddowndata.com';

    const sessionParams = {
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { product, price_id: priceId },
      success_url: `${baseUrl}/thank-you.html?session_id={CHECKOUT_SESSION_ID}&product=${product}`,
      cancel_url: `${baseUrl}/#pricing`,
      automatic_tax: { enabled: false },
    };

    // Physical goods collect a shipping address; the digital PDF does not.
    if (item.physical) {
      sessionParams.shipping_address_collection = { allowed_countries: ['US'] };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session || !session.url) {
      return jsonResponse({ error: 'Unable to create checkout session.' }, 500);
    }

    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return jsonResponse({ error: err.message || 'Checkout failed.' }, 500);
  }
}
