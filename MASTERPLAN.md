# GRIDDOWNDATA — MASTER PLAN
**The single source of truth for everything built, where it lives, how it fits together, and what comes next.**

Doc owner: Chad (Editor-in-Chief) · Maintained with every major work session · Last updated: 2026-07-19

---

## 1. THE ECOSYSTEM AT A GLANCE

Every piece belongs to one branded family (naming is locked — see Operating Blueprint):

| Component | What it is | Canonical file(s) | Status |
|---|---|---|---|
| **Operating Blueprint** | Founding philosophy — 19 sections, Six Laws, Prepare·Respond·Recover | `GridDown-Operating-Blueprint.pdf` (14 pp, dark theme) | ✅ Locked Ed 1.0 |
| **Field Manual** | Physical-product manual, §0–§7 + drills, no DIY appendix | `GridDown-Field-Manual.pdf` (21 pp) | ✅ Locked Ed 1.0 |
| **Data Blueprint** | Digital Tier-1 product = Field Manual + §8 DIY Vault Build + digital-tier routing callout | `GridDown-Data-Blueprint.pdf` (25 pp) | ✅ §8 refreshed 2026-07-20 |
| **Emergency OS** | Offline dashboard v3 — situation assessment, timeline, NEXT ACTION engine, mission control, calculators, adaptive categories, activation workflow, universal search | `START_HERE.html` (single file, zero deps) | ✅ v3 shipped |
| **Personal Vault** | Local AES-256-GCM encryption app, protocol GDDV-1, paper recovery card | `vault.html` (single file, zero deps) | ✅ v1 shipped, 11/11 tests pass |
| **Knowledge Vault** | Official ZIM set (locked 2026-07-20): WikiMed medical, Ready.gov, iFixit, full Wikipedia no-pic, Wikibooks (~62.5 GB) + all-50-states OsmAnd maps (~18 GB) + checklists | Drive directories 01–03 | 🔶 ZIMs staged; maps via `build/download-us-maps.sh`; 2 Android APKs pending |
| **Readiness Program** | Quarterly/semi-annual/annual maintenance + drills 01–06 | Field Manual §7 + checklists | ✅ Doctrine written |
| **Website** | griddowndata.com (Cloudflare Pages + Stripe checkout functions) | `index.html`, subpages, `functions/api/*` | ✅ Live, logo audit done |
| **The Connected Family** | YouTube channel brand (warm consumer funnel → GridDownData) | `TCF-*.png` (icon, banner, brand guide) | ✅ Concept 1 delivered |

**Brand design system (all tactical assets):** slate `#1A2128` / panel `#222B33` / line `#3A4650` · orange `#FF5C1F` (+`#FF9A6B` soft) · ink `#E8ECEF` · fonts: Noto Sans (headings/body), Ubuntu Mono (data/labels), master logo `assets/images/grid-down-logo.png`.
**TCF consumer palette:** cream `#F7F1E6` · Ember Clay `#D97B54` (bridge accent to brand orange) · Soft Sage `#A9B694` · Warm Char `#3E362C` · fonts: Lora + Nunito.

---

## 2. WHERE EVERYTHING LIVES RIGHT NOW (STAGING MAP)

✅ **2026-07-20: all deliverables organized in `~/Downloads/GridDownData-MASTER/`** — one labeled folder, `00_START-HERE_read-me-first.txt` maps it all: `01_PRODUCTS_to_sell/` (Build Guide PDF, OS Pack zip, manuals) · `02_Drive_Image_full/` (Build Sheet + pointer to the ~80 GB `GRIDDOWN_DRIVE/`) · `03_Build_Tools/` (maps script) · `04_Brand_and_Channel/` (logos + TCF) · `05_Internal_Docs/`. Tier-2 OS Pack zip assembled = drive tree minus free bulk (.zim/.obf/.apk) + 3 PDFs + buyer INSTALL readme.

⚠️ Binary deliverables live in `~/Downloads`; text/code (this file, scripts, HTML, checkout.js) lives in this repo.

### In `~/Downloads` awaiting placement
| File | Move to |
|---|---|
| `GridDown-Operating-Blueprint.pdf` | `assets/downloads/` (repo) |
| `GridDown-Field-Manual.pdf` | `assets/downloads/` (repo) + print vendor |
| `GridDown-Data-Blueprint.pdf` | `assets/downloads/` (repo) + drive `00_README_and_Blueprint/` |
| `START_HERE.html` (v3 = Emergency OS) | drive root `00_README_and_Blueprint/` **and** repo (replaces old START_HERE.html after review) |
| `vault.html` | drive `04_Personal_Vault/` + repo copy |
| `TCF-*.png` (4 files) | YouTube channel settings + `marketing_pipeline/tcf-brand/` |
| `START_HERE_v2.html`, `START_HERE_v3.html`, `grid-down-logo.png.jpg` | **Delete** — superseded |

One-liner to stage the repo side:
```bash
cd ~/Documents/GitHub/griddowndata.com && mkdir -p assets/downloads marketing_pipeline/tcf-brand && \
cp ~/Downloads/GridDown-*.pdf assets/downloads/ && cp ~/Downloads/vault.html . && \
cp ~/Downloads/TCF-*.png marketing_pipeline/tcf-brand/ && cp ~/Downloads/START_HERE.html .
```

### Repo top level (observed 2026-07-19)
`index.html` · `START_HERE.html` (old v1 — replace) · `thank-you.html` · `generate_pages.py` · subpages (`grid-down-food-storage/`, `offline-medical-reference/`, `off-grid-water-purification/`, `offline-navigation-suite/`) · `functions/api/` (Stripe checkout/webhook — Cloudflare) · `wrangler.toml` · `marketing_pipeline/` · `00_CORE_BLUEPRINT/emergency_checklist.pdf` (legacy — fold into drive structure or delete) · `assets/images/` (5 product photos + master logo)

### The USB drive image (locked directory contract)
```
GRIDDOWN DRIVE (root)
├── 00_README_and_Blueprint/     ← START_HERE.html, GridDown-Data-Blueprint.pdf, quick-reference/
├── 01_Kiwix_Offline_Wikis/      ← kiwix-reader/, wikimed.zim, reference.zim
├── 02_Custom_Survival_Checklists/ ← water/ medical/ food/ maintenance-logs/, 72-hour-checklist
├── 03_Offline_Maps/             ← apk/, regions/, elevation/, favorites-backup.gpx
└── 04_Personal_Vault/           ← vault.html, vault.keystore, *.gddv
```
**Rule: these five directory names are API.** The Emergency OS and manuals hard-reference them. Renaming any of them is a breaking change requiring dashboard + manual + manifest updates together.

---

## 3. INTEGRATION MAP (WHAT DEPENDS ON WHAT)

```
Operating Blueprint (doctrine)
   └─ governs → Field Manual / Data Blueprint (content locked to doctrine)
        └─ §8.3 tree + §1.1 manifest ──┐
Emergency OS (START_HERE.html) ────────┼── all reference the SAME directory contract
Personal Vault (vault.html) ───────────┘
Emergency OS problem tiles → leaf pages in 02_/03_/00_ (see GAP-1)
Emergency OS NEXT ACTION texts ← mirror Field Manual §2, §3, §6 doctrine (keep in sync on edits)
Calculators ← use Manual constants (4 L/day, 1500 kcal, 600 kcal…) — change in BOTH places or neither
PDFs embed → Fig 2-A (dashboard-mockup), Fig 4-A (osmand-setup) renders
Website "powered by" ← master logo asset path /assets/images/grid-down-logo.png (JSON-LD fixed 2026-07-18)
TCF channel → funnels to griddowndata.com; Ember Clay #D97B54 is the visual bridge
```

**Sync rule of thumb:** any edit that changes a *number, directory name, or procedure step* touches at minimum: (1) the Manual/Blueprint source HTML, (2) the Emergency OS data arrays, (3) this file's changelog.

---

## 4. KNOWN GAPS & DEBTS (THE HONEST LIST)

| ID | Gap | Impact | Fix |
|---|---|---|---|
| GAP-1 | ✅ **CLOSED 2026-07-19.** All 17 leaf pages generated from locked Manual content (water ×4, medical ×3, food ×2, quick-reference ×3, maps ×3, 72-hr checklist, maintenance log) + vault content templates (contacts, inventory, passwords README) + placeholder `favorites-backup.gpx`. Full reference drive tree assembled at `~/Downloads/GRIDDOWN_DRIVE/`; automated link audit: **every dashboard link and back-link resolves** (only expected misses: the two ZIM archives = GAP-2). Generator committed as `gen_leaf_pages.py` (session outputs). | — | Copy `GRIDDOWN_DRIVE/` contents to the master USB when assembling |
| GAP-2 | 🔶 **NEARLY CLOSED 2026-07-20.** ZIMs staged & locked (~62.5 GB, all 5): WikiMed `wikipedia_en_medicine_maxi_2026-04`, full Wikipedia no-pic `wikipedia_en_all_nopic_2026-06` (49 GB), Wikibooks `wikibooks_en_all_maxi_2026-04`, iFixit `ifixit_en_all_2025-12`, Ready.gov `www.ready.gov_en_2024-12` + macOS Kiwix reader `kiwix-macos_3.15.1.dmg`. **Maps DONE (running/complete):** `build/download-us-maps.sh` pulled all 85 OsmAnd `_2` files (~18.1 GB, all 50 states+DC) into `03_Offline_Maps/regions/` and unzipped. **APKs — official sources recorded for re-flash:** Kiwix Android **2.5.3** from `mirror.download.kiwix.org/release/kiwix-android/2.5.3/` — `kiwix-2.5.3_arm64-v8a.apk` (modern) + `kiwix-2.5.3_armeabi-v7a.apk` (older 32-bit) → `01_Kiwix_Offline_Wikis/kiwix-reader/`; OsmAnd Android from **F-Droid** `f-droid.org/en/packages/net.osmand.plus/` → `03_Offline_Maps/apk/`. **Still to do:** land the 3 APKs (Chrome blocks scripted APK downloads — user clicks them), run the APK-sort command. **Elevation/contour deliberately excluded** nationwide — future Regional Pack upsell. | Land 3 APKs, then GAP-2 fully closed | User clicks official APK links; sort command in chat |
| GAP-3 | Vault v2 items: QR on recovery card, Argon2id option, per-browser FSA quirks testing (Safari/Firefox real-device) | Nice-to-have hardening | Backlog |
| GAP-4 | `00_CORE_BLUEPRINT/emergency_checklist.pdf` in repo is legacy/orphaned | Confusion | Delete or migrate content into 02_ checklists |
| GAP-5 | Old `START_HERE.html` (v1) still in repo; v3 in Downloads | Version confusion | Replace on next commit |
| GAP-6 | PDF build pipeline lives in session scratch (source HTMLs + assembler script + Playwright env) | Can't rebuild PDFs without Claude session | Commit `build/` folder with source HTMLs + `build.py` (ask Claude to export) |
| GAP-7 | Website copy predates ecosystem naming (Emergency OS, Knowledge Vault, Readiness Program, Prepare·Respond·Recover) | Brand drift | Copy pass on index + subpages against Operating Blueprint §terms |
| GAP-8 | TCF channel: only static branding exists — no thumbnail templates, end-screen, or first-video plan | Channel can't launch | Next TCF work block |

---

## 5. INTEGRATION VERIFICATION PROTOCOL (RUN BEFORE ANY RELEASE)

Mirror of the Readiness Program, applied to the build itself. Run on a **cleanly assembled drive copy**, not the repo:

**A. Structure** — five directories present, spelled exactly as §2 above; no stray versioned files (`*_v2*`, `*-final*`).
**B. Emergency OS** — open `START_HERE.html` from the drive in Chrome, Firefox, Safari, and one Android phone: four/eight category tiles open; every problem link resolves (zero 404s = GAP-1 closed); situation chips reorder grid; NEXT ACTION changes with event+time and persists after browser restart; activation workflow reaches both HOLD and ACTIVATE verdicts; all 7 calculators compute.
**C. Personal Vault** — create vault → print preview of recovery card → encrypt a file → lock → unlock → decrypt → byte-identical; wrong passphrase rejected; recovery code rebuilds keystore on a second machine.
**D. Knowledge Vault** — one WikiMed article renders via Kiwix from the drive; one OsmAnd region loads with GPS lock outdoors.
**E. Documents** — all three PDFs open from `00_README_and_Blueprint/`; spot-check Fig 2-A/4-A pages and page-number footers.
**F. Website** — logo renders on all pages; JSON-LD logo URL 200s in production; checkout test-mode transaction completes.
**G. Cross-checks** — drive manifest table (Manual §1.1) matches actual directories; §8.3 tree matches actual tree; Emergency OS paths match both.

Log every run: date, machine/browser matrix, failures, fixes — `02_Custom_Survival_Checklists/maintenance-logs/build-verification.md`.

---

## 6. ROADMAP

### Now (unblock product assembly)
1. Execute staging map (§2) + delete superseded files → repo and drive reflect canonical set.
2. **Close GAP-1**: generate all leaf pages from locked manual content.
3. Assemble reference drive; run full §5 verification; fix what breaks.
4. Commit PDF build pipeline to repo (GAP-6).

### Next (sellable v1.0)
5. Stage Knowledge Vault content per Data Blueprint §8.2; re-verify.
6. Website copy pass to ecosystem naming (GAP-7); add `assets/downloads/` product delivery for Tier-1 digital purchase (Stripe webhook → link).
7. Print vendor proof of Field Manual; verify dark theme printability (ink coverage!) — **decision pending: print edition may need the light theme variant**.
8. Readiness Program calendar file + email/print reminders content.

### Later (per Operating Blueprint §18 — the four horizons)
- **Deepen guidance:** medical triage, water treatment, shelter decision guided workflows in the Emergency OS.
- **Harden the Vault:** Argon2id, QR recovery, encrypted-container guidance for pros.
- **Localize:** regional packs (county maps/hazards/frequencies), languages.
- **Grow:** annual refresh subscription, RV/small-business/community editions, trainer partnerships, The Connected Family content engine (GAP-8).

### Never (fixed constraints — from the Six Laws)
No cloud dependency · no subscription lock on safety-critical content · no fear-based marketing · no feature that needs the internet to demo · no breaking the five-directory contract without a migration plan.

---

## 7. CHANGELOG (SESSION-LEVEL)

| Date | What locked |
|---|---|
| 2026-07-16 | Firefly product imagery; data-curation flowchart; manuscript §0–§2 |
| 2026-07-17 | Manuscript §3–§7 + back cover; de-jargon pass; dashboard + OsmAnd figures; logo extraction saga → superseded by master logo |
| 2026-07-18 | Tactical PDF engine; dark theme; §7.4 drills; §8 DIY appendix; two-product split (Field Manual / Data Blueprint); digital-tier callout; site logo audit + JSON-LD fix |
| 2026-07-19 | Emergency OS v2→v3 (situation/timeline/NEXT ACTION/mission control/calculators/vault panel); Operating Blueprint written+approved+PDF (dark); TCF channel branding concept 1; GDDV-1 vault spec + vault.html implementation (11/11 tests); this MASTERPLAN |
| 2026-07-19 (b) | GAP-1 closed: 17 leaf pages + vault templates generated; reference drive tree assembled in `~/Downloads/GRIDDOWN_DRIVE/`; automated link audit passed (0 real breaks; 2 expected GAP-2 ZIM misses) |
| 2026-07-20 | Content locked: all 5 ZIMs official (~62.5 GB); maps decided = all 50 states+DC; `build/download-us-maps.sh` written & run (85 files, ~18 GB); APK sources recorded (Kiwix 2.5.3 official mirror, OsmAnd via F-Droid). Nationwide 128 GB single-SKU confirmed (~82 GB content, ~40 GB free for Personal Vault). |
| 2026-07-20 (b) | Two-SKU strategy: Data Blueprint §8 refreshed into the complete/current DIY guide (4 pp: exact 5-ZIM table, maps + script pointer, F-Droid/Kiwix APK sources, exFAT format+reason, 5-dir tree w/ 04_Personal_Vault, verify checklist w/ Vault test, "buy it done" upsell). Blueprint now 25 pp; Field Manual unchanged at 21 pp (§8 stripped via robust regex). `build/download-us-maps.sh` + Drive Build Sheet (internal QA doc) added. |
| 2026-07-20 (c) | Storefront `#pricing` added to index.html. **Payments: HYBRID** — digital via Lemon Squeezy (merchant-of-record, auto-delivery), physical via Stripe (existing `/api/checkout`, collects US shipping). |
| 2026-07-20 (d) | **THREE-TIER LADDER decided** (the UI is the moat — free content can be downloaded, our software can't). **T1 Build Guide** (~$19, digital, Lemon Squeezy) = new lean 5-pg consumer PDF `GridDown-Build-Guide.pdf` (split from Blueprint §8; recipe only, no UI, upsells T2/T3). **T2 Emergency OS Pack** (~$49, digital, Lemon Squeezy) = the proprietary software as a drop-in download — `START_HERE.html` (Emergency OS v3) + `vault.html` + all leaf pages + Field Manual/Blueprint PDFs, as a `.zip`; includes the Build Guide. **T3 Vault Drive** (~$199, physical, Stripe) = everything done + hardware. Storefront rebuilt to 3 cards (OS Pack featured). **Prices are placeholder hypotheses to test.** **TODOs:** set prices; Stripe `STRIPE_PRICE_KIT`+`STRIPE_SECRET_KEY`; Lemon Squeezy — create 2 products (Build Guide → deliver GridDown-Build-Guide.pdf; OS Pack → deliver software .zip), paste both checkout URLs into index.html (`REPLACE-WITH-BUILD-GUIDE-ID`, `REPLACE-WITH-OS-PACK-ID`). **Still to assemble: the OS Pack .zip** (bundle the software files). |

---

*Maintenance rule for this file: update §2 staging map and §7 changelog every session; re-audit §4 gaps monthly. If this file and reality disagree, reality wins — then fix this file.*
