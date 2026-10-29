import type { IWorkflowRepository, ApprovalRequestEntity, CreateApprovalRuleCommand, RequestApprovalCommand, ApprovalDecisionCommand } from '../repository/workflow.repository.js';
import { BadRequestError, ConflictError } from '../../../shared/errors/business-error.js';

export class WorkflowService {
  constructor(private readonly _repository: IWorkflowRepository) {}

  async createRule(command: CreateApprovalRuleCommand) {
    return this._repository.createRule(command);
  }

  async requestApproval(command: RequestApprovalCommand): Promise<ApprovalRequestEntity> {
    if (!command.entityId) {
      throw new BadRequestError('entityId is required.');
    }

    const existing = await this._repository.findRequestHistory(
      command.organizationId,
      command.entityType,
      command.entityId,
    );

    const pending = existing.filter((r) => r.status === 'PENDING');
    if (pending.length > 0) {
      throw new ConflictError('A pending approval request already exists for this entity.');
    }

    return this._repository.createRequest(command);
  }

  async getPendingRequests(organizationId: string, approverRole: string) {
    return this._repository.findPendingRequests(organizationId, approverRole);
  }

  async getRequestById(id: string, organizationId: string) {
    return this._repository.findRequestById(id, organizationId);
  }

  async approveRequest(command: ApprovalDecisionCommand) {
    return this._repository.approveRequest(command);
  }

  async rejectRequest(command: ApprovalDecisionCommand) {
    return this._repository.rejectRequest(command);
  }

  async getRequestHistory(organizationId: string, entityType: string, entityId: string) {
    return this._repository.findRequestHistory(organizationId, entityType, entityId);
  }
}
