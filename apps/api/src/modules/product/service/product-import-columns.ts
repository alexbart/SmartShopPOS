/**
 * Single source of truth for the product import spreadsheet. The template
 * builder writes these columns and the parser reads them back, so a header
 * rename can never drift between the two.
 */

export type ProductImportColumnKind =
  'text' | 'number' | 'integer' | 'boolean' | 'unit' | 'category' | 'brand' | 'tax';

export interface ProductImportColumn {
  /** Field name used internally, never shown to the user. */
  key: string;
  /** Exact header written to the workbook. */
  header: string;
  kind: ProductImportColumnKind;
  required?: boolean;
  /** Shown as a cell note and in the Read me sheet. */
  note: string;
  aliases?: string[];
}

export const PRODUCT_IMPORT_COLUMNS: ProductImportColumn[] = [
  {
    key: 'name',
    header: 'Product Name',
    kind: 'text',
    required: true,
    note: 'The name staff will see at the till. Must be unique in your business.',
    aliases: ['name', 'product'],
  },
  {
    key: 'code',
    header: 'Product Code',
    kind: 'text',
    required: true,
    note: 'Your own item number or the barcode number. Must be unique.',
    aliases: ['code', 'itemcode'],
  },
  {
    key: 'unit',
    header: 'Unit',
    kind: 'unit',
    required: true,
    note: 'Pick from the list. Create missing units under Catalog > Units first.',
    aliases: ['unit', 'uom', 'unitofmeasure'],
  },
  {
    key: 'sku',
    header: 'SKU',
    kind: 'text',
    note: 'Optional. Must be unique when supplied.',
  },
  {
    key: 'barcode',
    header: 'Barcode',
    kind: 'text',
    note: 'Optional. Used by the scanner at the till.',
  },
  {
    key: 'description',
    header: 'Description',
    kind: 'text',
    note: 'Optional. Shown on the product page, never on the receipt.',
  },
  {
    key: 'category',
    header: 'Category',
    kind: 'category',
    note: 'Optional. Pick from the list.',
  },
  {
    key: 'brand',
    header: 'Brand',
    kind: 'brand',
    note: 'Optional. Pick from the list.',
  },
  {
    key: 'tax',
    header: 'Tax Rate',
    kind: 'tax',
    note: 'Optional. Pick from the list. Leave blank for untaxed items.',
    aliases: ['tax', 'vat', 'taxrate'],
  },
  {
    key: 'costPrice',
    header: 'Cost Price',
    kind: 'number',
    required: true,
    note: 'What you pay the supplier. Required, zero or more.',
  },
  {
    key: 'sellingPrice',
    header: 'Selling Price',
    kind: 'number',
    required: true,
    note: 'What the customer pays. Required, zero or more.',
  },
  {
    key: 'wholesalePrice',
    header: 'Wholesale Price',
    kind: 'number',
    note: 'Optional. Cannot exceed the selling price or be below the cost price.',
  },
  {
    key: 'discountPrice',
    header: 'Discount Price',
    kind: 'number',
    note: 'Optional. Cannot exceed the selling price.',
  },
  {
    key: 'lowStockThreshold',
    header: 'Low Stock Threshold',
    kind: 'integer',
    note: 'Optional. Warns you when stock drops to this level.',
  },
  {
    key: 'isActive',
    header: 'Active',
    kind: 'boolean',
    note: 'Yes or No. Blank counts as Yes.',
  },
  {
    key: 'initialStock',
    header: 'Opening Stock',
    kind: 'integer',
    note: 'Optional. Written to the warehouse chosen at upload time.',
  },
];

export function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const HEADER_LOOKUP = new Map<string, ProductImportColumn>();
for (const column of PRODUCT_IMPORT_COLUMNS) {
  HEADER_LOOKUP.set(normalizeHeader(column.header), column);
  for (const alias of column.aliases ?? []) {
    HEADER_LOOKUP.set(normalizeHeader(alias), column);
  }
}

export function resolveColumnByHeader(header: string): ProductImportColumn | undefined {
  return HEADER_LOOKUP.get(normalizeHeader(header));
}

/** Excel column letter for a 1-based index (1 -> A, 27 -> AA). */
export function columnLetter(index: number): string {
  let letter = '';
  let current = index;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    current = Math.floor((current - 1) / 26);
  }
  return letter;
}
