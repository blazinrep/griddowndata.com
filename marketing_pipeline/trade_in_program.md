# Vault Trade-In & Refurbish Program

A structured trade-in program that accepts gently used GridDownData USB drives, inspects them, re-flashes the current vault image, and re-markets them at a lower price point. Keeps hardware out of drawers, extends customer lifetime value, and captures budget-conscious buyers.

---

## Program Overview

**Purpose:** Recover used drives, refurbish them to factory spec, and resell them at a margin that protects profitability.

**Target participants:**
- Existing customers upgrading to a newer vault edition.
- Customers who no longer need their drive.
- Buyers who want a guaranteed-working used drive at a discount.

**Customer-facing promise:**
> "Trade in your old GridDownData drive. We'll inspect it, load the latest vault, and certify it — then give you credit toward your next purchase or a cash payout."

---

## Pricing & Margin Math

**Assumptions (fill with actual numbers):**

| Line item | New drive | Trade-in refurb |
|---|---|---|
| Retail price | `$X.00` | `$Y.00` (e.g., 65% of new) |
| Trade-in credit paid to customer | — | `$Z.00` |
| Refurb labor cost | — | `$A.00` |
| Packaging / media cost | `$B.00` | `$B.00` (if reusing) |
| Effective gross margin | `New price - B` | `Y - Z - A - B` |

**Minimum viable rule:** Refurb gross margin must be at least 50% of new-drive margin, or the unit should be recycled for parts instead of resold.

**Break-even formula:**
```
Refurb resale price >= Trade-in credit + Labor cost + Packaging cost
```

---

## Inspection Workflow

### Step 1 — Receive the drive
- Verify return authorization or trade-in code.
- Photograph physical condition on arrival.
- Log serial number or batch identifier.

### Step 2 — Physical inspection
- Check USB connector for damage or corrosion.
- Test housing integrity (cracks, heat damage, water exposure).
- Verify write-protect switch or security seal if present.
- Grade condition: **A** (like new), **B** (minor wear), **C** (significant wear, recycle only).

### Step 3 — Functional testing
- Read full capacity and confirm no bad sectors.
- Check read/write speed against spec minimum.
- Scan for malware or tampered files.

### Step 4 — Decision tree
- **Grade A or B + functional:** Proceed to re-flash.
- **Grade C or non-functional:** Reject trade-in or recycle. Offer small recycling credit only.

---

## Re-Flash Process

1. **Wipe** the drive with a verified secure format.
2. **Verify** capacity again after wipe.
3. **Write** the latest master vault image to the drive.
4. **Spot-check** a random sample of files for integrity.
5. **Apply** a certified-refurbished label or sticker.
6. **Package** with a current quick-start insert.

**Quality gate:** If any file hash does not match the master image, the drive is rejected.

---

## Re-Marketing Channels

- **Storefront:** Add a "Certified Refurbished" SKU next to the new drive.
- **Email:** Target past customers who have not purchased in 12+ months.
- **Blog/Content:** "How we refurbish a used GridDownData drive" transparency post.
- **Trade-in landing page:** Dedicated page explaining credit math and process.
- **Bundle offers:** Pair refurbished drive with a gear item from `gear_highlights.md`.

---

## Customer-Facing Terms (Draft)

- Trade-in credit is issued after inspection and functional testing.
- Refurbished drives carry a 90-day limited warranty.
- Cosmetic wear is acceptable; structural or functional damage voids resale value.
- Original digital-download purchases are not eligible for physical trade-in.

---

## Operational Metrics to Track

- Trade-in conversion rate (% of offers accepted)
- Average refurb gross margin per unit
- Percentage of drives rejected at inspection
- Customer satisfaction score on refurbished units
- Time from receipt back to resale-ready inventory

---

## Open Decisions

- [ ] Final trade-in credit amount
- [ ] Resale discount percentage
- [ ] Whether to offer cash payout or store credit only
- [ ] Shipping responsibility for inbound trade-ins
- [ ] Warranty length for refurbished drives
- [ ] Branding for certified-refurbished packaging
