import { AwsClient } from 'aws4fetch';

// Generates a time-limited, direct-to-R2 download URL using R2's S3-compatible
// API. This is the ONLY correct way to hand a customer a multi-gigabyte file:
// the bytes never pass through the Worker (which has a memory ceiling nowhere
// close to 86GB), the browser streams straight from R2's edge, and R2 has zero
// egress fees so large downloads don't rack up a surprise bill.
//
// Requires four Pages environment variables/secrets (separate from the
// PDF_BUCKET binding used for the small watermarked PDF):
//   R2_ACCOUNT_ID        - Cloudflare account id
//   R2_ACCESS_KEY_ID     - from an R2 API token (Account Home > R2 > Manage R2 API Tokens)
//   R2_SECRET_ACCESS_KEY - paired secret for that token
//   R2_BUCKET_NAME       - the bucket the OS Pack files live in (can be the
//                          same bucket as PDF_BUCKET, just referenced by name
//                          here instead of by binding)
//
// The R2 API token should be scoped to Object Read only, on this one bucket.
export function r2Configured(env) {
  return Boolean(
    env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME
  );
}

// `expiresInSeconds` defaults to 48 hours — an 86GB bundle takes a long time
// on typical home upload/download speeds, and split into per-file links,
// each individual file still needs a generous window in case of a slow or
// interrupted connection.
export async function presignR2Get(env, key, { expiresInSeconds = 172800, filename } = {}) {
  if (!r2Configured(env)) {
    throw new Error('R2 presigning is not configured (missing R2_* environment variables).');
  }
  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    region: 'auto',
    service: 's3',
  });

  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${encodeURIComponent(key).replace(/%2F/g, '/')}`
  );
  url.searchParams.set('X-Amz-Expires', String(expiresInSeconds));
  if (filename) {
    // Forces a sensible filename on save instead of the raw R2 key.
    url.searchParams.set('response-content-disposition', `attachment; filename="${filename}"`);
  }

  const signed = await client.sign(url, { method: 'GET', aws: { signQuery: true } });
  return signed.url.toString();
}
