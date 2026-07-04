import { jsPDF } from "jspdf";
import type { Itinerary } from "../types";
import { bookingSearchUrl, googleMapsUrl, googleSearchUrl } from "./geo";

const MARGIN = 15;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function buildItineraryPdf(itinerary: Itinerary): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  function ensureSpace(neededMm: number) {
    if (y + neededMm > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function wrapText(text: string, fontSize: number, maxWidth = CONTENT_WIDTH): string[] {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxWidth);
  }

  function writeLines(lines: string[], lineHeight: number) {
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  writeLines(wrapText(itinerary.tripTitle, 20), 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(90, 90, 90);
  writeLines(wrapText(itinerary.destination, 12), 6);
  doc.setTextColor(20, 20, 20);
  y += 4;

  for (const day of itinerary.days) {
    ensureSpace(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    writeLines(wrapText(`Day ${day.dayNumber}: ${day.title}`, 14), 7);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    writeLines(wrapText(day.summary, 10), 5);
    doc.setTextColor(20, 20, 20);
    y += 2;

    const stay = itinerary.accommodations?.find(
      (acc) => acc.startDay <= day.dayNumber && acc.endDay >= day.dayNumber,
    );
    if (stay) {
      ensureSpace(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Where to stay:", MARGIN, y);
      y += 5;

      stay.options.forEach((option) => {
        ensureSpace(10);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        const heading = `${option.style}: ${option.name} (${option.area})`;
        doc.text(heading, MARGIN, y);
        y += 4.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(110, 110, 110);
        writeLines(wrapText(option.description, 8.5), 4);

        doc.setTextColor(110, 110, 110);
        const priceLabel = `${option.estimatedPricePerNight} (approx.)`;
        doc.text(priceLabel, MARGIN, y);
        const priceWidth = doc.getTextWidth(priceLabel);
        doc.setTextColor(30, 90, 200);
        doc.textWithLink("  Search on Booking.com ->", MARGIN + priceWidth, y, {
          url: bookingSearchUrl(option.name, itinerary.destination),
        });
        doc.setTextColor(20, 20, 20);
        y += 6;
      });
      y += 1;
    }

    day.stops.forEach((stop, i) => {
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      const heading = `${i + 1}. ${stop.name}`;
      doc.text(heading, MARGIN, y);
      const headingWidth = doc.getTextWidth(heading);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(`  (${stop.timeOfDay} · ${stop.category})`, MARGIN + headingWidth, y);
      doc.setTextColor(20, 20, 20);
      y += 5.5;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      writeLines(wrapText(stop.description, 10), 5);

      doc.setFontSize(9);
      doc.setTextColor(30, 90, 200);
      ensureSpace(5);
      const mapLabel = "View on map ->";
      doc.textWithLink(mapLabel, MARGIN, y, { url: googleMapsUrl(stop) });
      const mapLabelWidth = doc.getTextWidth(mapLabel);
      doc.textWithLink("Search the web ->", MARGIN + mapLabelWidth + 6, y, {
        url: googleSearchUrl(stop.name, itinerary.destination),
      });
      doc.setTextColor(20, 20, 20);
      y += 7;
    });

    y += 3;
  }

  return doc;
}

export function previewItineraryPdf(itinerary: Itinerary): void {
  const doc = buildItineraryPdf(itinerary);
  const blobUrl = doc.output("bloburl");
  window.open(blobUrl.toString(), "_blank");
}

function fileNameFor(itinerary: Itinerary): string {
  const slug = itinerary.destination.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${slug || "itinerary"}.pdf`;
}

export async function shareItineraryPdf(itinerary: Itinerary): Promise<"shared" | "downloaded"> {
  const doc = buildItineraryPdf(itinerary);
  const blob = doc.output("blob") as Blob;
  const fileName = fileNameFor(itinerary);
  const file = new File([blob], fileName, { type: "application/pdf" });

  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] }) && navigator.share) {
    await navigator.share({
      files: [file],
      title: itinerary.tripTitle,
      text: `Itinerary for ${itinerary.destination}`,
    });
    return "shared";
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
