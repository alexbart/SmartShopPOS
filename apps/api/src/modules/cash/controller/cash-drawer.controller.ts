import type { FastifyRequest, FastifyReply } from 'fastify';
import type { CashDrawerService } from '../service/cash-drawer.service.js';

export class CashDrawerController {
  constructor(private readonly _cashDrawerService: CashDrawerService) {}

  async open(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as { openingFloat: number };
    const branchId = request.requestContext.branchId;

    const session = await this._cashDrawerService.openSession(
      branchId,
      request.requestContext.organizationId,
      request.requestContext.userId,
      Number(body.openingFloat),
    );

    return reply.status(200).send({
      success: true,
      message: 'Cash drawer opened successfully.',
      data: session,
    });
  }

  async close(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as { countedCash: number };

    const session = await this._cashDrawerService.closeSession(id, Number(body.countedCash));

    return reply.status(200).send({
      success: true,
      message: 'Cash drawer closed successfully.',
      data: session,
    });
  }

  async cashIn(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as { amount: number; notes?: string };

    await this._cashDrawerService.cashIn(id, Number(body.amount), body.notes, request.requestContext.userId);

    return reply.status(200).send({
      success: true,
      message: 'Cash added to drawer successfully.',
    });
  }

  async cashOut(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const body = request.body as { amount: number; notes?: string };

    await this._cashDrawerService.cashOut(id, Number(body.amount), body.notes, request.requestContext.userId);

    return reply.status(200).send({
      success: true,
      message: 'Cash removed from drawer successfully.',
    });
  }

  async current(request: FastifyRequest, reply: FastifyReply) {
    const branchId = request.requestContext.branchId;

    const session = await this._cashDrawerService.getCurrentSession(
      branchId,
      request.requestContext.organizationId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Cash drawer session retrieved successfully.',
      data: session,
    });
  }

  async movements(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const movements = await this._cashDrawerService.getMovements(
      id,
      request.requestContext.organizationId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Movements retrieved successfully.',
      data: movements,
    });
  }
}
