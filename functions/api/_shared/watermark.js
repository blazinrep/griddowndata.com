import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';

// Stamp every page of the PDF with a per-buyer watermark so leaked copies are
// traceable to the purchase. Adds a small footer line (email + order id) plus a
// faint diagonal ownership mark. Kept light so the manual stays readable/printable.
//
// `bytes` is an ArrayBuffer or Uint8Array of the original PDF.
// Returns a Uint8Array of the stamped PDF.
export async function watermarkPdf(bytes, { email, orderId } = {}) {
  const buyer = (email && String(email).trim()) || 'purchaser';
  const order = (orderId && String(orderId).trim()) || 'unknown';

  const pdf = await PDFDocument.load(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const footer =
    `Licensed to ${buyer}  ·  Order ${order}  ·  © GridDownData — single-user license, not for redistribution`;

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();

    // Faint diagonal ownership mark across the page.
    const markSize = 22;
    const markText = buyer;
    const markWidth = font.widthOfTextAtSize(markText, markSize);
    page.drawText(markText, {
      x: (width - markWidth * Math.cos(Math.PI / 6)) / 2,
      y: height / 2 - 40,
      size: markSize,
      font,
      color: rgb(0.55, 0.55, 0.55),
      opacity: 0.1,
      rotate: degrees(30),
    });

    // Footer traceability line, centered along the bottom.
    const footSize = 6.5;
    let footText = footer;
    let footWidth = font.widthOfTextAtSize(footText, footSize);
    // Trim if the email makes it wider than the page.
    if (footWidth > width - 24) {
      footText = `Licensed to ${buyer}  ·  Order ${order}  ·  © GridDownData`;
      footWidth = font.widthOfTextAtSize(footText, footSize);
    }
    page.drawText(footText, {
      x: Math.max(12, (width - footWidth) / 2),
      y: 7,
      size: footSize,
      font,
      color: rgb(0.45, 0.45, 0.45),
      opacity: 0.85,
    });
  }

  return await pdf.save();
}
