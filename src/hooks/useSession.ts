import { useCallback, useState } from "react";

const STORAGE_KEY = "holidayPlanner.session.v1";

/**
 * Client-only "session" for the simulated entry flow. THIS IS A DEMO: no
 * password is ever collected, the six-digit code is never checked, and no
 * email is sent anywhere — signing in just persists a flag (and, if given,
 * the typed email) to localStorage so the entry flow is skipped next launch.
 */
export interface Session {
  /** Whether the entry flow has been completed (or skipped). */
  ready: boolean;
  /** Email the user typed during sign-in, if any. Purely cosmetic. */
  email: string | null;
  /** Display name the user set in Account, if any. Falls back to a name
   *  derived from the email when null — see nameFromEmail in AccountScreen. */
  name: string | null;
  /** Mark the session complete (optionally recording a demo email). */
  signIn: (email?: string) => void;
  /** Rename the signed-in user. Empty/whitespace clears back to the
   *  email-derived default rather than storing a blank name. */
  setName: (name: string) => void;
  /** Forget the session — returns to the entry flow on next render, where a
   *  different email can be used. Deliberately identity-only: trips
   *  (useActiveTrip / useSavedTrips), the traveler profile and the avatar
   *  photo all persist, since the simulated auth has no real per-user
   *  storage and silently destroying someone's trips would be worse than
   *  carrying them over. */
  signOut: () => void;
}

interface Persisted {
  ready: boolean;
  email: string | null;
  name: string | null;
}

const EMPTY: Persisted = { ready: false, email: null, name: null };

function read(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      ready: Boolean(parsed.ready),
      email: parsed.email ?? null,
      // Added after v1 shipped — sessions saved before this just have no
      // name, which correctly falls back to the email-derived one.
      name: parsed.name ?? null,
    };
  } catch {
    return EMPTY;
  }
}

function persist(next: Persisted) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private-mode errors — session just won't persist */
  }
}

export function useSession(): Session {
  const [state, setState] = useState<Persisted>(read);

  const signIn = useCallback((email?: string) => {
    const next: Persisted = { ready: true, email: email ?? null, name: null };
    setState(next);
    persist(next);
  }, []);

  const setName = useCallback((name: string) => {
    setState((prev) => {
      const next = { ...prev, name: name.trim() || null };
      persist(next);
      return next;
    });
  }, []);

  const signOut = useCallback(() => {
    setState(EMPTY);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { ready: state.ready, email: state.email, name: state.name, signIn, setName, signOut };
}
