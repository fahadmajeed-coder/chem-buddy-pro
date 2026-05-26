// Significant figures + simple uncertainty propagation helpers.
//
// formatSig(value, n) — render value with n significant figures (no trailing
// junk, no exponential unless the magnitude is extreme).
// inferSigFigs(input) — best-effort sig-fig count from a user-typed string.
// minSig(...inputs) — propagate sig figs for multiplication/division
// (result keeps the smallest sig-fig count of inputs).
// addUncertainty(values, errors) — quadrature sum (sqrt(Σ e²)).

export function formatSig(value: number, sig = 4): string {
  if (!Number.isFinite(value)) return String(value);
  if (value === 0) return '0';
  const abs = Math.abs(value);
  // Use exponential only for very small/large magnitudes
  if (abs >= 1e6 || abs < 1e-4) {
    return value.toExponential(Math.max(0, sig - 1));
  }
  const d = Math.ceil(Math.log10(abs));
  const decimals = Math.max(0, sig - d);
  const rounded = Number(value.toFixed(decimals));
  // Strip trailing zeros from the decimal part
  return rounded.toString();
}

export function inferSigFigs(input: string): number {
  const s = input.trim();
  if (!s) return 0;
  // Scientific notation: 1.230e3 -> count the mantissa
  const sci = s.match(/^[-+]?(\d+(?:\.\d+)?)[eE][-+]?\d+$/);
  if (sci) return sci[1].replace('.', '').replace(/^0+/, '').length || 1;
  const cleaned = s.replace(/^[-+]/, '');
  if (cleaned.includes('.')) {
    // Has decimal point: strip leading zeros only
    const stripped = cleaned.replace(/^0+/, '');
    const noDot = stripped.replace('.', '');
    return noDot.length || 1;
  }
  // Integer: trailing zeros ambiguous — treat as significant
  return cleaned.replace(/^0+/, '').length || 1;
}

export function minSig(...inputs: string[]): number {
  const counts = inputs.map(inferSigFigs).filter(n => n > 0);
  return counts.length ? Math.min(...counts) : 4;
}

export function addUncertainty(...errors: number[]): number {
  return Math.sqrt(errors.reduce((s, e) => s + e * e, 0));
}

/** Format value ± uncertainty with matched precision. */
export function formatWithError(value: number, error: number): string {
  if (!Number.isFinite(error) || error === 0) return formatSig(value, 4);
  const decimals = Math.max(0, -Math.floor(Math.log10(Math.abs(error))) + 1);
  return `${value.toFixed(decimals)} ± ${error.toFixed(decimals)}`;
}
