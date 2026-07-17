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

    if (product !== 'complete-kit') {
      return jsonResponse({ error: 'Invalid product selection.' }, 400);
    }

    const priceId = env.STRIPE_PRICE_KIT;
    if (!priceId || !priceId.startsWith('price_')) {
      return jsonResponse(
        { error: 'Stripe price not configured. Set STRIPE_PRICE_KIT.' },
        500
      );
    }

    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      return jsonResponse({ error: 'Stripe secret key not configured.' }, 500);
    }

    const stripe = getStripe(env);
    const baseUrl = env.BASE_URL || 'https://www.griddowndata.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      shipping_address_collection: { allowed_countries: ['US'] },
      metadata: { product: 'complete-kit', price_id: priceId },
      success_url: `${baseUrl}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/#offer`,
      automatic_tax: { enabled: false },
    });

    if (!session || !session.url) {
      return jsonResponse({ error: 'Unable to create checkout session.' }, 500);
    }

    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return jsonResponse({ error: err.message || 'Checkout failed.' }, 500);
  }
}
