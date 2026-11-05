import type { FastifyRequest, FastifyReply } from 'fastify';
import type { ProductImportService } from '../service/product-import.service.js';
import type { ProductImportJobInput, ProductImportRowInput } from '../dto/product-import.dto.js';

export class ProductImportController {
  constructor(private readonly _productImportService: ProductImportService) {}

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
