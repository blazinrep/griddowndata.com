import { getStripe } from './_shared/stripe.js';
import { DIGITAL_PRODUCTS, arrayBufferToBase64 } from './_shared/digital.js';
import { watermarkPdf } from './_shared/watermark.js';
import { presignR2Get, r2Configured } from './_shared/r2-presign.js';
import { OS_PACK_FILES } from './_shared/os-pack-manifest.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function formatAddress(addr) {
  if (!addr) return 'Not provided';
  const parts = [
    addr.line1,
    addr.line2,
    addr.city,
    addr.state,
    addr.postal_code,
    addr.country,
  ].filter(Boolean);
  return parts.join(', ');
}

function formatEmailBody(order) {
  const lines = [
    `New GridDownData order received`,
    ``,
    `Stripe Session: ${order.orderId}`,
    `Status: ${order.status}`,
    `Created: ${order.created}`,
    ``,
    `Customer: ${order.customer_name || 'Not provided'}`,
    `Email: ${order.customer_email || 'Not provided'}`,
    ``,
    `Product: ${order.product || 'N/A'}`,
    `Total: ${(order.amount_total / 100).toFixed(2)} ${order.currency.toUpperCase()}`,
    ``,
    `Shipping address:`,
    formatAddress(order.shipping),
    ``,
    `Items:`,
    ...order.items.map((i) => ` - ${i.name}: ${(i.amount / 100).toFixed(2)} ${order.currency.toUpperCase()}`),
  ];
  return lines.join('\n');
}

async function notifyWebhook(order, url) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) {
      console.warn(`ORDER_WEBHOOK_URL returned ${res.status}`);
    }
  } catch (err) {
    console.error('Failed to call ORDER_WEBHOOK_URL:', err);
  }
}

async function notifyEmail(order, env) {
  try {
    if (!env.SENDGRID_API_KEY || !env.ALERT_EMAIL) return;
    const fromEmail = env.FROM_EMAIL || 'orders@griddowndata.com';
    const body = formatEmailBody(order);
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: env.ALERT_EMAIL }] }],
        from: { email: fromEmail },
        subject: `New GridDownData order ${order.orderId.slice(-6)}`,
        content: [{ type: 'text/plain', value: body }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('SendGrid returned error:', res.status, text);
    }
  } catch (err) {
    console.error('Failed to send email notification:', err);
  }
}

// Deliver the purchased PDF to the customer, attached to an email, when the
// order is a digital product. Pulls the file from the private R2 bucket.
async function deliverDigitalProduct(order, env) {
  try {
    const item = DIGITAL_PRODUCTS[order.product];
    if (!item) return; // not a digital product — nothing to deliver
    if (!env.SENDGRID_API_KEY) { console.warn('SENDGRID_API_KEY not set; cannot deliver PDF'); return; }
    if (!env.PDF_BUCKET) { console.warn('PDF_BUCKET not bound; cannot deliver PDF'); return; }
    if (!order.customer_email) { console.warn('No customer email on order; cannot deliver PDF'); return; }

    const object = await env.PDF_BUCKET.get(item.key);
    if (!object) { console.error('PDF missing from R2:', item.key); return; }
    const original = await object.arrayBuffer();
    let bytes = new Uint8Array(original);
    try {
      bytes = await watermarkPdf(original, { email: order.customer_email, orderId: order.orderId });
    } catch (err) {
      console.error('Watermarking failed for email delivery, sending original:', err);
    }
    const base64 = arrayBufferToBase64(bytes);

    const fromEmail = env.FROM_EMAIL || 'orders@griddowndata.com';
    const baseUrl = env.BASE_URL || 'https://griddowndata.com';
    const downloadUrl = `${baseUrl}/api/download?session_id=${order.orderId}`;

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: order.customer_email }] }],
        from: { email: fromEmail, name: 'GridDownData' },
        subject: 'Your Grid-Down Data Blueprint is ready',
        content: [{
          type: 'text/plain',
          value:
            `Thanks for your order.\n\n` +
            `Your Grid-Down Data Blueprint is attached to this email as a PDF.\n` +
            `You can also download it here (link tied to your purchase): ${downloadUrl}\n\n` +
            `Save it somewhere safe — once downloaded it works with no internet.\n\n` +
            `— GridDownData`,
        }],
        attachments: [{
          content: base64,
          filename: item.filename,
          type: 'application/pdf',
          disposition: 'attachment',
        }],
      }),
    });
    if (!res.ok) {
      console.warn('Digital delivery email failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Failed to deliver digital product:', err);
  }
}

// Deliver the OS Pack when the order is that product. Unlike the single
// watermarked PDF, this bundle is ~86GB across many files — far too large to
// attach to an email or stream through this Worker. Instead we generate
// time-limited, direct-to-R2 links (one per file, see os-pack-manifest.js)
// and email those links. The same links are also fetched live by
// thank-you.html so the buyer isn't purely dependent on the email arriving.
async function deliverOsPack(order, env) {
  try {
    if (order.product !== 'os-pack') return; // not this product — nothing to do
    if (!env.SENDGRID_API_KEY) { console.warn('SENDGRID_API_KEY not set; cannot email OS Pack links'); return; }
    if (!order.customer_email) { console.warn('No customer email on order; cannot deliver OS Pack'); return; }
    if (!r2Configured(env)) { console.warn('R2_* env vars not set; cannot generate OS Pack links'); return; }

    const files = await Promise.all(
      OS_PACK_FILES.map(async (f) => ({
        label: f.label,
        url: await presignR2Get(env, f.key, { filename: f.filename }),
      }))
    );

    const baseUrl = env.BASE_URL || 'https://griddowndata.com';
    const downloadPageUrl = `${baseUrl}/thank-you.html?session_id=${encodeURIComponent(order.orderId)}&product=os-pack`;
    const fromEmail = env.FROM_EMAIL || 'orders@griddowndata.com';

    const linkLines = files.map((f) => `- ${f.label}: ${f.url}`).join('\n');
    const body =
      `Thanks for your order.\n\n` +
      `Your OS Pack is a large bundle (multiple files, ~86GB total), so it's delivered as direct download ` +
      `links below instead of an email attachment. Each link works on its own — download them one at a time, ` +
      `and if one is interrupted you only need to retry that file, not the whole bundle.\n\n` +
      `These links expire in 48 hours. You can also revisit your download page any time before then:\n` +
      `${downloadPageUrl}\n\n` +
      `${linkLines}\n\n` +
      `Save everything somewhere safe — once downloaded it all works with no internet.\n\n` +
      `— GridDownData`;

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: order.customer_email }] }],
        from: { email: fromEmail, name: 'GridDownData' },
        subject: 'Your GridDownData OS Pack downloads are ready',
        content: [{ type: 'text/plain', value: body }],
      }),
    });
    if (!res.ok) {
      console.warn('OS Pack delivery email failed:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Failed to deliver OS Pack:', err);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({ error: 'Stripe secret key not configured.' }, 500);
  }
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return jsonResponse({ error: 'Stripe webhook secret not configured.' }, 500);
  }

  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');
  const stripe = getStripe(env);

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return jsonResponse({ error: 'Invalid signature.' }, 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Pull line items so we know exactly what was purchased.
    let items = [];
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
      items = lineItems.data.map((i) => ({
        name: i.description,
        amount: i.amount_total,
      }));
    } catch (err) {
      console.error('Failed to list line items:', err);
    }

    const order = {
      orderId: session.id,
      status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email || null,
      customer_name: session.customer_details?.name || null,
      shipping: session.shipping_details?.address || session.customer_details?.shipping?.address || null,
      product: session.metadata?.product || null,
      items,
      created: new Date(session.created * 1000).toISOString(),
    };

    if (env.ORDER_WEBHOOK_URL) {
      await notifyWebhook(order, env.ORDER_WEBHOOK_URL);
    }
    await notifyEmail(order, env);        // admin notification
    await deliverDigitalProduct(order, env); // customer PDF delivery (diy-guide)
    await deliverOsPack(order, env);         // customer download links (os-pack)
  }

  return jsonResponse({ received: true });
}
