// POST /api/submit-field-report — GridDownData Field Reports submissions.
//
// Receives a reader's firsthand preparedness story or tip from the form on
// /share-your-story/ and emails it to the site admin via SendGrid, using the
// same pattern as functions/api/webhook.js (same endpoint, same auth header,
// same from-address fallback, admin address from env.ALERT_EMAIL).
//
// The submission is processed through our email provider (SendGrid) and
// retained in our private inbox. The website and this function store
// nothing in a database (no R2, no KV, no database), and nothing is
// published automatically — a human reads the email and decides what, if
// anything, goes on the site. Contributor content is never rendered back
// to any visitor.
//
// The form normally submits JSON via fetch. If JavaScript is unavailable,
// the form posts as application/x-www-form-urlencoded to this same
// endpoint (the form declares method="post" — there is no GET submission
// path), which parses it, validates it the same way, and answers with a
// plain confirmation page instead of JSON.

const MAX_BODY_BYTES = 32768;

// Abuse protection with no new infrastructure: submissions that arrive
// implausibly fast after the page was rendered look automated. The page
// records its render time in a hidden field; the no-JS path sends no
// timestamp, so a missing timestamp is allowed through. This only catches
// naive bots — a bot that waits, or that omits the field, passes it.
// There is no durable per-IP rate limiting without a store; if abuse
// appears, Cloudflare rate limiting or Turnstile is the next step.
const MIN_SUBMIT_MS = 3000;
const MAX_FUTURE_SKEW_MS = 60000;

const LIMITS = {
  name: 100,
  email: 254,
  location: 100,
  background: 200,
  bioLink: 200,
  title: 200,
  storyMin: 50,
  storyMax: 10000,
};

const CONFIRMATIONS = ['original', 'noFabrication', 'permission', 'age'];

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Minimal confirmation/error page for the no-JS (urlencoded) path. Messages
// are our own static strings — contributor content is never echoed back.
function htmlResponse(title, heading, paragraphs, status = 200) {
  const body = paragraphs.map((p) => `<p>${p}</p>`).join('\n');
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">` +
      `<meta name="viewport" content="width=device-width, initial-scale=1.0">` +
      `<title>${title} — GridDownData Field Reports</title>` +
      `<style>body{background:#1A1F1B;color:#E7E9E5;font-family:"Helvetica Neue",Arial,sans-serif;line-height:1.6;margin:0}.wrap{max-width:640px;margin:0 auto;padding:48px 24px}a{color:#D35400}</style>` +
      `</head><body><main class="wrap"><h1>${heading}</h1>\n${body}\n` +
      `<p><a href="/share-your-story/">Back to the Field Reports form</a> · <a href="/">GridDownData home</a></p>` +
      `</main></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
  // Deliberately simple: a usable address shape, not a full RFC check.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

// Optional field: absent, null, or empty is fine; if present it must be a
// string within its cap. A wrong type (number, array, object) is rejected,
// not silently ignored.
function validateOptionalString(data, field, max, errors, label) {
  const value = data[field];
  if (value === undefined || value === null || value === '') return;
  if (typeof value !== 'string') {
    errors[field] = `${label} must be text.`;
    return;
  }
  if (value.trim().length > max) {
    errors[field] = `${label} must be ${max} characters or fewer.`;
  }
}

// Returns an array of generic, field-level problems (messages name the field
// but never echo contributor content back).
function validateSubmission(data) {
  const errors = {};

  if (!isNonEmptyString(data.name)) {
    errors.name = 'Name or pen name is required.';
  } else if (data.name.trim().length > LIMITS.name) {
    errors.name = `Name or pen name must be ${LIMITS.name} characters or fewer.`;
  }

  if (!isNonEmptyString(data.email)) {
    errors.email = 'Email is required.';
  } else if (data.email.trim().length > LIMITS.email || !isValidEmail(data.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  validateOptionalString(data, 'location', LIMITS.location, errors, 'Location');
  validateOptionalString(data, 'background', LIMITS.background, errors, 'Background');

  if (data.bioLink !== undefined && data.bioLink !== null && data.bioLink !== '') {
    if (typeof data.bioLink !== 'string') {
      errors.bioLink = 'Bio link must be text.';
    } else if (data.bioLink.trim().length > LIMITS.bioLink || !isValidUrl(data.bioLink.trim())) {
      errors.bioLink = 'Bio link must be a valid website address (https://…).';
    }
  }

  if (!isNonEmptyString(data.title)) {
    errors.title = 'Title is required.';
  } else if (data.title.trim().length > LIMITS.title) {
    errors.title = `Title must be ${LIMITS.title} characters or fewer.`;
  }

  if (!isNonEmptyString(data.story)) {
    errors.story = 'Your story or tip is required.';
  } else if (data.story.trim().length < LIMITS.storyMin) {
    errors.story = `Tell us a little more — at least ${LIMITS.storyMin} characters.`;
  } else if (data.story.trim().length > LIMITS.storyMax) {
    errors.story = `Please keep it to ${LIMITS.storyMax} characters or fewer.`;
  }

  // All four confirmations are required.
  if (data.original !== true) {
    errors.original = 'Please confirm this is your original work based on your own firsthand experience.';
  }
  if (data.noFabrication !== true) {
    errors.noFabrication = 'Please confirm nothing here is fabricated and this was not AI-generated.';
  }
  if (data.permission !== true) {
    errors.permission = 'Please confirm the publishing permission described on the page.';
  }
  if (data.age !== true) {
    errors.age = 'Please confirm you are 18 or older, or that a parent or guardian is submitting for you.';
  }

  return errors;
}

// Returns an error string, or null. A missing timestamp (no-JS path, or an
// old cached page) is allowed through — the check only catches submissions
// that claim to have been rendered implausibly recently.
function checkTiming(data) {
  const ts = data.formRenderedAt;
  if (ts === undefined || ts === null) return null;
  if (typeof ts !== 'number' || !Number.isFinite(ts)) {
    return 'Submission could not be verified. Please try again.';
  }
  const elapsed = Date.now() - ts;
  if (elapsed < 0 && -elapsed > MAX_FUTURE_SKEW_MS) {
    return 'Submission could not be verified. Please try again.';
  }
  if (elapsed >= 0 && elapsed < MIN_SUBMIT_MS) {
    return 'Submission was sent too quickly to have been filled in by hand. Please take a moment and try again.';
  }
  return null;
}

// Parse the body according to its Content-Type. Returns { data, format }
// where format is 'json' (fetch path) or 'html' (no-JS form post), or null
// for an unsupported or unreadable body.
function parseBody(rawBody, contentType) {
  if (contentType.includes('application/json')) {
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return { data, format: 'json' };
  }
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(rawBody);
    const data = {};
    for (const [key, value] of params) data[key] = value;
    return { data, format: 'html' };
  }
  return null;
}

// Normalize the two submission shapes into one: native form posts send
// checked checkboxes as the string "on" and the timestamp as a string;
// the fetch path sends booleans and a number.
function normalizeSubmission(data) {
  for (const field of CONFIRMATIONS) {
    if (data[field] === 'on' || data[field] === 'true') data[field] = true;
  }
  if (data.formRenderedAt !== undefined && data.formRenderedAt !== null && data.formRenderedAt !== '') {
    const asNumber = Number(data.formRenderedAt);
    // Keep a non-numeric value as-is so validation rejects it.
    data.formRenderedAt = Number.isFinite(asNumber) ? asNumber : data.formRenderedAt;
  } else {
    delete data.formRenderedAt;
  }
  return data;
}

function formatEmailBody(data) {
  const lines = [
    'New GridDownData Field Report submission',
    '',
    `Name: ${data.name.trim()}`,
    `Email: ${data.email.trim()}`,
    `Location: ${data.location && data.location.trim() ? data.location.trim() : 'Not provided'}`,
    `Background: ${data.background && data.background.trim() ? data.background.trim() : 'Not provided'}`,
    `Bio link: ${data.bioLink && data.bioLink.trim() ? data.bioLink.trim() : 'Not provided'}`,
    '',
    `Title: ${data.title.trim()}`,
    '',
    'Story / tip:',
    data.story.trim(),
    '',
    'Confirmations: original firsthand work; no fabricated experiences; no AI-generated submission; publishing permission granted; 18+ (or parent/guardian submitting).',
    '',
    '---',
    'This submission was sent from the Field Reports form at /share-your-story/.',
    'Nothing has been published. Reply to this email to contact the contributor.',
  ];
  return lines.join('\n');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const contentType = request.headers.get('Content-Type') || '';

  // Lightweight abuse guard with no new infrastructure: refuse obviously
  // oversized bodies before parsing (measured in bytes, not characters).
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Submission is too large.' }, 413);
  }

  const parsed = parseBody(rawBody, contentType);
  if (!parsed) {
    return jsonResponse({ error: 'Submission could not be read. Please try again.' }, 400);
  }
  const { data, format } = parsed;
  normalizeSubmission(data);

  const respondError = (message, status) =>
    format === 'html'
      ? htmlResponse('Could not send', 'Could not send your Field Report', [message], status)
      : jsonResponse({ error: message }, status);

  // Honeypot: the form includes a field real visitors never see or fill.
  // Any non-empty value — any type — means a bot: reject without saying why.
  if (data.website !== undefined && data.website !== null && data.website !== '') {
    return respondError('Submission could not be accepted.', 400);
  }

  // Implausibly fast submission (see MIN_SUBMIT_MS note above).
  const timingError = checkTiming(data);
  if (timingError) {
    return respondError(timingError, 400);
  }

  const errors = validateSubmission(data);
  if (Object.keys(errors).length > 0) {
    if (format === 'html') {
      const items = Object.values(errors).map((message) => message);
      return htmlResponse(
        'Please fix and resend',
        'Please fix and resend',
        ['Please fix the following and try again:', ...items],
        400,
      );
    }
    return jsonResponse({ error: 'Please fix the highlighted fields.', errors }, 400);
  }

  // Email is the only delivery channel. If it is not configured, fail
  // closed with a generic message — never say which setting is missing.
  if (!env.SENDGRID_API_KEY || !env.ALERT_EMAIL) {
    return respondError('Submissions are temporarily unavailable. Please try again later.', 503);
  }

  const fromEmail = env.FROM_EMAIL || 'orders@griddowndata.com';
  const subject = `New Field Report submission: ${data.title.trim()}`;

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: env.ALERT_EMAIL }] }],
        from: { email: fromEmail },
        reply_to: { email: data.email.trim() },
        subject,
        content: [{ type: 'text/plain', value: formatEmailBody(data) }],
      }),
    });
    if (!res.ok) {
      console.error('Field Report email failed:', res.status, await res.text());
      return respondError('We could not send your submission right now. Please try again later.', 502);
    }
  } catch (err) {
    console.error('Field Report email failed:', err);
    return respondError('We could not send your submission right now. Please try again later.', 502);
  }

  // Delivered by email to the private inbox; stored in no database and
  // published nowhere — the email is the whole handoff.
  if (format === 'html') {
    return htmlResponse('Thank you', 'Thank you — your Field Report was sent', [
      'We read every submission. If yours is selected, we will email you before anything publishes.',
    ]);
  }
  return jsonResponse({ received: true });
}

// Any non-POST method: this endpoint only accepts submissions.
export async function onRequest() {
  return jsonResponse({ error: 'Method not allowed.' }, 405);
}
