import type { ReportColumn } from '../../../shared/report-registry.js';
import { reportRegistry } from '../../../shared/report-registry.js';
import { getPrisma } from '../../../shared/database/prisma.js';
import { writeHashedAuditEvent } from '../../audit/audit-chain.js';
import { buildWorkbookBrand, timestampedFilename, type WorkbookBrand } from '../branding.js';
import { CsvFormatter } from '../formats/csv.js';
import { ExcelFormatter } from '../formats/excel.js';
import { PdfFormatter } from '../formats/pdf.js';
import { NotFoundError, ValidationError } from '../../../shared/errors/business-error.js';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

/** Ceiling on rows in one file; a report is a shop-sized dataset, not a data dump. */
const MAX_EXPORT_ROWS = 5000;

export interface ExportContext {
  organizationId: string;
  actorId?: string;
  actorName?: string;
}

interface ExportResult {
  buffer: Buffer;
  contentType: string;
  filename: string;
}

interface ExportData {
  columns: ReportColumn[];
  rows: unknown[];
  title: string;
  brand?: WorkbookBrand;
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

  /**
   * A file export wants every row, so pagination must be explicit. The report
   * repositories offset by `(page - 1) * limit`, which turns into NaN - and a
   * Prisma 500 - when an export call leaves both unset.
   */
  private _withPagination(filters: Record<string, unknown>): Record<string, unknown> {
    return { ...filters, page: 1, limit: MAX_EXPORT_ROWS };
  }

  // eslint-disable-next-line no-unused-vars
  async generate(
    reportName: string,
    format: ExportFormat,
    filters: Record<string, unknown> = {},
    context?: ExportContext,
  ): Promise<ExportResult> {
    const report = reportRegistry.get(reportName);

    if (!report) {
      throw new NotFoundError(`Unknown report: ${reportName}`);
    }

    const formatter = this._formatters.get(format);
    if (!formatter) {
      throw new ValidationError(`Unsupported format: ${format}`);
    }

    const result = await report.execute(this._withPagination(filters));
    const rows = this._extractRows(result);

    const organizationId =
      context?.organizationId ?? (filters.organizationId as string | undefined);
    const brand =
      format === 'xlsx' && organizationId
        ? await buildWorkbookBrand({
            organizationId,
            documentTitle: report.title,
            documentIdPrefix: 'RPT',
            generatedBy: context?.actorName,
          })
        : undefined;

    const exportData: ExportData = {
      columns: report.columns,
      rows,
      title: report.title,
      brand,
    };

    const buffer = await formatter.export(exportData);

    const fileExt = format === 'xlsx' ? 'xlsx' : format;
    // 'expense-report' should not become 'expense-report-report-...'.
    const baseName = reportName.endsWith('report') ? reportName : `${reportName}-report`;
    const filename = `${timestampedFilename(baseName, brand?.generatedAt ?? new Date())}.${fileExt}`;

    if (organizationId) {
      try {
        await writeHashedAuditEvent(getPrisma(), {
          organizationId,
          actorId: context?.actorId,
          actorName: context?.actorName,
          action: 'EXPORT',
          entity: 'Report',
          entityId: reportName,
          outcome: 'SUCCESS',
          summary: `Exported ${report.title} as ${format.toUpperCase()} (${rows.length} rows)`,
          newValues: {
            report: reportName,
            format,
            rowCount: rows.length,
            filename,
            documentId: brand?.documentId,
          },
        });
      } catch {
        // A failed audit write must not cost the user their download.
      }
    }

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
