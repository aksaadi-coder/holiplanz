const STORAGE_KEY = "holidayPlanner.accessCode";

export function getAccessCode(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setAccessCode(code: string): void {
  localStorage.setItem(STORAGE_KEY, code);
}
