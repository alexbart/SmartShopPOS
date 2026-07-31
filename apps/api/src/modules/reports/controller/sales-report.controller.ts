import type { FastifyRequest, FastifyReply } from 'fastify';
import type { SalesReportService } from '../service/sales-report.service.js';

export class SalesReportController {
  constructor(private readonly _salesReportService: SalesReportService) {}

  async getSalesReport(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      from?: string;
      to?: string;
      branchId?: string;
      cashierId?: string;
      customerId?: string;
      paymentMethod?: string;
      status?: string;
      page?: string;
      limit?: string;
    };

    const filters = {
      organizationId: request.requestContext.organizationId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      branchId: query.branchId,
      cashierId: query.cashierId,
      customerId: query.customerId,
      paymentMethod: query.paymentMethod,
      status: query.status,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    };

    const report = await this._salesReportService.getSalesReport(filters);

    return reply.status(200).send({
      success: true,
      message: 'Sales report retrieved successfully.',
      data: report,
    });
  }
}
