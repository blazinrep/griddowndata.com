// Manifest of every file in the OS Pack bundle. Each entry becomes one
// presigned download link on the thank-you page and in the confirmation
// email — splitting the ~95GB bundle into separate files (instead of one
// giant zip) means a dropped connection only costs the customer one
// re-download, not the whole thing over again.
//
// This reflects the REAL, verified contents of GRIDDOWN_DRIVE as of
// 2026-08-03 (surveyed directly from the source SD card — see
// 01_Kiwix_Offline_Wikis/ and 03_Offline_Maps/ for the raw files).
//
// Two of these rows are pre-zipped bundles Chad needs to create locally
// before uploading (see the rclone/zip instructions given alongside this
// file) — everything else uploads as-is, 1:1 with its filename on the drive.
//
// TODO (Chad): confirm the `key` values below match where you actually
// upload each object in the R2 bucket (R2_BUCKET_NAME). `key` is the exact
// object path in the bucket; `filename` is what the browser saves it as;
// `label` and `sizeHint` are just display text on the download page/email.
export const OS_PACK_FILES = [
  {
    key: 'os-pack/GridDownData-Core-Dashboard.zip',
    filename: 'GridDownData-Core-Dashboard.zip',
    label: 'Emergency OS Dashboard, guides, checklists & vault app',
    sizeHint: '~3.4 MB',
  },
  {
    key: 'os-pack/wikipedia_en_medicine_maxi_2026-04.zim',
    filename: 'wikipedia_en_medicine_maxi_2026-04.zim',
    label: 'WikiMed — offline medical encyclopedia (ZIM)',
    sizeHint: '2.1 GB',
  },
  {
    key: 'os-pack/www.ready.gov_en_2024-12.zim',
    filename: 'www.ready.gov_en_2024-12.zim',
    label: 'Ready.gov — official emergency guidance (ZIM)',
    sizeHint: '2.3 GB',
  },
  {
    key: 'os-pack/ifixit_en_all_2025-12.zim',
    filename: 'ifixit_en_all_2025-12.zim',
    label: 'iFixit — repair guides for everything (ZIM)',
    sizeHint: '3.3 GB',
  },
  {
    key: 'os-pack/wikibooks_en_all_maxi_2026-04.zim',
    filename: 'wikibooks_en_all_maxi_2026-04.zim',
    label: 'Wikibooks — full how-to library (ZIM)',
    sizeHint: '5.8 GB',
  },
  {
    key: 'os-pack/wikipedia_en_all_nopic_2026-06.zim',
    filename: 'wikipedia_en_all_nopic_2026-06.zim',
    label: 'Full Wikipedia, text only (ZIM, largest single file)',
    sizeHint: '49.1 GB',
  },
  {
    key: 'os-pack/kiwix-macos_3.15.1.dmg',
    filename: 'kiwix-macos_3.15.1.dmg',
    label: 'Kiwix reader — macOS installer (open the ZIM files above)',
    sizeHint: '6.2 MB',
  },
  {
    key: 'os-pack/Offline-Maps-USA.zip',
    filename: 'Offline-Maps-USA.zip',
    label: 'Offline USA maps — 85 regional OsmAnd map files',
    sizeHint: '33 GB',
  },
];
