/** Normalize calculator input: ×→*, ^→**, allow x as multiply. */
export function normalizeCalcExpression(expr: string): string {
  return expr
    .replace(/×/g, "*")
    .replace(/\bx\b/gi, "*")
    .replace(/\^/g, "**");
}

/** Safe arithmetic for `= expression` in the search bar. */
export function tryEvaluateCalc(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("=")) return null;
  const raw = trimmed.slice(1).trim();
  if (!raw) return null;
  const expr = normalizeCalcExpression(raw);
  if (!/^[\d\s+\-*/().%]+$/.test(expr)) return null;
  try {
    const result = Function(`"use strict"; return (${expr})`)() as unknown;
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}
