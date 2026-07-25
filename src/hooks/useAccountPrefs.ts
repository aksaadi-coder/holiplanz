import { useCallback, useState } from "react";

const STORAGE_KEY = "holidayPlanner.accountPrefs.v1";

export const LANGUAGE_OPTIONS = ["English", "العربية", "Français", "Deutsch"];
export const CURRENCY_OPTIONS = ["EUR (€)", "USD ($)", "GBP (£)", "AED (د.إ)"];
export const UNIT_OPTIONS = ["Metric", "Imperial"];

interface AccountPrefs {
  notifyTrip: boolean;
  notifyBooking: boolean;
  notifyPassport: boolean;
  language: string;
  currency: string;
  units: string;
}

const DEFAULTS: AccountPrefs = {
  notifyTrip: true,
  notifyBooking: true,
  notifyPassport: true,
  language: LANGUAGE_OPTIONS[0],
  currency: CURRENCY_OPTIONS[0],
  units: UNIT_OPTIONS[0],
};

function read(): AccountPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Notification toggles + language/currency/units. Cosmetic, client-only
 * preferences: there's no notification backend and switching language or
 * currency here doesn't retranslate or re-price the app yet — this just
 * persists what the settings screens show, the same way useSession does.
 */
export function useAccountPrefs() {
  const [prefs, setPrefs] = useState<AccountPrefs>(read);

  const update = useCallback((patch: Partial<AccountPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore quota / private-mode errors */
      }
      return next;
    });
  }, []);

  return { prefs, update };
}
