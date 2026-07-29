// Central registry of products delivered as digital downloads.
// Each maps the Stripe `product` metadata value to its object key in the
// PRIVATE R2 bucket (bound to Functions as env.PDF_BUCKET) and the filename
// the buyer should receive.
export const DIGITAL_PRODUCTS = {
  'diy-guide': {
    key: 'GridDown-Data-Blueprint.pdf',
    filename: 'GridDown-Data-Blueprint.pdf',
  },
};

// Base64-encode an ArrayBuffer for SendGrid attachments, chunked so a large
// file does not overflow the call stack when spread into String.fromCharCode.
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
