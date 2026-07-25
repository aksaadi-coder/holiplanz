import { useCallback, useState } from "react";

const STORAGE_KEY = "holidayPlanner.profilePhoto.v1";
/** Square avatar side, in pixels — small enough to stay well under
 *  localStorage's ~5MB quota even as a base64 data URL. */
const AVATAR_SIZE = 240;

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Center-crops to a square and downsizes to AVATAR_SIZE, so a multi-MB
 *  phone photo doesn't get stored at full resolution. */
function processImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Couldn't read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * The account avatar photo — cropped to a square client-side and persisted
 * as a compact JPEG data URL, same client-only storage pattern as the rest
 * of Account (useAccountPrefs, useTravelerProfile). Nothing is uploaded
 * anywhere; it's just localStorage.
 */
export function useProfilePhoto() {
  const [photo, setPhotoState] = useState<string | null>(read);

  const setPhoto = useCallback(async (file: File) => {
    const dataUrl = await processImage(file);
    setPhotoState(dataUrl);
    try {
      localStorage.setItem(STORAGE_KEY, dataUrl);
    } catch {
      /* ignore quota / private-mode errors — photo just won't persist */
    }
  }, []);

  const clearPhoto = useCallback(() => {
    setPhotoState(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { photo, setPhoto, clearPhoto };
}
