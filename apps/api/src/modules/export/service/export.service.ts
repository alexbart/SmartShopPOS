import type { ReportColumn } from '../../../shared/report-registry.js';
import { reportRegistry } from '../../../shared/report-registry.js';
import { CsvFormatter } from '../formats/csv.js';
import { ExcelFormatter } from '../formats/excel.js';
import { PdfFormatter } from '../formats/pdf.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/business-error.js';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

interface ExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

interface ExportData {
  columns: ReportColumn[];
  rows: unknown[];
  title: string;
}

interface ExportFormatter {
  // eslint-disable-next-line no-unused-vars
  export(data: ExportData): Promise<Buffer>;
}

export class ExportService {
  private _formatters = new Map<ExportFormat, ExportFormatter>();

  constructor() {
    this._formatters.set('csv', new CsvFormatter());
    this._formatters.set('xlsx', new ExcelFormatter());
    this._formatters.set('pdf', new PdfFormatter());
  }

  /**
   * Extract rows from the report result data.
   * Handles paginated results, direct arrays, or objects with items.
   */
  private _extractRows(data: unknown): unknown[] {
    if (!data) return [];
    if (Array.isArray(data)) return data as unknown[];
    if (typeof data === 'object') {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.items)) return obj.items as unknown[];
      if (Array.isArray(obj.data)) return obj.data as unknown[];
    }
    return [];
  }

  // eslint-disable-next-line no-unused-vars
  async generate(
    reportName: string,
    format: ExportFormat,
    filters: Record<string, unknown> = {},
  ): Promise<ExportResult> {
    const report = reportRegistry.get(reportName);

    if (!report) {
      throw new NotFoundError(`Unknown report: ${reportName}`);
    }

    const formatter = this._formatters.get(format);
    if (!formatter) {
      throw new ValidationError(`Unsupported format: ${format}`);
    }

    const result = await report.execute(filters);
    const rows = this._extractRows(result);

    const exportData: ExportData = {
      columns: report.columns,
      rows,
      title: report.title,
    };

    const buffer = await formatter.export(exportData);

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileExt = format === 'xlsx' ? 'xlsx' : format;
    const filename = `${reportName.replace(/-/g, '')}-report-${timestamp}.${fileExt}`;

    return {
      buffer,
      contentType: this._getContentType(format),
      filename,
    };
  }

  private _getContentType(format: ExportFormat): string {
    switch (format) {
      case 'csv':
        return 'text/csv; charset=utf-8';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'pdf':
        return 'application/pdf';
    }
  }
}
