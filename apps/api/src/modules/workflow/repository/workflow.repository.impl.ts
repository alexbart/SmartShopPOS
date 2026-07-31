import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { WorkflowAction } from '../../../shared/constants/domain-constants.js';
import type {
  IWorkflowRepository,
  ApprovalRuleEntity,
  CreateApprovalRuleCommand,
  ApprovalRequestEntity,
  RequestApprovalCommand,
  ApprovalDecisionCommand,
} from './workflow.repository.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../../../shared/errors/business-error.js';

export class WorkflowRepositoryImpl implements IWorkflowRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async createRule(command: CreateApprovalRuleCommand): Promise<ApprovalRuleEntity> {
    const rule = await this._prisma.approvalRule.create({
      data: {
        organizationId: command.organizationId,
        action: command.action,
        minimumAmount: command.minimumAmount,
        maximumAmount: command.maximumAmount,
        approverRole: command.approverRole,
        branchId: command.branchId,
        priority: command.priority ?? 0,
        isActive: command.isActive ?? true,
      },
    });

    return this._toRuleEntity(rule);
  }

  async findRules(
    organizationId: string,
    action: WorkflowAction,
    branchId?: string,
  ): Promise<ApprovalRuleEntity[]> {
    const where: { organizationId: string; action: WorkflowAction; isActive: boolean; branchId?: string } = {
      organizationId,
      action,
      isActive: true,
    };

    if (branchId) {
      where.branchId = branchId;
    }

    const rules = await this._prisma.approvalRule.findMany({
      where,
      orderBy: { priority: 'asc' },
    });

    return rules.map((r) => this._toRuleEntity(r));
  }

  async createRequest(command: RequestApprovalCommand): Promise<ApprovalRequestEntity> {
    let matchedRule = await this._findMatchingRule(command);

    if (!matchedRule) {
      return this._prisma.approvalRequest.create({
        data: {
          organizationId: command.organizationId,
          action: command.action,
          entityType: command.entityType,
          entityId: command.entityId,
          amount: command.amount,
          branchId: command.branchId,
          ruleId: null,
          requestedBy: command.requestedBy,
          status: 'APPROVED',
          approvedBy: command.requestedBy,
          approvedAt: new Date(),
          comments: 'Auto-approved: no matching rule found.',
        },
      }).then((r) => this._toRequestEntity(r));
    }

    matchedRule = await this._prisma.approvalRule.findUnique({
      where: { id: matchedRule.id },
    });

    return this._prisma.approvalRequest.create({
      data: {
        organizationId: command.organizationId,
        action: command.action,
        entityType: command.entityType,
        entityId: command.entityId,
        amount: command.amount,
        branchId: command.branchId,
        ruleId: matchedRule!.id,
        requestedBy: command.requestedBy,
        status: 'PENDING',
      },
    }).then((r) => this._toRequestEntity(r));
  }

  async findPendingRequests(organizationId: string, approverRole: string): Promise<ApprovalRequestEntity[]> {
    const rules = await this._prisma.approvalRule.findMany({
      where: {
        organizationId,
        approverRole,
        isActive: true,
      },
      select: { id: true },
    });

    const ruleIds = rules.map((r) => r.id);

    const requests = await this._prisma.approvalRequest.findMany({
      where: {
        organizationId,
        status: 'PENDING',
        ruleId: { in: ruleIds.length > 0 ? ruleIds : undefined },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => this._toRequestEntity(r));
  }

  async findRequestById(id: string, organizationId: string): Promise<ApprovalRequestEntity | null> {
    const request = await this._prisma.approvalRequest.findFirst({
      where: { id, organizationId },
    });

    if (!request) return null;
    return this._toRequestEntity(request);
  }

  async approveRequest(command: ApprovalDecisionCommand): Promise<ApprovalRequestEntity> {
    return this._prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findFirst({
        where: {
          id: command.requestId,
          organizationId: command.organizationId,
        },
        include: { rule: true },
      });

      if (!request) {
        throw new NotFoundError('Approval request not found.');
      }

      if (request.status !== 'PENDING') {
        throw new ConflictError('Approval request has already been processed.');
      }

      if (request.rule.approverRole !== command.approverRole) {
        throw new ForbiddenError('You do not have permission to approve this request.');
      }

      const updated = await tx.approvalRequest.update({
        where: { id: command.requestId },
        data: {
          status: 'APPROVED',
          approvedBy: command.approverId,
          approvedAt: new Date(),
          comments: command.comments,
        },
        include: { rule: true },
      });

      return this._toRequestEntity(updated);
    });
  }

  async rejectRequest(command: ApprovalDecisionCommand): Promise<ApprovalRequestEntity> {
    return this._prisma.$transaction(async (tx) => {
      const request = await tx.approvalRequest.findFirst({
        where: {
          id: command.requestId,
          organizationId: command.organizationId,
        },
        include: { rule: true },
      });

      if (!request) {
        throw new NotFoundError('Approval request not found.');
      }

      if (request.status !== 'PENDING') {
        throw new ConflictError('Approval request has already been processed.');
      }

      if (request.rule.approverRole !== command.approverRole) {
        throw new ForbiddenError('You do not have permission to reject this request.');
      }

      const updated = await tx.approvalRequest.update({
        where: { id: command.requestId },
        data: {
          status: 'REJECTED',
          approvedBy: command.approverId,
          approvedAt: new Date(),
          comments: command.comments,
        },
        include: { rule: true },
      });

      return this._toRequestEntity(updated);
    });
  }

  async findRequestHistory(
    organizationId: string,
    entityType: string,
    entityId: string,
  ): Promise<ApprovalRequestEntity[]> {
    const requests = await this._prisma.approvalRequest.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => this._toRequestEntity(r));
  }

  private async _findMatchingRule(command: RequestApprovalCommand) {
    const rules = await this.findRules(command.organizationId, command.action, command.branchId);

    for (const rule of rules) {
      const amount = command.amount ?? 0;
      const minMatch = rule.minimumAmount === null || amount >= Number(rule.minimumAmount);
      const maxMatch = rule.maximumAmount === null || amount <= Number(rule.maximumAmount);

      if (minMatch && maxMatch) {
        return rule;
      }
    }

    const globalRules = await this._prisma.approvalRule.findMany({
      where: {
        organizationId: command.organizationId,
        action: command.action,
        isActive: true,
        branchId: null,
      },
      orderBy: { priority: 'asc' },
    });

    for (const rule of globalRules) {
      const amount = command.amount ?? 0;
      const minMatch = rule.minimumAmount === null || amount >= Number(rule.minimumAmount);
      const maxMatch = rule.maximumAmount === null || amount <= Number(rule.maximumAmount);

      if (minMatch && maxMatch) {
        return rule;
      }
    }

    return null;
  }

  private _toRuleEntity(rule: {
    id: string;
    organizationId: string;
    action: WorkflowAction;
    minimumAmount: number | null;
    maximumAmount: number | null;
    approverRole: string;
    branchId: string | null;
    priority: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ApprovalRuleEntity {
    return {
      id: rule.id,
      organizationId: rule.organizationId,
      action: rule.action,
      minimumAmount: rule.minimumAmount ? Number(rule.minimumAmount) : null,
      maximumAmount: rule.maximumAmount ? Number(rule.maximumAmount) : null,
      approverRole: rule.approverRole,
      branchId: rule.branchId,
      priority: rule.priority,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }

  private _toRequestEntity(request: {
    id: string;
    organizationId: string;
    action: WorkflowAction;
    entityType: string;
    entityId: string;
    amount: number | null;
    branchId: string | null;
    ruleId: string | null;
    requestedBy: string;
    status: string;
    approvedBy: string | null;
    approvedAt: Date | null;
    comments: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ApprovalRequestEntity {
    return {
      id: request.id,
      organizationId: request.organizationId,
      action: request.action,
      entityType: request.entityType,
      entityId: request.entityId,
      amount: request.amount ? Number(request.amount) : null,
      branchId: request.branchId,
      ruleId: request.ruleId,
      requestedBy: request.requestedBy,
      status: request.status,
      approvedBy: request.approvedBy,
      approvedAt: request.approvedAt,
      comments: request.comments,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    };
  }
}
