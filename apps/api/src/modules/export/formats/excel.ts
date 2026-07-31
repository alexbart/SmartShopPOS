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

    worksheet.columns.forEach((col) => {
      let max = 15;
      col.eachCell((cell) => {
        const len = cell.value ? cell.value.toString().length : 0;
        if (len > max) max = len;
      });
      col.width = max + 2;
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
