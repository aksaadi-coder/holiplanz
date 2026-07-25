import type { PassportData } from "../../utils/passport";
import { MiniPassportCard } from "./MiniPassportCard";
import { PassportPage } from "./PassportPage";
import { Chip } from "../ui/primitives";

export type PassportExportVariant = "mini" | "full";

interface Props {
  data: PassportData;
  photo: string | null;
  busy: null | "pdf" | "image";
  variant: PassportExportVariant;
  onVariantChange: (variant: PassportExportVariant) => void;
  onBack: () => void;
  onDownloadPdf: () => void;
  onSaveImage: () => void;
}

/**
 * Full-screen "Export as PDF" view — a preview of the passport, plus download
 * actions. The Mini/Full toggle picks between the compact MiniPassportCard and
 * the full stamped PassportPage; the preview always renders the same
 * component as the off-screen capture target (owned by PassportScreen), so
 * what's shown here is an exact match for what gets captured for the PDF/image.
 */
export function ExportScreen({
  data,
  photo,
  busy,
  variant,
  onVariantChange,
  onBack,
  onDownloadPdf,
  onSaveImage,
}: Props) {
  return (
    <div className="hp-export-screen">
      <div className="hp-export-scroll">
        <span className="hp-export-back" onClick={onBack}>
          ‹ Passport
        </span>
        <h1 className="hp-export-h1">Export as PDF</h1>
        <p className="hp-export-lead">A print-ready page, stamps and all.</p>

        <div className="hp-chip-group hp-export-variant-toggle">
          <Chip label="Mini" selected={variant === "mini"} onClick={() => onVariantChange("mini")} />
          <Chip label="Full" selected={variant === "full"} onClick={() => onVariantChange("full")} />
        </div>

        {variant === "full" ? (
          <div className="hp-export-full-preview">
            <PassportPage data={data} photo={photo} />
          </div>
        ) : (
          <MiniPassportCard data={data} photo={photo} />
        )}
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
