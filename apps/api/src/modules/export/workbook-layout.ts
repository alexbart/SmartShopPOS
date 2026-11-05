import ExcelJS from 'exceljs';
import { formatInTimeZone, type WorkbookBrand } from './branding.js';

/**
 * Shared header/footer layout so every workbook the system produces - report
 * exports, import templates, import result reports - carries the same
 * provenance block in the same place.
 */

const MUTED = 'FF6B7280';
const FAINT = 'FF9CA3AF';

export function writeMergedText(
  worksheet: ExcelJS.Worksheet,
  row: number,
  lastColumn: number,
  value: string,
  font: Partial<ExcelJS.Font>,
) {
  if (lastColumn > 1) worksheet.mergeCells(row, 1, row, lastColumn);
  const cell = worksheet.getCell(row, 1);
  cell.value = value;
  cell.font = font;
  cell.alignment = { vertical: 'middle', wrapText: false };
}

/** Writes the brand block and returns the row index content can start on. */
export function writeBrandHeader(
  worksheet: ExcelJS.Worksheet,
  brand: WorkbookBrand,
  lastColumn: number,
): number {
  let cursor = 1;

  writeMergedText(worksheet, cursor++, lastColumn, brand.organizationName, {
    bold: true,
    size: 16,
  });

  const details = [brand.tagline, brand.contactLine].filter(Boolean).join('  ·  ');
  if (details) {
    writeMergedText(worksheet, cursor++, lastColumn, details, {
      size: 9,
      color: { argb: MUTED },
    });
  }

  writeMergedText(worksheet, cursor++, lastColumn, brand.documentTitle, {
    bold: true,
    size: 12,
  });

  const generatedBy = brand.generatedBy ? `  ·  by ${brand.generatedBy}` : '';
  writeMergedText(
    worksheet,
    cursor++,
    lastColumn,
    `Document ${brand.documentId}  ·  Generated ${formatInTimeZone(
      brand.generatedAt,
      brand.timezone,
    )}${generatedBy}  ·  ${brand.organizationCode}`,
    { size: 9, color: { argb: MUTED } },
  );

  return cursor + 1;
}

export function writeBrandFooter(
  worksheet: ExcelJS.Worksheet,
  row: number,
  lastColumn: number,
  brand: WorkbookBrand,
  rowCount?: number,
) {
  const suffix = rowCount === undefined ? '' : ` · ${rowCount} row${rowCount === 1 ? '' : 's'}`;
  writeMergedText(
    worksheet,
    row,
    lastColumn,
    `SmartShopPOS · ${brand.organizationCode} · ${formatInTimeZone(
      brand.generatedAt,
      brand.timezone,
    )}${suffix}`,
    { size: 8, italic: true, color: { argb: FAINT } },
  );
}

/** Floating logo in the top-right corner, clear of the table itself. */
export function attachLogo(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  brand: WorkbookBrand,
  lastColumn: number,
) {
  if (!brand.logo) return;
  const imageId = workbook.addImage({
    base64: brand.logo.base64,
    extension: brand.logo.extension,
  });
  worksheet.addImage(imageId, {
    tl: { col: Math.max(lastColumn - 2, 1), row: 0 },
    ext: { width: 110, height: 44 },
  });
}
