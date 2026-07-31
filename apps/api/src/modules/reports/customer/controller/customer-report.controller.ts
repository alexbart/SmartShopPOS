import type { FastifyRequest, FastifyReply } from 'fastify';
import type { CustomerReportService } from '../service/customer-report.service.js';

export class CustomerReportController {
  constructor(private readonly _customerReportService: CustomerReportService) {}

  async getCustomerSummary(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      search?: string;
      isActive?: string;
      page?: string;
      limit?: string;
    };

    const filters = {
      organizationId: request.requestContext.organizationId,
      search: query.search,
      isActive: query.isActive === undefined ? undefined : query.isActive === 'true',
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    };

    const report = await this._customerReportService.getCustomerSummary(filters);

    return reply.status(200).send({
      success: true,
      message: 'Customer summary report retrieved successfully.',
      data: report,
    });
  }

  async getCustomerPurchases(request: FastifyRequest, reply: FastifyReply) {
    const { customerId } = request.params as { customerId: string };
    const query = request.query as {
      from?: string;
      to?: string;
      branchId?: string;
      page?: string;
      limit?: string;
    };

    const filters = {
      organizationId: request.requestContext.organizationId,
      customerId,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      branchId: query.branchId,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    };

    const report = await this._customerReportService.getCustomerPurchases(filters);

    return reply.status(200).send({
      success: true,
      message: 'Customer purchase history retrieved successfully.',
      data: report,
    });
  }

  async getTopCustomers(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { limit?: string };

    const filters = {
      organizationId: request.requestContext.organizationId,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
    };

    const report = await this._customerReportService.getTopCustomers(filters);

    return reply.status(200).send({
      success: true,
      message: 'Top customers report retrieved successfully.',
      data: report,
    });
  }
}
