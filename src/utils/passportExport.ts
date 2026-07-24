import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import type { Itinerary } from "../types";

/** URL-safe slug from the trip destination, for download filenames. */
function slug(itinerary: Itinerary): string {
  return (
    itinerary.destination
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "trip"
  );
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Rasterise a DOM node (the print-ready passport card) to a canvas. */
async function captureNode(node: HTMLElement): Promise<HTMLCanvasElement> {
  return html2canvas(node, {
    backgroundColor: "#ffffff",
    // Fixed high scale rather than following devicePixelRatio (which caps at
    // 2 on most screens) — this is an offscreen one-off export, so it's worth
    // spending the extra render time on a crisp, print-quality result.
    scale: 4,
    useCORS: true,
    logging: false,
  });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

/** Save the passport card as a PNG image. */
export async function savePassportImage(node: HTMLElement, itinerary: Itinerary): Promise<void> {
  const canvas = await captureNode(node);
  const blob = await canvasBlob(canvas);
  downloadBlob(blob, `${slug(itinerary)}-passport.png`);
}

/** Save the passport card as a single-page A4 PDF (image centred with margins). */
export async function savePassportPdf(node: HTMLElement, itinerary: Itinerary): Promise<void> {
  const canvas = await captureNode(node);
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const w = pageW - margin * 2;
  const h = w * (canvas.height / canvas.width);
  const y = Math.max(margin, (pageH - h) / 2);
  pdf.addImage(img, "PNG", margin, y, w, h);
  pdf.save(`${slug(itinerary)}-passport.pdf`);
}

/** Share the passport image via the native share sheet, or download as a fallback. */
export async function sharePassportImage(
  node: HTMLElement,
  itinerary: Itinerary,
): Promise<"shared" | "downloaded"> {
  const canvas = await captureNode(node);
  const blob = await canvasBlob(canvas);
  const file = new File([blob], `${slug(itinerary)}-passport.png`, { type: "image/png" });

  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({
      files: [file],
      title: `${itinerary.destination} · Trip Passport`,
      text: `My ${itinerary.destination} trip passport`,
    });
    return "shared";
  }
  downloadBlob(blob, file.name);
  return "downloaded";
}

/**
 * DEMO: there is no share backend, so we copy a plausible-looking passport link
 * to the clipboard. Nothing is uploaded. Returns whether the copy succeeded.
 */
export async function copyPassportLink(passportNumber: string): Promise<boolean> {
  const id = passportNumber.replace(/\D/g, "") || "000000";
  const url = `https://holiplanz.app/p/${id}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/** mailto: link for "Email it" — a text note plus the demo passport link. */
export function passportMailto(itinerary: Itinerary, passportNumber: string): string {
  const id = passportNumber.replace(/\D/g, "") || "000000";
  const subject = encodeURIComponent(`My ${itinerary.destination} trip passport`);
  const body = encodeURIComponent(
    `Here's my Holiplanz trip passport for ${itinerary.destination}:\n\nhttps://holiplanz.app/p/${id}\n`,
  );
  return `mailto:?subject=${subject}&body=${body}`;
}
