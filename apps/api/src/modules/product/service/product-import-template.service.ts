import ExcelJS from 'exceljs';
import { getPrisma } from '../../../shared/database/prisma.js';
import { writeHashedAuditEvent } from '../../audit/audit-chain.js';
import {
  buildWorkbookBrand,
  formatInTimeZone,
  timestampedFilename,
  type WorkbookBrand,
} from '../../export/branding.js';
import {
  attachLogo,
  writeBrandFooter,
  writeBrandHeader,
  writeMergedText,
} from '../../export/workbook-layout.js';
import { PRODUCT_IMPORT_COLUMNS, type ProductImportColumn } from './product-import-columns.js';

/** Dropdowns are attached to this many data rows; the importer accepts more. */
const VALIDATED_ROWS = 500;

interface ReferenceItem {
  id: string;
  name: string;
  code: string;
}

interface ReferenceData {
  units: ReferenceItem[];
  categories: ReferenceItem[];
  brands: ReferenceItem[];
  taxes: ReferenceItem[];
}

const LIST_COLUMN: Partial<Record<ProductImportColumn['kind'], keyof ReferenceData>> = {
  unit: 'units',
  category: 'categories',
  brand: 'brands',
  tax: 'taxes',
};

const LIST_COLUMN_LETTER: Partial<Record<ProductImportColumn['kind'], string>> = {
  unit: 'A',
  category: 'B',
  brand: 'C',
  tax: 'D',
};

export interface TemplateActor {
  userId?: string;
  /** Full name to print in the header; looked up from the user id when absent. */
  name?: string;
}

export class ProductImportTemplateService {
  async generate(
    organizationId: string,
    actor: TemplateActor = {},
  ): Promise<{ buffer: Buffer; filename: string; brand: WorkbookBrand }> {
    const generatedBy = actor.name ?? (await this._actorName(organizationId, actor.userId));

    const brand = await buildWorkbookBrand({
      organizationId,
      documentTitle: 'Product Import Template',
      documentIdPrefix: 'PRDIMP',
      generatedBy,
    });

    const reference = await this._loadReferenceData(organizationId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = brand.organizationName;
    workbook.created = brand.generatedAt;

    this._buildReadMeSheet(workbook, brand);
    this._buildProductsSheet(workbook, brand, reference);
    this._buildReferenceSheet(workbook, brand, reference);
    this._buildListsSheet(workbook, reference);

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${timestampedFilename('products-import-template', brand.generatedAt)}.xlsx`;

    await this._recordDownload(organizationId, actor.userId, filename, brand);

    return {
      buffer: Buffer.from(buffer),
      filename,
      brand,
    };
  }

  private async _actorName(organizationId: string, userId?: string): Promise<string | undefined> {
    if (!userId) return undefined;
    const user = await getPrisma().user.findFirst({
      where: { id: userId, organizationId },
      select: { firstName: true, lastName: true },
    });
    return user ? `${user.firstName} ${user.lastName}`.trim() : undefined;
  }

  /** Every generated template is an export of catalog data, so it is audited as one. */
  private async _recordDownload(
    organizationId: string,
    userId: string | undefined,
    filename: string,
    brand: WorkbookBrand,
  ) {
    try {
      await writeHashedAuditEvent(getPrisma(), {
        organizationId,
        actorId: userId,
        action: 'EXPORT',
        entity: 'ProductImportTemplate',
        entityId: brand.documentId,
        outcome: 'SUCCESS',
        summary: `Downloaded the product import template (${brand.documentId})`,
        newValues: {
          documentId: brand.documentId,
          fileName: filename,
          columns: PRODUCT_IMPORT_COLUMNS.length,
        },
      });
    } catch {
      // The user already has the file; a failed audit write must not fail the download.
    }
  }

  private async _loadReferenceData(organizationId: string): Promise<ReferenceData> {
    const prisma = getPrisma();
    const scope = { organizationId, deletedAt: null, isActive: true };
    const select = { id: true, name: true, code: true } as const;

    const [units, categories, brands, taxes] = await Promise.all([
      prisma.unit.findMany({ where: scope, select, orderBy: { name: 'asc' } }),
      prisma.category.findMany({ where: scope, select, orderBy: { name: 'asc' } }),
      prisma.brand.findMany({ where: scope, select, orderBy: { name: 'asc' } }),
      prisma.tax.findMany({ where: scope, select, orderBy: { name: 'asc' } }),
    ]);

    return { units, categories, brands, taxes };
  }

  private _buildProductsSheet(
    workbook: ExcelJS.Workbook,
    brand: WorkbookBrand,
    reference: ReferenceData,
  ) {
    const sheet = workbook.addWorksheet('Products');
    const lastColumn = PRODUCT_IMPORT_COLUMNS.length;
    const headerRow = writeBrandHeader(sheet, brand, lastColumn);

    PRODUCT_IMPORT_COLUMNS.forEach((column, index) => {
      const cell = sheet.getCell(headerRow, index + 1);
      cell.value = column.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.note = column.required ? `${column.note}\n\nRequired.` : column.note;
      sheet.getColumn(index + 1).width = column.key === 'description' ? 40 : 20;
    });
    sheet.getRow(headerRow).height = 32;

    this._applyValidation(sheet, headerRow, reference);

    sheet.views = [{ state: 'frozen', ySplit: headerRow }];
    // Provenance goes in the print footer, not a cell: a footer row would sit inside
    // the data area and the importer would read it back as a product named
    // 'SmartShopPOS · ...'.
    sheet.headerFooter.oddFooter = [
      `&LSmartShopPOS · ${brand.organizationCode}`,
      `&CDocument ${brand.documentId}`,
      `&R${formatInTimeZone(brand.generatedAt, brand.timezone)}`,
    ].join('');
    attachLogo(workbook, sheet, brand, lastColumn);
  }

  private _applyValidation(sheet: ExcelJS.Worksheet, headerRow: number, reference: ReferenceData) {
    PRODUCT_IMPORT_COLUMNS.forEach((column, index) => {
      const letter = this._letter(index + 1);
      const listSource = LIST_COLUMN[column.kind];
      const listLetter = LIST_COLUMN_LETTER[column.kind];

      for (let offset = 1; offset <= VALIDATED_ROWS; offset += 1) {
        const cell = sheet.getCell(`${letter}${headerRow + offset}`);

        if (listSource && listLetter) {
          const entries = reference[listSource];
          if (entries.length === 0) continue;
          const range = `Lists!$${listLetter}$2:$${listLetter}$${entries.length + 1}`;
          cell.dataValidation = {
            type: 'list',
            allowBlank: !column.required,
            formulae: [range],
            showErrorMessage: true,
            errorTitle: `${column.header} not recognised`,
            error: `Choose a value from the dropdown, or add one under Catalog first.`,
          };
          continue;
        }

        if (column.kind === 'boolean') {
          cell.dataValidation = {
            type: 'list',
            allowBlank: true,
            formulae: ['"Yes,No"'],
            showErrorMessage: true,
            errorTitle: 'Use Yes or No',
            error: 'Enter Yes or No.',
          };
          continue;
        }

        if (column.kind === 'number' || column.kind === 'integer') {
          cell.dataValidation = {
            type: column.kind === 'number' ? 'decimal' : 'whole',
            operator: 'greaterThanOrEqual',
            allowBlank: !column.required,
            formulae: [0],
            showErrorMessage: true,
            errorTitle: 'Numbers only',
            error: 'Enter a number of zero or more.',
          };
          cell.numFmt = column.kind === 'number' ? '#,##0.00' : '#,##0';
        }
      }
    });
  }

  private _buildReadMeSheet(workbook: ExcelJS.Workbook, brand: WorkbookBrand) {
    const sheet = workbook.addWorksheet('Read me');
    sheet.getColumn(1).width = 26;
    sheet.getColumn(2).width = 22;
    sheet.getColumn(3).width = 80;

    let cursor = 1;
    writeMergedText(sheet, cursor++, 3, brand.organizationName, { bold: true, size: 16 });
    writeMergedText(sheet, cursor++, 3, brand.documentTitle, { bold: true, size: 12 });
    writeMergedText(
      sheet,
      cursor++,
      3,
      `Document ${brand.documentId}  ·  Generated by ${brand.generatedBy ?? 'SmartShopPOS'}`,
      { size: 9, color: { argb: 'FF6B7280' } },
    );

    cursor += 1;
    writeMergedText(sheet, cursor++, 3, 'How to use this file', { bold: true, size: 11 });

    const instructions = [
      'Fill in the Products sheet. One product per row, starting on the first empty row below the headers.',
      'Do not rename, reorder or delete the columns. The importer matches them by name.',
      'Unit, Category, Brand and Tax Rate accept only values that exist in your catalog. Check the Reference sheet, and create anything missing before uploading.',
      'Product Name, Product Code and Unit are required. Prices must be zero or more.',
      'Save the file, then upload it under Administration > Data. The warehouse you pick there receives the Opening Stock column.',
      'Rows that cannot be imported are reported back with the reason. Nothing is half-saved: each row either creates its product or fails on its own.',
    ];
    instructions.forEach((line, index) => {
      sheet.getCell(cursor, 1).value = `${index + 1}.`;
      const cell = sheet.getCell(cursor, 2);
      cell.value = line;
      cell.alignment = { wrapText: true, vertical: 'top' };
      sheet.mergeCells(cursor, 2, cursor, 3);
      sheet.getRow(cursor).height = 30;
      cursor += 1;
    });

    cursor += 1;
    writeMergedText(sheet, cursor++, 3, 'Column guide', { bold: true, size: 11 });

    const headerRow = cursor;
    ['Column', 'Required', 'Notes'].forEach((label, index) => {
      const cell = sheet.getCell(headerRow, index + 1);
      cell.value = label;
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    });
    cursor += 1;

    for (const column of PRODUCT_IMPORT_COLUMNS) {
      sheet.getCell(cursor, 1).value = column.header;
      sheet.getCell(cursor, 2).value = column.required ? 'Yes' : 'No';
      const noteCell = sheet.getCell(cursor, 3);
      noteCell.value = column.note;
      noteCell.alignment = { wrapText: true };
      cursor += 1;
    }

    cursor += 1;
    writeBrandFooter(sheet, cursor, 3, brand);
  }

  private _buildReferenceSheet(
    workbook: ExcelJS.Workbook,
    brand: WorkbookBrand,
    reference: ReferenceData,
  ) {
    const sheet = workbook.addWorksheet('Reference');
    ['Type', 'Name', 'Code', 'Id'].forEach((label, index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = label;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    });

    let cursor = 2;
    const groups: Array<[string, ReferenceItem[]]> = [
      ['Unit', reference.units],
      ['Category', reference.categories],
      ['Brand', reference.brands],
      ['Tax', reference.taxes],
    ];

    for (const [label, items] of groups) {
      for (const item of items) {
        sheet.getCell(cursor, 1).value = label;
        sheet.getCell(cursor, 2).value = item.name;
        sheet.getCell(cursor, 3).value = item.code;
        sheet.getCell(cursor, 4).value = item.id;
        cursor += 1;
      }
    }

    if (cursor === 2) {
      sheet.getCell(2, 1).value = 'No units, categories, brands or tax rates are set up yet.';
    }

    sheet.getColumn(1).width = 14;
    sheet.getColumn(2).width = 32;
    sheet.getColumn(3).width = 18;
    sheet.getColumn(4).width = 38;
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(cursor - 1, 2), column: 4 },
    };

    writeBrandFooter(sheet, cursor + 1, 4, brand);
  }

  private _buildListsSheet(workbook: ExcelJS.Workbook, reference: ReferenceData) {
    const sheet = workbook.addWorksheet('Lists');
    const groups: Array<[keyof ReferenceData, string]> = [
      ['units', 'Unit'],
      ['categories', 'Category'],
      ['brands', 'Brand'],
      ['taxes', 'Tax'],
    ];

    groups.forEach(([key, label], index) => {
      const cell = sheet.getCell(1, index + 1);
      cell.value = label;
      cell.font = { bold: true };
      reference[key].forEach((item, rowIndex) => {
        sheet.getCell(rowIndex + 2, index + 1).value = item.name;
      });
    });

    // Hidden: this sheet exists only to feed the dropdowns.
    sheet.state = 'hidden';
  }

  private _letter(index: number): string {
    let letter = '';
    let current = index;
    while (current > 0) {
      const remainder = (current - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      current = Math.floor((current - 1) / 26);
    }
    return letter;
  }
}
