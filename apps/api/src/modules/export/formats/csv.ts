import type { ReportColumn } from '../../../shared/report-registry.js';

interface ExportData {
  columns: ReportColumn[];
  rows: unknown[];
  title?: string;
}

export class CsvFormatter {
  static readonly contentType = 'text/csv; charset=utf-8';

  // eslint-disable-next-line no-unused-vars
  async export(data: ExportData): Promise<Buffer> {
    const { columns, rows } = data;
    const headers = columns.map((c) => c.label);
    const lines: string[] = [];

    lines.push(headers.map((h) => this._escape(h)).join(','));

    for (const row of rows) {
      const values = columns.map((c) => {
        const val = (row as Record<string, unknown>)?.[c.key];
        return this._formatValue(val);
      });
      lines.push(values.map((v) => this._escape(v)).join(','));
    }

    return Buffer.from(lines.join('\n'), 'utf-8');
  }

  private _escape(value: string): string {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private _formatValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }
}
