import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ProductImportService } from '../service/product-import.service.js';
import {
  productImportUploadSchema,
  type ProductImportJobInput,
  type ProductImportRowInput,
} from '../dto/product-import.dto.js';
import { ProductImportParserService } from '../service/product-import-parser.service.js';
import { ProductImportTemplateService } from '../service/product-import-template.service.js';
import { ValidationError } from '../../../shared/errors/business-error.js';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Base64 inflates a file by a third, so this covers a ~15 MB workbook. */
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export class ProductImportController {
  private readonly _parser = new ProductImportParserService();
  private readonly _template = new ProductImportTemplateService();

  constructor(private readonly _productImportService: ProductImportService) {}

  async downloadTemplate(request: FastifyRequest, reply: FastifyReply) {
    const result = await this._template.generate(request.requestContext.organizationId, {
      userId: request.requestContext.userId,
    });

    reply.header('Content-Type', XLSX_CONTENT_TYPE);
    reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);
    reply.header('Content-Length', result.buffer.length);
    // Surfaced by the UI so the downloaded file can be traced to an audit event.
    reply.header('X-Document-Id', result.brand.documentId);

    return reply.send(result.buffer);
  }

  async uploadWorkbook(request: FastifyRequest, reply: FastifyReply) {
    const parsedBody = productImportUploadSchema.safeParse(request.body ?? {});
    if (!parsedBody.success) {
      throw new ValidationError(parsedBody.error.issues.map((issue) => issue.message).join(' '));
    }

    const buffer = this._decode(parsedBody.data.contentBase64);
    const parsed = await this._parser.parse(buffer);

    const job = await this._productImportService.createImportJobWithRows(
      {
        organizationId: request.requestContext.organizationId,
        warehouseId: parsedBody.data.warehouseId,
        sourceName: parsedBody.data.fileName || 'Product Import',
        userId: request.requestContext.userId,
      },
      parsed.rows,
    );

    return reply.status(201).send({
      success: true,
      message: `Read ${parsed.rows.length} product row${
        parsed.rows.length === 1 ? '' : 's'
      } from '${parsed.sheetName}'.`,
      data: {
        jobId: job.id,
        status: job.status,
        totalRows: job.totalRows,
        sheetName: parsed.sheetName,
        ignoredHeaders: parsed.ignoredHeaders,
      },
    });
  }

  private _decode(value: string): Buffer {
    // Accept both a raw base64 string and a data URL from the file picker.
    const payload = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
    const buffer = Buffer.from(payload, 'base64');

    if (buffer.length === 0) {
      throw new ValidationError('That file is empty.');
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new ValidationError(
        'That file is larger than 15 MB. Split it into smaller files and import them in batches.',
      );
    }
    return buffer;
  }

  async createImportJob(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as ProductImportJobInput;

    const job = await this._productImportService.createImportJob(
      request.requestContext.organizationId,
      body.warehouseId,
      body.sourceName,
      request.requestContext.userId,
    );

    return reply.status(201).send({
      success: true,
      message: 'Import job created successfully.',
      data: {
        jobId: job.id,
        status: job.status,
        totalRows: job.totalRows,
        completedRows: job.completedRows,
        createdAt: job.createdAt,
      },
    });
  }

  async createImportJobWithRows(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      warehouseId: string;
      sourceName?: string;
      rows: Array<{ rowNumber: number; data: ProductImportRowInput }>;
    };

    const job = await this._productImportService.createImportJobWithRows(
      {
        organizationId: request.requestContext.organizationId,
        warehouseId: body.warehouseId,
        sourceName: body.sourceName,
        userId: request.requestContext.userId,
      },
      body.rows,
    );

    return reply.status(201).send({
      success: true,
      message: 'Import job with rows created successfully.',
      data: {
        jobId: job.id,
        status: job.status,
        totalRows: job.totalRows,
        completedRows: job.completedRows,
        createdAt: job.createdAt,
      },
    });
  }

  async getImportJobStatus(request: FastifyRequest, reply: FastifyReply) {
    const { jobId } = request.params as { jobId: string };

    const status = await this._productImportService.getImportJobStatus(
      jobId,
      request.requestContext.organizationId,
    );

    if (!status) {
      return reply.status(404).send({
        success: false,
        message: 'Import job not found.',
        data: null,
      });
    }

    return reply.status(200).send({
      success: true,
      message: 'Import job status retrieved successfully.',
      data: status,
    });
  }

  async processImportJob(request: FastifyRequest, reply: FastifyReply) {
    const { jobId } = request.params as { jobId: string };
    const options = request.body as {
      chunkSize?: number;
      maxRetries?: number;
    };

    const result = await this._productImportService.processImportJob(
      jobId,
      request.requestContext.organizationId,
      request.requestContext.userId,
      options,
    );

    return reply.status(200).send({
      success: true,
      message: 'Import job processed successfully.',
      data: result,
    });
  }
}
