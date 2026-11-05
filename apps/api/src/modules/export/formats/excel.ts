import ExcelJS from 'exceljs';
import type { ReportColumn } from '../../../shared/report-registry.js';
import type { WorkbookBrand } from '../branding.js';
import {
  attachLogo,
  writeBrandFooter,
  writeBrandHeader,
  writeMergedText,
} from '../workbook-layout.js';

interface ExportData {
  columns: ReportColumn[];
  rows: unknown[];
  title?: string;
  brand?: WorkbookBrand;
}

export class ExcelFormatter {
  static readonly contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  constructor(private readonly _sheetName = 'Report') {}

  // eslint-disable-next-line no-unused-vars
  async export(data: ExportData): Promise<Buffer> {
    const { columns, rows, title, brand } = data;
    const lastColumn = Math.max(columns.length, 1);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = brand?.organizationName ?? 'SmartShopPOS';
    workbook.created = brand?.generatedAt ?? new Date();

    const worksheet = workbook.addWorksheet(this._sheetName);
    let cursor = 1;

    if (brand) {
      cursor = writeBrandHeader(worksheet, brand, lastColumn);
    } else if (title) {
      writeMergedText(worksheet, cursor++, lastColumn, title, { bold: true, size: 14 });
      cursor += 1;
    }

    const headerRowIndex = cursor;
    const headerRow = worksheet.getRow(headerRowIndex);
    columns.forEach((column, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = column.label;
      cell.font = { bold: true };
    });
    cursor += 1;

    const widths = columns.map((column) => column.label.length);

    for (const row of rows) {
      const rowValues = columns.map((column, index) => {
        const value = this._formatValue((row as Record<string, unknown>)?.[column.key]);
        widths[index] = Math.max(widths[index], this._displayLength(value));
        return value;
      });

      const excelRow = worksheet.getRow(cursor);
      rowValues.forEach((value, index) => {
        excelRow.getCell(index + 1).value = value;
      });
      cursor += 1;
    }

    cursor += 1;
    if (brand) {
      writeBrandFooter(worksheet, cursor, lastColumn, brand, rows.length);
    } else {
      writeMergedText(
        worksheet,
        cursor,
        lastColumn,
        `Exported ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${rows.length} rows`,
        { size: 8, italic: true, color: { argb: 'FF9CA3AF' } },
      );
    }

    widths.forEach((width, index) => {
      worksheet.getColumn(index + 1).width = Math.min(Math.max(width + 3, 12), 60);
    });

    worksheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];

    if (rows.length > 0) {
      worksheet.autoFilter = {
        from: { row: headerRowIndex, column: 1 },
        to: { row: headerRowIndex + rows.length, column: lastColumn },
      };
    }

    if (brand) attachLogo(workbook, worksheet, brand, lastColumn);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private _displayLength(value: unknown): number {
    if (value === null || value === undefined) return 0;
    if (value instanceof Date) return 10;
    if (typeof value === 'object') return JSON.stringify(value).length;
    return String(value).length;
  }

  private _formatValue(val: unknown): ExcelJS.CellValue {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return val;
    if (typeof val === 'object') return JSON.stringify(val);
    return val as ExcelJS.CellValue;
  }
}
