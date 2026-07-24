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
  /** Mark the session complete (optionally recording a demo email). */
  signIn: (email?: string) => void;
  /** Forget the session — returns to the entry flow on next render. */
  signOut: () => void;
}

interface Persisted {
  ready: boolean;
  email: string | null;
}

function read(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ready: false, email: null };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return { ready: Boolean(parsed.ready), email: parsed.email ?? null };
  } catch {
    return { ready: false, email: null };
  }
}

export function useSession(): Session {
  const [state, setState] = useState<Persisted>(read);

  const signIn = useCallback((email?: string) => {
    const next: Persisted = { ready: true, email: email ?? null };
    setState(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota / private-mode errors — session just won't persist */
    }
  }, []);

  const signOut = useCallback(() => {
    setState({ ready: false, email: null });
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { ready: state.ready, email: state.email, signIn, signOut };
}
