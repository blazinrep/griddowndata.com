// TEMPORARY PAUSE — OsmAnd content licensing review (2026-11-20).
//
// OsmAnd has confirmed that commercial redistribution of its prebuilt map
// files requires a written licensing agreement, which is currently being
// negotiated. Until that agreement is in place, the Emergency OS Pack
// ($49) — which redistributes the prebuilt maps as `os-pack/Offline-Maps-
// USA.zip` — must not be sold and no new OS Pack download links may be
// generated. The Complete Kit / Vault Drive ($129 physical, Stripe price
// STRIPE_PRICE_KIT) advertises the same pre-loaded library, including
// "All 50 states + DC offline maps", so its checkout is blocked too until
// licensing is resolved — even though its buy button is currently disabled
// ("Coming soon"), the checkout API itself must refuse it.
//
// This module is the single switch for the pause. It is referenced by:
//   - functions/api/checkout.js        (blocks new OS Pack AND Complete Kit
//                                        checkout sessions, POST and GET)
//   - functions/api/os-pack-links.js   (blocks new OS Pack download links)
//   - functions/api/webhook.js         (blocks OS Pack email fulfillment)
// The $24 Blueprint (diy-guide) and its fulfillment are NOT affected.
//
// TO RE-ENABLE: set OS_PACK_PAUSED and KIT_PAUSED to false and restore the
// purchase button in index.html (search for "OS_PACK_PAUSED" / "Temporarily
// unavailable"). Do NOT re-enable the kit on its own while the OS Pack
// maps are still restricted — the kit ships the same files. No R2 objects,
// Stripe records, or customer records were touched by this pause — nothing
// needs to be recreated.
export const OS_PACK_PAUSED = true;

// Complete Kit / Vault Drive checkout block — same licensing review as the
// OS Pack (see above). The kit has no working buy button today, so this is
// defense-in-depth at the API layer: a direct POST/GET to /api/checkout
// with product=complete-kit (or with no product, which defaults to the kit)
// must not create a Stripe session.
export const KIT_PAUSED = true;

// Exact user-facing wording (button + API errors). Keep in sync with the
// disabled purchase button in index.html.
export const OS_PACK_PAUSE_MESSAGE =
  'Temporarily unavailable — content licensing review in progress.';

// User-facing wording for a blocked Complete Kit checkout. Same licensing
// review as the OS Pack — the kit ships the same prebuilt map files.
export const KIT_PAUSE_MESSAGE =
  'The Complete Kit (Vault Drive) is temporarily unavailable — content licensing review in progress.';

// Fuller message for the download-links endpoint, for buyers who already
// paid: their order is on file and links will be emailed once the review
// is complete.
export const OS_PACK_LINKS_PAUSED_MESSAGE =
  OS_PACK_PAUSE_MESSAGE +
  ' If you already paid for the OS Pack, your order is on file — your download links will be emailed to you once the review is complete.';
