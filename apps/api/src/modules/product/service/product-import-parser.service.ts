import ExcelJS from 'exceljs';
import { resolveColumnByHeader, type ProductImportColumn } from './product-import-columns.js';

/**
 * Reads a filled-in copy of the product import template back into row objects.
 * Headers are matched by name (see product-import-columns.ts), so a user may
 * reorder columns or leave the Read me / Reference sheets alone without
 * breaking the import.
 */

/** Bigger than this and one upload would hold an HTTP request open for minutes. */
export const MAX_IMPORT_ROWS = 2000;

/** The brand block sits above the header row, so scan rather than assume row 1. */
const MAX_HEADER_SCAN_ROWS = 30;

const SHEET_NAME_PATTERN = /^product/i;

/** Template column keys that map onto a differently named import field. */
const FIELD_BY_COLUMN_KEY: Record<string, string> = {
  unit: 'unitName',
  category: 'categoryName',
  brand: 'brandName',
  tax: 'taxName',
};

export class ProductImportParseError extends Error {
  // Picked up by the global error handler so a bad file comes back as 400, not 500.
  readonly statusCode = 400;
  readonly code = 'IMPORT_PARSE_ERROR';
}

export interface ParsedProductRow {
  /** Spreadsheet row number, reported back to the user as-is. */
  rowNumber: number;
  data: Record<string, unknown>;
}

export interface ParseWorkbookResult {
  sheetName: string;
  rows: ParsedProductRow[];
  blankRows: number;
  ignoredHeaders: string[];
}

interface LocatedHeader {
  headerRow: number;
  columns: Map<number, ProductImportColumn>;
  ignoredHeaders: string[];
}

export class ProductImportParserService {
  async parse(buffer: Buffer): Promise<ParseWorkbookResult> {
    const workbook = new ExcelJS.Workbook();

    try {
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    } catch {
      throw new ProductImportParseError(
        'That file could not be read as an Excel workbook. Download a fresh template and fill that in instead.',
      );
    }

    const sheet = this._pickSheet(workbook);
    if (!sheet) {
      throw new ProductImportParseError(
        'No product rows were found. Use the downloaded template and fill in the Products sheet.',
      );
    }

    const located = this._locateHeader(sheet);
    if (!located) {
      throw new ProductImportParseError(
        `The '${sheet.name}' sheet does not have the expected columns. Keep the Product Name, Product Code and Unit headers from the template.`,
      );
    }

    const rows = this._readRows(sheet, located);
    if (rows.length === 0) {
      throw new ProductImportParseError(
        `The '${sheet.name}' sheet has headers but no product rows. Add at least one product and try again.`,
      );
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      throw new ProductImportParseError(
        `This file has ${rows.length} product rows. The limit is ${MAX_IMPORT_ROWS} per upload - split the file and import it in batches.`,
      );
    }

    return {
      sheetName: sheet.name,
      rows,
      blankRows: Math.max(sheet.rowCount - located.headerRow - rows.length, 0),
      ignoredHeaders: located.ignoredHeaders,
    };
  }

  /** Prefers the template's own sheet name, then anything that looks like one. */
  private _pickSheet(workbook: ExcelJS.Workbook): ExcelJS.Worksheet | undefined {
    const visible = workbook.worksheets.filter((sheet) => sheet.state !== 'hidden');
    const named = visible.find((sheet) => SHEET_NAME_PATTERN.test(sheet.name));
    if (named && this._locateHeader(named)) return named;
    return visible.find((sheet) => this._locateHeader(sheet) !== undefined);
  }

  private _locateHeader(sheet: ExcelJS.Worksheet): LocatedHeader | undefined {
    const lastRow = Math.min(sheet.rowCount, MAX_HEADER_SCAN_ROWS);

    for (let rowNumber = 1; rowNumber <= lastRow; rowNumber += 1) {
      const columns = new Map<number, ProductImportColumn>();
      const ignoredHeaders: string[] = [];

      sheet.getRow(rowNumber).eachCell({ includeEmpty: false }, (cell, columnNumber) => {
        const text = this._cellText(cell.value);
        if (!text) return;
        const column = resolveColumnByHeader(text);
        if (column) columns.set(columnNumber, column);
        else ignoredHeaders.push(text);
      });

      const keys = new Set([...columns.values()].map((column) => column.key));
      // Product Name + Product Code alone identify the sheet; Unit is required
      // by validation, so a row that only happens to contain those two words
      // in prose will not be mistaken for the header.
      if (keys.has('name') && keys.has('code') && keys.size >= 3) {
        return { headerRow: rowNumber, columns, ignoredHeaders };
      }
    }

    return undefined;
  }

  private _readRows(sheet: ExcelJS.Worksheet, located: LocatedHeader): ParsedProductRow[] {
    const rows: ParsedProductRow[] = [];

    for (let rowNumber = located.headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const data: Record<string, unknown> = {};
      let hasValue = false;

      for (const [columnNumber, column] of located.columns) {
        const text = this._cellText(row.getCell(columnNumber).value);
        if (text === undefined) continue;
        hasValue = true;
        data[FIELD_BY_COLUMN_KEY[column.key] ?? column.key] = this._coerce(text, column);
      }

      if (hasValue) rows.push({ rowNumber, data });
    }

    return rows;
  }

  /**
   * ExcelJS hands back a union of strings, numbers, dates, formulas, rich text
   * and hyperlinks depending on how the cell was typed. Everything degrades to
   * the text a human sees, so the Zod schema can do the real validation.
   */
  private _cellText(value: ExcelJS.CellValue): string | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') return value.trim() || undefined;
    if (typeof value === 'number') return String(value);
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value instanceof Date) return value.toISOString().slice(0, 10);

    if (typeof value === 'object') {
      const object = value as unknown as Record<string, unknown>;
      if (Array.isArray(object.richText)) {
        const text = object.richText
          .map((part) => String((part as { text?: string }).text ?? ''))
          .join('')
          .trim();
        return text || undefined;
      }
      if ('text' in object) return this._cellText(object.text as ExcelJS.CellValue);
      if ('result' in object) return this._cellText(object.result as ExcelJS.CellValue);
      if ('error' in object) return undefined;
    }

    return undefined;
  }

  private _coerce(text: string, column: ProductImportColumn): unknown {
    if (column.kind === 'number' || column.kind === 'integer') {
      const cleaned = text.replace(/[,\s]/g, '');
      const numeric = Number(cleaned);
      // Leave unparseable input as text so the row fails with the original value
      // in the message rather than a bare NaN.
      return cleaned !== '' && Number.isFinite(numeric) ? numeric : text;
    }

    if (column.kind === 'boolean') {
      const normalized = text.toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
      if (['false', '0', 'no', 'n'].includes(normalized)) return false;
      return text;
    }

    return text;
  }
}
