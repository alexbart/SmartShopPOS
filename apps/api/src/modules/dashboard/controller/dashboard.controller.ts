import type { FastifyRequest, FastifyReply } from 'fastify';
import type { DashboardService } from '../service/dashboard.service.js';

export class DashboardController {
  constructor(private readonly _dashboardService: DashboardService) {}

  async getDashboard(request: FastifyRequest, reply: FastifyReply) {
    const dashboard = await this._dashboardService.getDashboard(
      request.requestContext.organizationId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Dashboard retrieved successfully.',
      data: dashboard,
    });
  }
}
