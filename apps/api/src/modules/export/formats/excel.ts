import ExcelJS from 'exceljs';
import type { ReportColumn } from '../../../shared/report-registry.js';

interface ExportData {
  columns: ReportColumn[];
  rows: unknown[];
  title?: string;
}

export class ExcelFormatter {
  static readonly contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  constructor(private readonly _sheetName = 'Report') {}

  // eslint-disable-next-line no-unused-vars
  async export(data: ExportData): Promise<Buffer> {
    const { columns, rows, title } = data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(this._sheetName);

    if (title) {
      worksheet.addRow([title]).font = { bold: true, size: 14 };
      worksheet.addRow([]);
    }

    worksheet.addRow(columns.map((c) => c.label));

    for (const row of rows) {
      const values = columns.map((c) => {
        const val = (row as Record<string, unknown>)?.[c.key];
        return this._formatValue(val);
      });
      worksheet.addRow(values);
    }

    worksheet.columns?.forEach((col) => {
      let maxLen = 15; // Minimum column width

      // Fixed line 40 by adding optional chaining directly to eachCell invocation
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        if (!cell) return;
        const value = cell.value;
        if (value === null || value === undefined) return;

        let v: unknown = value;

        // 1. Handle ExcelJS Formula or Rich Text objects
        if (v && typeof v === 'object' && !(v instanceof Date)) {
          if ('result' in v) {
            v = (v as { result: unknown }).result;
          } else if ('richText' in v) {
            v = (v as { richText: { text: string }[] }).richText.map((t) => t.text).join('');
          } else if ('text' in v) {
            v = (v as { text: unknown }).text;
          }
        }

        // 2. Format Dates cleanly
        if (v instanceof Date) {
          v = v.toLocaleDateString();
        }

        if (v !== null && v !== undefined) {
          const lines = String(v).split('\n');
          lines.forEach((line) => {
            if (line.length > maxLen) {
              maxLen = line.length;
            }
          });
        }
      });

      col.width = maxLen + 3;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private _formatValue(val: unknown): unknown {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return val;
    if (typeof val === 'object') return JSON.stringify(val);
    return val;
  }
}
