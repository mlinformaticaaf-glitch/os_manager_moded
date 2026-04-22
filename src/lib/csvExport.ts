const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';

  const raw = value instanceof Date ? value.toISOString() : String(value);
  const safe = FORMULA_PREFIXES.some((prefix) => raw.startsWith(prefix)) ? `'${raw}` : raw;

  return `"${safe.replace(/"/g, '""')}"`;
}

export function downloadCsv(filename: string, rows: unknown[][]) {
  const content = rows.map((row) => row.map(sanitizeCsvCell).join(';')).join('\r\n');
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

