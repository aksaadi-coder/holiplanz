import type { PassportData } from "../../utils/passport";
import { MiniPassportCard } from "./MiniPassportCard";

interface Props {
  data: PassportData;
  photo: string | null;
  busy: null | "pdf" | "image";
  onBack: () => void;
  onDownloadPdf: () => void;
  onSaveImage: () => void;
}

/**
 * Full-screen "Export as PDF" view — a preview of the compact passport card
 * plus download actions. The preview renders the same MiniPassportCard as the
 * off-screen capture target (owned by PassportScreen), so what's shown here
 * is an exact match for what gets captured for the PDF/image.
 */
export function ExportScreen({ data, photo, busy, onBack, onDownloadPdf, onSaveImage }: Props) {
  return (
    <div className="hp-export-screen">
      <div className="hp-export-scroll">
        <span className="hp-export-back" onClick={onBack}>
          ‹ Passport
        </span>
        <h1 className="hp-export-h1">Export as PDF</h1>
        <p className="hp-export-lead">A print-ready page, stamps and all.</p>

        <MiniPassportCard data={data} photo={photo} />
      </div>

      <div className="hp-export-actions">
        <button
          type="button"
          className="hp-export-primary"
          onClick={onDownloadPdf}
          disabled={busy !== null}
        >
          {busy === "pdf" ? "Preparing PDF…" : "Download PDF"}
        </button>
        <button
          type="button"
          className="hp-export-secondary"
          onClick={onSaveImage}
          disabled={busy !== null}
        >
          {busy === "image" ? "Saving image…" : "Save as image"}
        </button>
      </div>
    </div>
  );
}
