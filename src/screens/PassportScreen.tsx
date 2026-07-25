import { useMemo, useRef, useState } from "react";
import type { Itinerary } from "../types";
import { buildPassport } from "../utils/passport";
import { PassportPage } from "../components/passport/PassportPage";
import { MiniPassportCard } from "../components/passport/MiniPassportCard";
import { ShareSheet } from "../components/passport/ShareSheet";
import { ExportScreen, type PassportExportVariant } from "../components/passport/ExportScreen";
import {
  savePassportImage,
  savePassportPdf,
  sharePassportImage,
  copyPassportLink,
  passportMailto,
} from "../utils/passportExport";

interface Props {
  itinerary: Itinerary | null;
  completedStopIds: Set<string>;
  /** Shown as a "‹ Back" link when this isn't the Passport tab root — e.g.
   *  viewing a past trip's passport from Account. */
  onBack?: () => void;
  backLabel?: string;
}

type Overlay = null | "share" | "export";

/**
 * Passport tab — the full passport-page design: corner category stamps around a
 * central destination stamp, trip details with a photo slot, route line and an
 * MRZ strip. All values are derived from the trip (see buildPassport). Owns the
 * Share sheet and Export screen. Export offers a Mini/Full toggle (see
 * ExportScreen) — the off-screen capture target below renders whichever
 * variant is selected, so the PDF/PNG always matches the Export preview.
 */
export function PassportScreen({ itinerary, completedStopIds, onBack, backLabel = "‹ Back" }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [exportVariant, setExportVariant] = useState<PassportExportVariant>("mini");
  const [busy, setBusy] = useState<null | "pdf" | "image">(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = useMemo(
    () => (itinerary ? buildPassport(itinerary, completedStopIds) : null),
    [itinerary, completedStopIds],
  );

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  if (!itinerary || !data) {
    return (
      <div className="hp-screen hp-passport-empty">
        <h1 className="hp-display">Trip Passport</h1>
        <p className="hp-muted">Plan a trip and mark what you did — your stamps appear here.</p>
      </div>
    );
  }

  const trip = itinerary;

  // Photo chosen locally for preview only — never uploaded or persisted.
  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
  }

  async function handleDownloadPdf() {
    if (!captureRef.current) return;
    setBusy("pdf");
    try {
      await savePassportPdf(captureRef.current, trip);
      showToast("PDF downloaded");
    } catch {
      showToast("Couldn't create the PDF");
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveImage() {
    if (!captureRef.current) return;
    setBusy("image");
    try {
      await savePassportImage(captureRef.current, trip);
      showToast("Image saved");
    } catch {
      showToast("Couldn't save the image");
    } finally {
      setBusy(null);
    }
  }

  async function handleCopyLink() {
    const ok = await copyPassportLink(data!.number);
    showToast(ok ? "Link copied" : "Couldn't copy the link");
  }

  async function handleMessage() {
    if (!captureRef.current) return;
    try {
      const result = await sharePassportImage(captureRef.current, trip);
      if (result === "downloaded") showToast("Image saved to share");
    } catch {
      /* user dismissed the share sheet — no toast */
    }
  }

  function handleEmail() {
    window.location.href = passportMailto(trip, data!.number);
  }

  return (
    <div className="hp-screen hp-passport">
      <div className="hp-passport-scroll">
        {onBack && (
          <button type="button" className="hp-back-link hp-passport-back" onClick={onBack}>
            {backLabel}
          </button>
        )}
        <PassportPage data={data} photo={photo} onPhotoClick={() => fileRef.current?.click()} />
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />

      <div className="hp-passport-actions">
        <button type="button" className="hp-passport-share" onClick={() => setOverlay("share")}>
          Share
        </button>
        <button type="button" className="hp-passport-export" onClick={() => setOverlay("export")}>
          Export PDF
        </button>
      </div>

      {overlay === "share" && (
        <ShareSheet
          onClose={() => setOverlay(null)}
          onCopyLink={handleCopyLink}
          onMessage={handleMessage}
          onEmail={handleEmail}
          onExportPdf={() => setOverlay("export")}
        />
      )}

      {overlay === "export" && (
        <ExportScreen
          data={data}
          photo={photo}
          busy={busy}
          variant={exportVariant}
          onVariantChange={setExportVariant}
          onBack={() => setOverlay(null)}
          onDownloadPdf={handleDownloadPdf}
          onSaveImage={handleSaveImage}
        />
      )}

      {toast && <div className="hp-passport-toast">{toast}</div>}

      {/* Off-screen capture target for PDF / image export — mirrors whichever
          variant is selected in ExportScreen, so the download always matches
          what's shown there, uploaded photo included. */}
      <div className="hp-capture-host" aria-hidden>
        <div
          className={
            exportVariant === "full" ? "hp-capture-page hp-capture-page-full" : "hp-capture-page"
          }
          ref={captureRef}
        >
          {exportVariant === "full" ? (
            <PassportPage data={data} photo={photo} />
          ) : (
            <MiniPassportCard data={data} photo={photo} />
          )}
        </div>
      </div>
    </div>
  );
}
