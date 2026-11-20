// POST /api/submit-field-report — GridDownData Field Reports submissions.
//
// Receives a reader's firsthand preparedness story or tip from the form on
// /share-your-story/ and emails it to the site admin via SendGrid, using the
// same pattern as functions/api/webhook.js (same endpoint, same auth header,
// same from-address fallback, admin address from env.ALERT_EMAIL).
//
// Nothing is stored anywhere (no R2, no KV, no database) and nothing is
// published automatically — a human reads the email and decides what, if
// anything, goes on the site. Contributor content is never rendered back
// to any visitor. JSON responses only.

const MAX_BODY_BYTES = 32768;

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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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

  if (typeof data.location === 'string' && data.location.trim().length > LIMITS.location) {
    errors.location = `Location must be ${LIMITS.location} characters or fewer.`;
  }

  if (typeof data.background === 'string' && data.background.trim().length > LIMITS.background) {
    errors.background = `Background must be ${LIMITS.background} characters or fewer.`;
  }

  if (typeof data.bioLink === 'string' && data.bioLink.trim().length > 0) {
    if (data.bioLink.trim().length > LIMITS.bioLink || !isValidUrl(data.bioLink.trim())) {
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

  // Lightweight abuse guard with no new infrastructure: refuse obviously
  // oversized bodies before parsing.
  const rawBody = await request.text();
  if (rawBody.length > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'Submission is too large.' }, 413);
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: 'Submission could not be read. Please try again.' }, 400);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return jsonResponse({ error: 'Submission could not be read. Please try again.' }, 400);
  }

  // Honeypot: the form includes a field real visitors never see or fill.
  // A filled value means a bot — reject without saying why.
  if (typeof data.website === 'string' && data.website.trim() !== '') {
    return jsonResponse({ error: 'Submission could not be accepted.' }, 400);
  }

  const errors = validateSubmission(data);
  if (Object.keys(errors).length > 0) {
    return jsonResponse({ error: 'Please fix the highlighted fields.', errors }, 400);
  }

  // Email is the only delivery channel. If it is not configured, fail
  // closed with a generic message — never say which setting is missing.
  if (!env.SENDGRID_API_KEY || !env.ALERT_EMAIL) {
    return jsonResponse({ error: 'Submissions are temporarily unavailable. Please try again later.' }, 503);
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
      return jsonResponse({ error: 'We could not send your submission right now. Please try again later.' }, 502);
    }
  } catch (err) {
    console.error('Field Report email failed:', err);
    return jsonResponse({ error: 'We could not send your submission right now. Please try again later.' }, 502);
  }

  // Stored nowhere, published nowhere — the email is the whole handoff.
  return jsonResponse({ received: true });
}

// Any non-POST method: this endpoint only accepts submissions.
export async function onRequest() {
  return jsonResponse({ error: 'Method not allowed.' }, 405);
}
