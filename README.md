# Grid Down Data

**Air-Gapped Knowledge // Zero Friction // Field Ready**

A single-file, offline-first tactical knowledge vault designed for low- or no-connectivity environments. The entire interface lives in `index.html` with no external dependencies, CDNs, or remote scripts.

---

## Purpose

`griddowndata.com` is a static web front-end that organizes local PDFs, ZIM archives, and executable readers into a searchable, easy-to-navigate grid. It is built to run directly from a USB drive, local hard disk, NAS, or any static web host without a backend.

---

## Repository Structure

```
griddowndata.com/
├── index.html              # Complete single-page interface (CSS + JS inline)
├── README.md               # This file
└── assets/                 # Optional: shared logos, favicons, icons
    └── (not required for core operation)

Document folders referenced by index.html:
├── 01_MEDICAL_FIRST_AID/
│   ├── Emergency_Medicine_Manual.pdf
│   ├── Combat_Casualty_Care.pdf
│   └── Wilderness_First_Responder.pdf
├── 02_WATER_SANITATION/
│   ├── EPA_Emergency_Water_Disinfection.pdf
│   ├── Well_Drilling_Manual.pdf
│   └── Off_Grid_Sanitation.pdf
├── 03_FOOD_PRESERVATION_HOMESTEADING/
│   ├── Salting_And_Drying_Guide.pdf
│   ├── USDA_Canning_1930.pdf
│   └── Foxfire_Homesteading.pdf
├── 04_MECHANICAL_TOOLS_ENERGY/
│   ├── Small_Engine_Repair.pdf
│   ├── Hydraulic_Ram_Pumps.pdf
│   └── Off_Grid_Solar_Wind.pdf
└── 05_OFFLINE_WIKIS/
    ├── kiwix-desktop.exe
    ├── kiwix-desktop.dmg
    ├── wikipedia_en_all.zim
    └── wikihow_en_all.zim
```

> The folders above are **referenced** by `index.html` but are **not** part of this repository. They should be placed next to `index.html` during deployment or distribution.

---

## Local Setup

### Option 1: Open Directly in a Browser

1. Place `index.html` in the root of your offline data archive.
2. Create the five document folders listed above and add the matching files.
3. Double-click `index.html` or drag it into any modern browser.

The interface works from `file://` URLs. PDFs and `.zim` files will open according to the browser's configured handlers.

### Option 2: Serve with a Lightweight Local Server

Recommended for testing cross-browser behavior or hosting on a local network.

Using Python:

```bash
cd griddowndata.com
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

Using Node.js (`npx serve`):

```bash
cd griddowndata.com
npx serve -p 8000
```

### Option 3: Deploy to Any Static Host

Upload the root folder (including `index.html` and the five asset folders) to any static host such as:

- Netlify
- Cloudflare Pages
- GitHub Pages
- Amazon S3 + CloudFront
- A local NAS web server

---

## Technical Specifications

- **Architecture:** Single-file static HTML interface.
- **Dependencies:** None. No external CSS, JS, fonts, or CDNs.
- **Styling:** Inline CSS with CSS custom properties for rapid theming.
- **Color Theme:** Charcoal base (`#1A1F1B`) with safety-orange accents (`#D35400`).
- **Layout:** Responsive CSS Grid; two-column on desktop, single-column on mobile.
- **Navigation:** Sticky top nav with smooth-scroll anchor jumps to each section.
- **Search:** Vanilla JavaScript live filter. Searches link titles and descriptions.
- **Browser Support:** Modern evergreen browsers (Chrome, Firefox, Safari, Edge).
- **Offline Operation:** Fully functional without internet connectivity.
- **Security:** No cookies, no local storage, no service workers, no telemetry.

---

## Customization

### Adding a New Section

1. Add a new `<section class="section-card" id="sec-example">` block inside `#vaultGrid`.
2. Add a corresponding nav link in the `.nav-links` container.
3. Follow the existing `<li class="vault-item">` pattern.

The search and section-hiding logic will pick up the new items automatically.

### Changing the Color Theme

Edit the `:root` CSS variables near the top of `index.html`:

```css
:root {
    --bg-main: #1A1F1B;
    --bg-card: #242B26;
    --accent: #D35400;
    --accent-hover: #E67E22;
    --border: #2F3831;
}
```

---

## Updating the Live Site

1. Make edits to `index.html`.
2. Stage, commit, and push:

```bash
git add index.html
git commit -m "Update vault: [description of change]"
git push origin main
```

For a full release workflow, see `.windsurf/workflows/deploy-griddowndata.md`.

---

## License

This interface file is provided as-is for personal preparedness, education, and offline knowledge management. Content licensing for individual PDFs and databases remains with their respective authors and publishers.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Links return 404 | Confirm the exact folder names and file names match the `href` paths in `index.html`. |
| Search shows no results | Ensure every list item uses the class `vault-item`. |
| Page looks unstyled | Verify `index.html` was not truncated during transfer and that no network policy blocks inline styles. |
| `.zim` files do not open | Install Kiwix Desktop and open the `.zim` archive from within the application. |

---

## Contact / Maintenance

Keep this file updated whenever the folder structure, asset list, or deployment process changes. The goal is a single source of truth for anyone maintaining the archive.
