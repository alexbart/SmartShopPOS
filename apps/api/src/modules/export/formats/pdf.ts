import PDFDocument from 'pdfkit';
import type { ReportColumn } from '../../../shared/report-registry.js';

interface ExportData {
  columns: ReportColumn[];
  rows: unknown[];
  title?: string;
}

export class PdfFormatter {
  static readonly contentType = 'application/pdf';

  constructor(private readonly _title = 'Report') {}

  // eslint-disable-next-line no-unused-vars
  async export(data: ExportData): Promise<Buffer> {
    const { columns, rows, title } = data;

    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 30 });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      if (title) {
        doc.fontSize(16).font('Helvetica-Bold').text(title);
        doc.moveDown(0.5);
      }

      doc.fontSize(8);

      const pageWidth = doc.page.width - 60;
      const colWidth = pageWidth / columns.length;

      doc.font('Helvetica-Bold');
      columns.forEach((col) => {
        doc.text(col.label, { continued: true, width: colWidth, align: 'left' });
      });
      doc.moveDown(0.3);
      doc.font('Helvetica');

      rows.forEach((row) => {
        columns.forEach((col) => {
          const val = (row as Record<string, unknown>)?.[col.key];
          doc.text(this._formatValue(val), { continued: true, width: colWidth, align: 'left' });
        });
        doc.moveDown(0.2);
      });

      doc.end();
    });
  }

  private _formatValue(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (val instanceof Date) return val.toISOString().split('T')[0];
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  }
}
