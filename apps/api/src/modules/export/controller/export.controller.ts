import { ExportService, type ExportContext, type ExportFormat } from '../service/export.service.js';

export interface ExportRequestQuery {
  report: string;
  format: ExportFormat;
  [key: string]: unknown;
}

export class ExportController {
  constructor(private readonly _exportService = new ExportService()) {}

  async export(
    query: ExportRequestQuery,
    organizationId: string,
    actor?: { actorId?: string; actorName?: string },
  ): Promise<{
    buffer: Buffer;
    contentType: string;
    filename: string;
  }> {
    const { report, format, ...rest } = query;

    if (!report) {
      throw new Error('Report name is required');
    }

    if (!format) {
      throw new Error('Format is required');
    }

    const normalizedFormat = format as ExportFormat;

    const normalizedFilters = Object.fromEntries(
      Object.entries(rest).map(([key, value]) => {
        if ((key === 'from' || key === 'to' || key === 'date') && typeof value === 'string') {
          return [key, new Date(value)];
        }
        if ((key === 'page' || key === 'limit') && typeof value === 'string') {
          return [key, Number(value)];
        }
        return [key, value];
      }),
    );

    const filters = {
      organizationId,
      ...normalizedFilters,
    };

    const context: ExportContext = {
      organizationId,
      actorId: actor?.actorId,
      actorName: actor?.actorName,
    };

    return this._exportService.generate(report, normalizedFormat, filters, context);
  }
}
