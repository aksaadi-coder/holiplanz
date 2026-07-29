/**
 * Friendly first name from the session email, e.g. "ak.saadi@gmail.com" → "Ak".
 * The fallback when someone hasn't set a name in Account.
 */
export function nameFromEmail(email: string | null): string {
  if (!email) return "Traveller";
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[.+_-]/)[0] ?? local;
  return first ? first[0].toUpperCase() + first.slice(1) : "Traveller";
}

/**
 * What to call the signed-in person. One answer for the whole app, so the name
 * on a shared trip is the same one the Account tab greets them by — a guest
 * seeing "Shared by Traveller" when the sender set a name would be a small
 * betrayal of a setting they took the trouble to fill in.
 */
export function displayName(name: string | null, email: string | null): string {
  return name ?? nameFromEmail(email);
}
