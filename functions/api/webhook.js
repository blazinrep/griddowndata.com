import { getStripe } from './_shared/stripe.js';

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
    await notifyEmail(order, env);
  }

  return jsonResponse({ received: true });
}
