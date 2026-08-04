import { getStripe } from './_shared/stripe.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Three SKUs: physical drive (ships), DIY guide PDF (digital, no shipping),
// and the OS Pack (digital, no shipping — delivered as a set of direct R2
// download links instead of a single PDF; see os-pack-links.js).
const CATALOG = {
  'complete-kit': { priceEnv: 'STRIPE_PRICE_KIT', physical: true },
  'diy-guide': { priceEnv: 'STRIPE_PRICE_DIY', physical: false },
  'os-pack': { priceEnv: 'STRIPE_PRICE_OS_PACK', physical: false },
};

// Build the base Checkout Session params for a product. Returns { error } if the
// product or its Stripe price isn't configured, otherwise { params }.
function buildSessionParams(env, product) {
  const item = CATALOG[product];
  if (!item) return { error: 'Invalid product selection.', status: 400 };

  const priceId = env[item.priceEnv];
  if (!priceId || !priceId.startsWith('price_')) {
    return { error: `Stripe price not configured. Set ${item.priceEnv}.`, status: 500 };
  }
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    return { error: 'Stripe secret key not configured.', status: 500 };
  }

  const baseUrl = env.BASE_URL || 'https://griddowndata.com';
  const params = {
    mode: 'payment',
    // Let buyers enter a promotion code (e.g. a 100%-off gift/marketing code).
    allow_promotion_codes: true,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { product, price_id: priceId },
    success_url: `${baseUrl}/thank-you.html?session_id={CHECKOUT_SESSION_ID}&product=${product}`,
    cancel_url: `${baseUrl}/#pricing`,
    automatic_tax: { enabled: false },
  };
  // Physical goods collect a shipping address; the digital PDF does not.
  if (item.physical) {
    params.shipping_address_collection = { allowed_countries: ['US'] };
  }
  return { params };
}

// Look up an active, still-redeemable promotion code by its customer-facing
// code (e.g. "GDB-GIFT") and return its id. Returns null if it doesn't exist,
// is inactive, or has hit its redemption cap — callers fall back gracefully.
async function findUsablePromotionCode(stripe, code) {
  try {
    const list = await stripe.promotionCodes.list({ code, active: true, limit: 1 });
    const promo = list.data && list.data[0];
    if (!promo) return null;
    if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) return null;
    if (promo.expires_at && promo.expires_at * 1000 < Date.now()) return null;
    return promo.id;
  } catch (err) {
    console.error('Promotion code lookup failed:', err);
    return null;
  }
}

// POST /api/checkout  { product } — used by the on-site buy buttons.
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const product = String(body.product || 'complete-kit');

    const built = buildSessionParams(env, product);
    if (built.error) return jsonResponse({ error: built.error }, built.status);

    const stripe = getStripe(env);
    const session = await stripe.checkout.sessions.create(built.params);
    if (!session || !session.url) {
      return jsonResponse({ error: 'Unable to create checkout session.' }, 500);
    }
    return jsonResponse({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return jsonResponse({ error: err.message || 'Checkout failed.' }, 500);
  }
}

// GET /api/checkout?product=diy-guide&promo=GDB-GIFT — a shareable one-click
// link. Pre-applies the promo code so the recipient lands straight on a $0 (or
// discounted) Stripe checkout. If the code is missing, invalid, or maxed out,
// it still opens a normal checkout where the code can be entered by hand.
export async function onRequestGet(context) {
  const { request, env } = context;
  const baseUrl = env.BASE_URL || 'https://griddowndata.com';
  try {
    const url = new URL(request.url);
    const product = url.searchParams.get('product') || 'diy-guide';
    const promoCode = (url.searchParams.get('promo') || '').trim();

    const built = buildSessionParams(env, product);
    if (built.error) {
      // Don't dead-end a shared link — send them to the pricing section.
      return Response.redirect(`${baseUrl}/#pricing`, 302);
    }

    const stripe = getStripe(env);
    const params = built.params;
    if (promoCode) {
      const promoId = await findUsablePromotionCode(stripe, promoCode);
      if (promoId) {
        // discounts and allow_promotion_codes are mutually exclusive in Stripe.
        params.discounts = [{ promotion_code: promoId }];
        delete params.allow_promotion_codes;
      }
    }

    const session = await stripe.checkout.sessions.create(params);
    if (!session || !session.url) return Response.redirect(`${baseUrl}/#pricing`, 302);
    return Response.redirect(session.url, 302);
  } catch (err) {
    console.error('Checkout (GET) error:', err);
    return Response.redirect(`${baseUrl}/#pricing`, 302);
  }
}
