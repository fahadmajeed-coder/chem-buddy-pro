// Universal CSV / text-file exporters. PDF is intentionally kept to the
// existing per-section implementations (jsPDF) to avoid bundle bloat here.

export function downloadFile(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[\",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Convert array of rows (objects) to CSV. Columns auto-detected if omitted. */
export function toCSV<T extends Record<string, unknown>>(rows: T[], columns?: (keyof T)[]): string {
  if (rows.length === 0) return '';
  const cols = (columns ?? (Object.keys(rows[0]) as (keyof T)[])) as (keyof T)[];
  const head = cols.map(c => csvCell(c as string)).join(',');
  const body = rows.map(r => cols.map(c => csvCell(r[c])).join(',')).join('\n');
  return `${head}\n${body}`;
}

export function exportCSV<T extends Record<string, unknown>>(filename: string, rows: T[], columns?: (keyof T)[]) {
  downloadFile(filename.endsWith('.csv') ? filename : `${filename}.csv`, toCSV(rows, columns), 'text/csv;charset=utf-8');
}

export function exportJSON(filename: string, data: unknown) {
  downloadFile(filename.endsWith('.json') ? filename : `${filename}.json`, JSON.stringify(data, null, 2), 'application/json');
}
