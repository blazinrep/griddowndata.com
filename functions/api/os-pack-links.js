import { getStripe } from './_shared/stripe.js';
import { presignR2Get, r2Configured } from './_shared/r2-presign.js';
import { OS_PACK_FILES } from './_shared/os-pack-manifest.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// GET /api/os-pack-links?session_id=cs_...
// Verifies the Stripe Checkout Session was actually paid for the OS Pack,
// then returns a JSON list of time-limited, direct-to-R2 download URLs — one
// per file in the bundle. Nothing is streamed through this Worker; at 86GB
// total that would blow well past any Worker memory limit. The browser (or
// the thank-you page's script) downloads each file straight from R2.
export async function onRequestGet(context) {
  const { request, env } = context;
  const sessionId = new URL(request.url).searchParams.get('session_id');

  if (!sessionId) return jsonResponse({ error: 'Missing session_id.' }, 400);
  if (!env.STRIPE_SECRET_KEY) return jsonResponse({ error: 'Server not configured.' }, 500);
  if (!r2Configured(env)) {
    return jsonResponse(
      { error: 'OS Pack downloads are not configured yet. (Missing R2_* environment variables.)' },
      500
    );
  }

  let session;
  try {
    session = await getStripe(env).checkout.sessions.retrieve(sessionId);
  } catch (err) {
    console.error('Session lookup failed:', err);
    return jsonResponse({ error: 'Could not verify your purchase.' }, 400);
  }

  const completed = session &&
    (session.payment_status === 'paid' || session.payment_status === 'no_payment_required');
  if (!completed) {
    return jsonResponse(
      { error: 'This purchase is not complete. If you just paid, wait a moment and retry.' },
      403
    );
  }

  if (session.metadata?.product !== 'os-pack') {
    return jsonResponse({ error: 'This order is not an OS Pack purchase.' }, 404);
  }

  try {
    const files = await Promise.all(
      OS_PACK_FILES.map(async (f) => ({
        label: f.label,
        filename: f.filename,
        sizeHint: f.sizeHint || null,
        url: await presignR2Get(env, f.key, { filename: f.filename }),
      }))
    );
    return jsonResponse({ files, expiresInHours: 48 });
  } catch (err) {
    console.error('Failed to generate OS Pack download links:', err);
    return jsonResponse({ error: 'Could not prepare your downloads. Please contact support.' }, 500);
  }
}
