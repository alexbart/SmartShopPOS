import type { FastifyRequest, FastifyReply } from 'fastify';
import type { WorkflowService } from '../service/workflow.service.js';
import { WorkflowAction } from '../../../shared/constants/domain-constants.js';

export class WorkflowController {
  constructor(private readonly _workflowService: WorkflowService) {}

  async requestApproval(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as {
      action: string;
      entityType: string;
      entityId: string;
      amount?: number;
      branchId?: string;
    };

    const requestEntity = await this._workflowService.requestApproval({
      organizationId: request.requestContext.organizationId,
      action: body.action as WorkflowAction,
      entityType: body.entityType,
      entityId: body.entityId,
      amount: body.amount,
      branchId: body.branchId,
      requestedBy: request.requestContext.userId,
      requesterRoleId: request.requestContext.roleId ?? '',
    });

    return reply.status(200).send({
      success: true,
      message: 'Approval request created.',
      data: requestEntity,
    });
  }

  async pending(request: FastifyRequest, reply: FastifyReply) {
    const requests = await this._workflowService.getPendingRequests(
      request.requestContext.organizationId,
      request.requestContext.roleId ?? '',
    );

    return reply.status(200).send({
      success: true,
      message: 'Pending requests retrieved.',
      data: requests,
    });
  }

  async history(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as { entityType?: string; entityId?: string };
    if (!query.entityType || !query.entityId) {
      return reply.status(400).send({ success: false, message: 'entityType and entityId are required.' });
    }

    const requests = await this._workflowService.getRequestHistory(
      request.requestContext.organizationId,
      query.entityType,
      query.entityId,
    );

    return reply.status(200).send({
      success: true,
      message: 'Request history retrieved.',
      data: requests,
    });
  }

  async approve(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const result = await this._workflowService.approveRequest({
      requestId: id,
      organizationId: request.requestContext.organizationId,
      approverId: request.requestContext.userId,
      approverRole: request.requestContext.roles?.[0] ?? '',
      comments: (request.body as { comments?: string })?.comments,
    });

    return reply.status(200).send({
      success: true,
      message: 'Request approved.',
      data: result,
    });
  }

  async reject(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    const result = await this._workflowService.rejectRequest({
      requestId: id,
      organizationId: request.requestContext.organizationId,
      approverId: request.requestContext.userId,
      approverRole: request.requestContext.roles?.[0] ?? '',
      comments: (request.body as { comments?: string })?.comments,
    });

    return reply.status(200).send({
      success: true,
      message: 'Request rejected.',
      data: result,
    });
  }
}
