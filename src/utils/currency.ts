/**
 * Best-effort currency conversion for display only. Trip budgets are already
 * LLM-estimated approximations (see systemPrompt.ts), so a fixed rate table
 * is consistent with that — no FX API, no added cost, just re-labelled
 * numbers when the user picks a different display currency.
 */

const UNITS_PER_USD: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  JPY: 155,
  CNY: 7.2,
  KRW: 1350,
  INR: 83,
  THB: 36,
  VND: 25000,
  IDR: 15800,
  PHP: 56,
  MYR: 4.7,
  SGD: 1.35,
  AUD: 1.5,
  CAD: 1.36,
  CHF: 0.88,
  MXN: 17,
  BRL: 5.4,
  TRY: 32,
  ZAR: 18.5,
  EGP: 48,
};

// Longest/most distinctive symbols first, so multi-char ones match before a
// shorter symbol that happens to be a prefix of them.
const SYMBOL_TO_CODE: [string, string][] = [
  ["د.إ", "AED"],
  ["R$", "BRL"],
  ["E£", "EGP"],
  ["Rp", "IDR"],
  ["RM", "MYR"],
  ["₫", "VND"],
  ["₹", "INR"],
  ["₩", "KRW"],
  ["₱", "PHP"],
  ["฿", "THB"],
  ["₺", "TRY"],
  ["£", "GBP"],
  ["€", "EUR"],
  ["¥", "JPY"],
  ["$", "USD"],
];

const CODE_TO_SYMBOL: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
  INR: "₹",
  THB: "฿",
  VND: "₫",
  IDR: "Rp",
  PHP: "₱",
  MYR: "RM",
  SGD: "$",
  AUD: "$",
  CAD: "$",
  CHF: "Fr",
  MXN: "$",
  BRL: "R$",
  TRY: "₺",
  ZAR: "R",
  EGP: "E£",
};

/** "EUR (€)" → "EUR" — the account currency picker's label format. */
export function currencyCodeFromLabel(label: string): string {
  const match = label.match(/[A-Z]{3}/);
  return match ? match[0] : "USD";
}

interface ParsedMoney {
  amount: number;
  code: string;
}

/** Parses a formatted figure like "¥412,000" or "THB 1,200" into a number + currency code. */
export function parseMoney(raw: string): ParsedMoney | null {
  const trimmed = raw.trim();

  for (const [symbol, code] of SYMBOL_TO_CODE) {
    if (trimmed.startsWith(symbol)) {
      const numMatch = trimmed.slice(symbol.length).match(/[\d,.]+/);
      if (!numMatch) return null;
      const amount = parseFloat(numMatch[0].replace(/,/g, ""));
      return Number.isFinite(amount) ? { amount, code } : null;
    }
  }

  const codeMatch = trimmed.match(/^([A-Z]{3})\s*([\d,.]+)/);
  if (codeMatch) {
    const amount = parseFloat(codeMatch[2].replace(/,/g, ""));
    return Number.isFinite(amount) ? { amount, code: codeMatch[1] } : null;
  }

  return null;
}

function formatMoney(amount: number, code: string): string {
  const symbol = CODE_TO_SYMBOL[code] ?? `${code} `;
  return `${symbol}${Math.round(amount).toLocaleString("en-US")}`;
}

/**
 * Converts a formatted amount into the given target currency code using the
 * approximate rate table above. Returns the original string unchanged if it
 * can't be parsed, is already in that currency, or the currency is unknown.
 */
export function convertMoney(raw: string, toCode: string): string {
  const parsed = parseMoney(raw);
  if (!parsed || parsed.code === toCode) return raw;
  const fromRate = UNITS_PER_USD[parsed.code];
  const toRate = UNITS_PER_USD[toCode];
  if (!fromRate || !toRate) return raw;
  const usd = parsed.amount / fromRate;
  return formatMoney(usd * toRate, toCode);
}
