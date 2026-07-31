import { getStripe } from './_shared/stripe.js';
import { DIGITAL_PRODUCTS } from './_shared/digital.js';
import { watermarkPdf } from './_shared/watermark.js';

function textResponse(msg, status = 200) {
  return new Response(msg, { status, headers: { 'Content-Type': 'text/plain' } });
}

// GET /api/download?session_id=cs_...
// Verifies the Stripe Checkout Session is paid, confirms it was a digital
// product, then streams the file from the PRIVATE R2 bucket. The PDF is never
// exposed at a public URL — the only way to get it is a real, paid session.
export async function onRequestGet(context) {
  const { request, env } = context;
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!sessionId) return textResponse('Missing session_id.', 400);
  if (!env.STRIPE_SECRET_KEY) return textResponse('Server not configured.', 500);
  if (!env.PDF_BUCKET) return textResponse('Download storage not configured.', 500);

  // 1. Verify the session with Stripe (server-side — never trust the client).
  let session;
  try {
    session = await getStripe(env).checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error('Session lookup failed:', err);
    return textResponse('Could not verify your purchase.', 400);
  }

  // A completed order is either paid, or fully discounted to $0 via a 100%-off
  // coupon (Stripe reports that as 'no_payment_required').
  const completed = session &&
    (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
  if (!completed) {
    return textResponse('This purchase is not complete. If you just paid, wait a moment and retry.', 403);
  }

  // 2. Confirm the purchased product is one we deliver as a download.
  const item = DIGITAL_PRODUCTS[session.metadata?.product];
  if (!item) return textResponse('No downloadable product is associated with this order.', 404);

  // 3. Pull the object from the private bucket, stamp a per-buyer watermark,
  //    and return it as an attachment. If stamping fails for any reason, fall
  //    back to the original so the paying customer always gets their file.
  const object = await env.PDF_BUCKET.get(item.key);
  if (!object) {
    console.error('Object missing from R2:', item.key);
    return textResponse('The file could not be found. Please contact support.', 404);
  }

  const original = await object.arrayBuffer();
  let body = original;
  try {
    body = await watermarkPdf(original, {
      email: session.customer_details?.email,
      orderId: session.id,
    });
  } catch (err) {
    console.error('Watermarking failed, serving original copy:', err);
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/pdf');
  headers.set('Content-Disposition', `attachment; filename="${item.filename}"`);
  headers.set('Cache-Control', 'no-store');
  return new Response(body, { headers });
}
