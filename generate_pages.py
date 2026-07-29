#!/usr/bin/env python3
"""
GridDownData — programmatic SEO page generator.

Spins up one keyword-targeted landing page per topic from the TOPICS list,
reusing the master template's theme, meta suite, and structured data.
Also writes a sitemap.xml that includes the homepage + every generated page.

Usage:
    python3 generate_pages.py
Output:
    ./site/index.html is expected to already exist (the master page).
    ./site/<slug>/index.html  (one per topic)
    ./site/sitemap.xml
"""

import os
import html
from datetime import date

BASE_URL = "https://griddowndata.com"
OUT_DIR = "site"
TODAY = date.today().isoformat()

# --- Brand theme (kept in sync with the master landing page) ---
CHARCOAL = "#1A1F1B"
ORANGE = "#D35400"

# --- Google Analytics 4 measurement ID (site-wide tracking) ---
GA_ID = "G-ZLH3SR1EZM"

# --- Programmatic topic set: each dict becomes its own indexed page. ---
# Add rows here to scale the site. Keep answers factual and specific.
TOPICS = [
    {
        "slug": "offline-medical-reference",
        "keyword": "Offline Medical Reference",
        "title": "Offline Medical Reference on USB | Emergency Care When No Doctor Is Coming",
        "h1": "The medical reference that works when 911 is a busy signal.",
        "intro": "When a clinic is 90 miles away and closed, you are the trauma team. GridDownData carries offline wound care, dosing, splinting, infection control, and emergency-care references on an air-gapped USB drive.",
        "answer": "An offline medical reference is a self-contained library of emergency medical guidance that works with no internet. GridDownData stores it on an air-gapped USB drive so wound care, dosing, splinting, and infection-control references are available during outages, in remote areas, or any time professional care is unavailable.",
        "faqs": [
            ("What is an offline medical reference?",
             "It is a complete medical guidance library stored locally on a device so it works without internet. GridDownData delivers one on an air-gapped USB drive covering wound care, dosing, splinting, and infection control."),
            ("Does it replace a doctor?",
             "No. It is a reference to help you act when no doctor is available. Something beats nothing, but it does not substitute for professional care when care can be reached."),
        ],
    },
    {
        "slug": "grid-down-food-storage",
        "keyword": "Grid-Down Food Storage",
        "title": "Grid-Down Food Storage Guide on USB | Canning, Cellars & Long-Term Stores",
        "h1": "Feeding your family for months is a skill set. Get it offline.",
        "intro": "Anyone can buy a bag of rice. GridDownData holds offline guides for canning safely, building root cellars, butchering clean, and rotating long-term food stores — all on an air-gapped drive.",
        "answer": "Grid-down food storage is the practice of growing, preserving, and rotating food so a household can eat for months without resupply. GridDownData provides offline guides for canning, root cellars, butchering, and long-term storage on an air-gapped USB drive that works with no power or internet.",
        "faqs": [
            ("How much food storage knowledge is included?",
             "GridDownData includes field-tested guides for gardening, canning, butchering, root-cellar construction, and long-term store rotation, all stored offline."),
            ("Does it work during a power outage?",
             "Yes. The drive is air-gapped and fully offline, so the guides are available even when the grid and cell networks are down."),
        ],
    },
    {
        "slug": "off-grid-water-purification",
        "keyword": "Off-Grid Water Purification",
        "title": "Off-Grid Water Purification Guide on USB | Safe Water Without the Grid",
        "h1": "Three days without water and the debate is over.",
        "intro": "GridDownData carries offline references for purifying questionable water, storing it safely, and sourcing it when the tap runs dry — on an air-gapped USB drive that needs no signal.",
        "answer": "Off-grid water purification covers the methods used to make questionable water safe to drink without municipal utilities — including filtration, boiling, chemical treatment, and safe storage. GridDownData stores these references offline on an air-gapped USB drive for use during outages or in remote areas.",
        "faqs": [
            ("What water purification methods are covered?",
             "Filtration, boiling, chemical treatment, and safe long-term storage, with practical field guidance for each."),
            ("Do I need internet to use it?",
             "No. All references are stored on the air-gapped drive and work fully offline."),
        ],
    },
    {
        "slug": "off-grid-solar-wiring",
        "keyword": "Off-Grid Solar Wiring",
        "title": "Off-Grid Solar Wiring Reference on USB | Panels, Charge Controllers & Battery Banks",
        "h1": "When the grid dies, your solar array is only as good as its wiring.",
        "intro": "Panels on the roof mean nothing if the charge controller is undersized, the wire gauge drops voltage, or the fuses are missing. GridDownData carries offline references for sizing conductors, wiring panels in series and parallel, matching charge controllers to battery banks, and protecting the whole system with correct overcurrent devices — stored on an air-gapped USB drive that keeps working after the power does.",
        "answer": "Off-grid solar wiring is the discipline of connecting panels, charge controllers, batteries, and inverters safely so a system produces usable power without utility service. It covers series-versus-parallel panel arrays, correct wire gauge to limit voltage drop over distance, DC fusing and breakers, and grounding. GridDownData stores these references on an air-gapped USB drive so they remain available during outages, off-grid, or any time you must build or repair a system without internet access.",
        "faqs": [
            ("How do I size wire for an off-grid solar run?",
             "Wire gauge depends on current, distance, and acceptable voltage drop. Longer DC runs at low voltage lose more energy, so heavier conductors keep the drop under a few percent. The offline reference includes gauge-versus-length tables and worked examples so you can size conductors correctly without an internet connection."),
            ("Should solar panels be wired in series or parallel?",
             "Series wiring raises voltage and suits longer runs and higher-voltage charge controllers, while parallel wiring keeps voltage low but raises current. Most real arrays combine both. The reference explains the trade-offs, shows how each affects charge-controller selection, and helps you match the array to your battery bank safely."),
            ("Why does DC solar wiring need fuses and breakers?",
             "Batteries can deliver enormous fault current, so unprotected wiring can overheat and start a fire. Correctly rated fuses and DC breakers on each conductor interrupt faults before damage occurs. The offline guide covers where to place overcurrent protection, how to size it to the wire, and common wiring mistakes that cause failures."),
            ("Does the reference cover inverters and battery banks?",
             "Yes. Beyond the array itself, it explains matching inverter capacity to your loads, sizing a battery bank for realistic daily use and depth of discharge, and wiring the two together through a charge controller. This lets you plan a complete system rather than just connecting panels in isolation."),
        ],
    },
    {
        "slug": "shtf-radio-communications",
        "keyword": "SHTF Radio Communications",
        "title": "SHTF Radio Communications Manual on USB | Ham, GMRS & CB When Cell Networks Fail",
        "h1": "When the towers go dark, radio is how your people stay connected.",
        "intro": "Cell phones and internet ride on infrastructure that fails early in a disaster. GridDownData carries an offline communications manual covering amateur (ham) radio bands, GMRS and CB options, antenna basics, frequency and channel planning, and simple monitoring schedules like the 3-3-3 plan — stored on an air-gapped USB drive so the reference is there even when every network you normally depend on is down.",
        "answer": "SHTF radio communications is the practice of staying in contact when cell and internet infrastructure fails, using amateur (ham), GMRS, CB, and shortwave radio instead. It covers choosing bands for local versus long-distance contact, basic antennas, channel and frequency planning, and monitoring schedules so a group can coordinate. GridDownData stores this manual on an air-gapped USB drive so it works during grid-down events, remote travel, or any time normal networks are unavailable.",
        "faqs": [
            ("Which radio is best for grid-down communication?",
             "It depends on range. CB and GMRS handle short local contact with minimal setup, while amateur (ham) HF bands can reach hundreds of miles without any infrastructure. The manual compares each option by range, cost, and licensing so you can match the right radio to your group's distances and terrain."),
            ("Do I need a license to use these radios?",
             "In the United States, amateur and GMRS use generally require an FCC license, while CB does not. The manual explains which services need licensing and encourages getting properly licensed so you know your equipment before an emergency. It also covers what monitoring you can lawfully do to gather information."),
            ("What is the 3-3-3 radio plan?",
             "The 3-3-3 plan is a simple schedule where group members power on their radios every three hours, listen and transmit for about three minutes, on a pre-agreed channel three. It conserves battery and keeps a group synchronized without constant monitoring. The manual details how to adapt it to your own frequencies and times."),
            ("How do I plan antennas and frequencies offline?",
             "The reference includes antenna basics, such as how height and length affect range, plus worksheets for recording your group's agreed frequencies, call signs, and check-in times. Because it lives on the air-gapped drive, you can build and rehearse a full communications plan without depending on any website or app."),
        ],
    },
    {
        "slug": "long-term-seed-storage",
        "keyword": "Long-Term Seed Storage",
        "title": "Long-Term Seed Storage Guide on USB | Heirloom Seed Saving for Years of Harvests",
        "h1": "A pantry runs out. A seed bank feeds you every season.",
        "intro": "Stored food eventually empties, but viable seed renews the harvest year after year. GridDownData carries an offline guide to long-term seed storage: selecting open-pollinated heirloom varieties, drying seed properly, sealing it in moisture-barrier packaging with desiccant, controlling temperature and humidity, and saving seed true-to-type from your own crops — all on an air-gapped USB drive that keeps working when the internet does not.",
        "answer": "Long-term seed storage is the practice of keeping garden seeds viable for years so a household can keep replanting without buying new stock. It centers on open-pollinated heirloom varieties, thorough drying, low humidity, cool stable temperatures, and airtight moisture-barrier packaging with desiccant. GridDownData stores this guide on an air-gapped USB drive so seed-saving and storage references are available during outages, on the homestead, or any time online resources cannot be reached.",
        "faqs": [
            ("How long do properly stored seeds stay viable?",
             "Under cool, dry, dark conditions many common vegetable seeds remain viable for roughly three to six years, and some, like tomatoes and squash, last longer. Heat and moisture shorten that dramatically. The guide covers expected lifespans by crop and how to test germination so you rotate stock before viability drops."),
            ("Why choose heirloom instead of hybrid seeds?",
             "Open-pollinated heirloom seeds breed true to type, so seed saved from this year's plants grows the same crop next season. Hybrid F1 seeds do not reliably reproduce their parent traits, which breaks the self-renewing cycle. The guide explains how to identify heirloom varieties and build a collection you can regrow indefinitely."),
            ("What is the best way to package seeds for storage?",
             "The enemies of seed are heat, light, and humidity. Seeds should be fully dry, then sealed in high-barrier Mylar or foil with a desiccant to hold down moisture, and kept cool and dark. The guide walks through drying, packaging, labeling, and where in the home to store your seed bank."),
            ("How do I save seed from my own harvest?",
             "Saving seed means selecting healthy open-pollinated plants, letting the seed mature fully, then cleaning and drying it before storage. Techniques differ for wet-seeded crops like tomatoes versus dry-seeded ones like beans. The guide details harvesting, fermenting or drying, and cleaning methods so each season replenishes your bank."),
        ],
    },
    {
        "slug": "emp-faraday-protection",
        "keyword": "EMP Faraday Cage Protection",
        "title": "EMP Faraday Cage Protection Guide on USB | Shield Electronics From a Pulse",
        "h1": "One pulse can end the electronic age. Your gear doesn't have to go with it.",
        "intro": "An electromagnetic pulse can destroy unprotected electronics in an instant, and by definition you cannot look up how to protect them afterward. GridDownData carries an offline guide to building and testing Faraday enclosures from common materials, deciding what gear to shield, and why grounding rules differ for EMP versus lightning — stored on an air-gapped USB drive that itself can live inside your Faraday cage.",
        "answer": "A Faraday cage is a conductive enclosure that blocks electromagnetic fields, protecting the electronics inside from an EMP. This guide explains building one from common items like a galvanized steel trash can, lining it so devices never touch bare metal, sealing seams for a continuous conductive shell, and testing it. GridDownData stores it on an air-gapped USB drive so the reference survives the very event it prepares you for.",
        "faqs": [
            ("How do I build a Faraday cage at home?",
             "A common approach uses a galvanized steel trash can with a tight-fitting metal lid as the conductive shell. The interior is lined with cardboard or cloth so devices never touch bare metal, and the lid-to-can seam is sealed for continuous contact. The guide details materials, layering, and assembly step by step."),
            ("Should a Faraday cage be grounded for EMP?",
             "For EMP protection the guide follows the common practice of not grounding the enclosure; an ungrounded cage redistributes and dissipates pulse energy around its exterior. Grounding is relevant to lightning, not EMP, and can even create a conduction path. The reference explains the distinction so you do not defeat your own protection."),
            ("How can I test whether my Faraday cage works?",
             "A simple field test is to seal a powered-on cell phone inside and call it from another phone. If it goes straight to voicemail with no ring, the enclosure is blocking those frequencies; if it rings, the seal has gaps. The guide covers this test and how to improve a leaky seal."),
            ("What electronics are worth protecting from an EMP?",
             "The guide suggests prioritizing hard-to-replace, high-value gear: two-way radios, spare solar charge controllers, LED lighting, medical devices, and a backup drive holding your offline references. It helps you build a small, sealed kit so that even after a pulse you retain communications, power control, and your knowledge library."),
        ],
    },
    {
        "slug": "off-grid-wood-heat",
        "keyword": "Off-Grid Wood Heat",
        "title": "Off-Grid Wood Heat Guide on USB | Staying Warm Through Winter Without the Grid",
        "h1": "Below freezing with no furnace, heat is not a comfort — it's survival.",
        "intro": "When the furnace has no power, staying warm becomes a planning problem you solve before winter, not during it. GridDownData carries an offline guide to heating without the grid: sizing a wood stove to your space, seasoning and estimating firewood, safe stovepipe and clearance practices, layered backup heat, and passive measures that hold warmth in — stored on an air-gapped USB drive that works in the cold and dark.",
        "answer": "Off-grid wood heat is the practice of keeping a home warm without electric or gas utilities, primarily using a wood-burning stove. It covers matching a stove's BTU output to square footage and insulation, seasoning firewood and estimating the cords needed, safe stovepipe routing and clearances, and combining a primary heater with a different-fuel backup. GridDownData stores this guide on an air-gapped USB drive so it is available during outages, at a remote cabin, or any winter emergency without internet.",
        "faqs": [
            ("How much firewood do I need for a winter?",
             "For a well-insulated home, roughly six cords of seasoned hardwood keeps a common room livable through a cold season; drafty or far-northern homes may need half again or twice that. The guide explains cords, seasoning times, and how to estimate your own needs from climate and home size."),
            ("How do I size a wood stove to my space?",
             "Match the stove's BTU rating to your square footage, insulation level, and winter severity — an oversized stove overheats and runs inefficiently, an undersized one never keeps up. The guide covers BTU-to-area rules of thumb, burn-time considerations, and why modern non-catalytic stoves hold overnight heat well."),
            ("How do I burn a wood stove safely?",
             "Safe operation means correct clearances to combustibles, proper stovepipe routing, regular chimney cleaning to prevent creosote fires, and adequate combustion air. The guide details clearance distances, seasoning wood to cut creosote, and carbon-monoxide awareness so heating your home does not become the emergency you were preparing for."),
            ("Why plan more than one heat source?",
             "Relying on a single heater is fragile. A robust plan pairs a powerful primary stove with a backup that uses a different fuel, plus passive measures like sealing drafts and closing off rooms to concentrate heat. The guide shows how to layer these so one failure does not leave you cold."),
        ],
    },
]

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id={ga_id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());
  gtag('config', '{ga_id}');
</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{intro_attr}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="theme-color" content="{charcoal}">
<meta property="og:type" content="article">
<meta property="og:title" content="{h1_attr}">
<meta property="og:description" content="{intro_attr}">
<meta property="og:url" content="{url}">
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{faq_jsonld}]
}}
</script>
<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {{ "@type": "ListItem", "position": 1, "name": "Home", "item": "{base}/" }},
    {{ "@type": "ListItem", "position": 2, "name": "{keyword_attr}", "item": "{url}" }}
  ]
}}
</script>
<style>
  body{{background:{charcoal};color:#E7E9E5;font-family:"Helvetica Neue",Arial,sans-serif;line-height:1.6;margin:0}}
  .wrap{{max-width:820px;margin:0 auto;padding:64px 24px}}
  a.brand{{color:#E7E9E5;text-decoration:none;font-weight:800;letter-spacing:.14em;text-transform:uppercase}}
  a.brand span{{color:{orange}}}
  .logo{{height:58px;width:auto;display:block;margin-bottom:4px}}
  h1{{font-size:clamp(2rem,5vw,3rem);line-height:1.08;margin:28px 0 16px}}
  .hl{{color:{orange}}}
  .answer{{background:#232A24;border-left:4px solid {orange};border-radius:4px;padding:22px 24px;margin:24px 0;color:#cfd4cd}}
  h2{{margin:40px 0 12px}}
  details{{background:#232A24;border:1px solid #3A443B;border-radius:4px;padding:0 22px;margin:12px 0}}
  summary{{cursor:pointer;padding:20px 0;font-weight:700;list-style:none}}
  summary::-webkit-details-marker{{display:none}}
  details p{{color:#A9B0A6;padding:0 0 20px}}
  .cta{{display:inline-block;margin-top:36px;background:{orange};color:#fff;text-decoration:none;font-weight:800;text-transform:uppercase;letter-spacing:.05em;padding:18px 34px;border-radius:3px}}
</style>
</head>
<body>
<main class="wrap">
  <a class="brand" href="{base}/"><img src="/assets/images/grid-down-logo.png" alt="GridDownData — Knowledge that survives the grid" class="logo"></a>
  <h1>{h1}</h1>
  <p class="answer">{answer}</p>
  <p>{intro}</p>
  <h2>Frequently asked <span class="hl">questions</span></h2>
  {faq_html}
  <a class="cta" href="{base}/#offer">Get Your Vault</a>
</main>
</body>
</html>
"""


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def build_faq_html(faqs):
    blocks = []
    for q, a in faqs:
        blocks.append(
            f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>'
        )
    return "\n  ".join(blocks)


def build_faq_jsonld(faqs):
    items = []
    for q, a in faqs:
        items.append(
            '{ "@type": "Question", "name": "%s", '
            '"acceptedAnswer": { "@type": "Answer", "text": "%s" } }'
            % (q.replace('"', "'"), a.replace('"', "'"))
        )
    return ",\n    ".join(items)


def main():
    urls = [f"{BASE_URL}/"]
    for t in TOPICS:
        slug_dir = os.path.join(OUT_DIR, t["slug"])
        os.makedirs(slug_dir, exist_ok=True)
        url = f"{BASE_URL}/{t['slug']}/"
        page = PAGE_TEMPLATE.format(
            title=esc(t["title"]),
            intro_attr=esc(t["intro"]),
            h1_attr=esc(t["h1"]),
            keyword_attr=esc(t["keyword"]),
            url=url,
            base=BASE_URL,
            charcoal=CHARCOAL,
            orange=ORANGE,
            ga_id=GA_ID,
            h1=esc(t["h1"]),
            answer=esc(t["answer"]),
            intro=esc(t["intro"]),
            faq_html=build_faq_html(t["faqs"]),
            faq_jsonld=build_faq_jsonld(t["faqs"]),
        )
        with open(os.path.join(slug_dir, "index.html"), "w", encoding="utf-8") as f:
            f.write(page)
        urls.append(url)
        print(f"  generated {url}")

    # sitemap.xml
    os.makedirs(OUT_DIR, exist_ok=True)
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        sm.append(
            f"  <url><loc>{u}</loc><lastmod>{TODAY}</lastmod>"
            f"<changefreq>weekly</changefreq>"
            f"<priority>{'1.0' if u == BASE_URL + '/' else '0.8'}</priority></url>"
        )
    sm.append("</urlset>")
    with open(os.path.join(OUT_DIR, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(sm))
    print(f"  wrote {OUT_DIR}/sitemap.xml with {len(urls)} URLs")


if __name__ == "__main__":
    main()
