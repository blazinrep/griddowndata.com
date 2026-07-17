#!/usr/bin/env python3
"""
GridDownData — programmatic SEO page generator.

Spins up one keyword-targeted landing page per topic from the TOPICS list,
reusing the master template's theme, meta suite, and structured data.
Also writes a sitemap.xml that includes the homepage + every generated page.

Usage:
    python3 generate_pages.py
Output:
    ./index.html is expected to already exist (the master page).
    ./<slug>/index.html  (one per topic)
    ./sitemap.xml
"""

import os
import html
from datetime import date

BASE_URL = "https://www.griddowndata.com"
OUT_DIR = ""
TODAY = date.today().isoformat()

# --- Brand theme (kept in sync with the master landing page) ---
CHARCOAL = "#1A1F1B"
ORANGE = "#D35400"

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
]

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
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
<header style="display: flex; align-items: center; justify-content: space-between; padding: 15px 4%; background-color: #0F1214; border-bottom: 1px solid #1E232A; width: 100%; box-sizing: border-box;" role="banner">
  <!-- Brand Block -->
  <a href="/" style="display: block; width: fit-content;"><img src="/assets/images/grid-down-logo.png" alt="Grid Down" style="height: 55px; width: auto; display: block;"></a>
  <nav class="nav-menu" style="display: flex; align-items: center; gap: 24px; margin-left: auto; margin-right: 24px;">
    <a href="{base}/">Home</a>
  </nav>
  <div class="header-actions">
    <a href="{base}/#vault" class="btn-cta" style="color: #FF5C1F; text-decoration: none; font-weight: bold; font-family: 'Helvetica Neue', Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">Get Your Vault</a>
  </div>
</header>
<main class="wrap">
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
    if OUT_DIR:
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
