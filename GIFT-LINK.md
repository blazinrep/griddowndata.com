# Gift / free-copy link

Hand this out to give someone the Grid-Down Data Blueprint for free:

    https://griddowndata.com/gift

It opens a Blueprint checkout with the **GDB-GIFT** 100%-off code already applied.
The recipient just enters their email — no code to type — and gets the
watermarked PDF (stamped with their email + order id).

## Details
- Code: **GDB-GIFT** — 100% off, Blueprint only, capped at **25 redemptions**, no expiry.
- The cap and code are managed in Stripe → Product catalog → Coupons → "GridDownData Gift".
- Raise the cap or read usage (e.g. 7/25) there anytime.
- The long form of the link is `https://griddowndata.com/api/checkout?product=diy-guide&promo=GDB-GIFT`;
  `/gift` is just a friendly alias for it (see `_redirects`).

## If the code is used up or removed
The link still works — it falls back to a normal Blueprint checkout where the
buyer can pay $24 or enter another valid code. It never dead-ends.

## Making more codes
Create another coupon in Stripe with its own customer-facing code, then share
`https://griddowndata.com/api/checkout?product=diy-guide&promo=YOUR-CODE`.
