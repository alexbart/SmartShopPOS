import { ExportService, type ExportFormat } from '../service/export.service.js';

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

    const filters = {
      organizationId,
      ...rest,
    };

    return this._exportService.generate(report, normalizedFormat, filters);
  }
}
