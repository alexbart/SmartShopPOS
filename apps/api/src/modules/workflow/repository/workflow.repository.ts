import { WorkflowAction } from '../../../shared/constants/domain-constants.js';

export interface ApprovalRuleEntity {
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
}

export interface CreateApprovalRuleCommand {
  organizationId: string;
  action: WorkflowAction;
  minimumAmount?: number;
  maximumAmount?: number;
  approverRole: string;
  branchId?: string;
  priority?: number;
  isActive?: boolean;
}

export interface ApprovalRequestEntity {
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
}

export interface RequestApprovalCommand {
  organizationId: string;
  action: WorkflowAction;
  entityType: string;
  entityId: string;
  amount?: number;
  branchId?: string;
  requestedBy: string;
  requesterRoleId: string;
}

export interface ApprovalDecisionCommand {
  requestId: string;
  organizationId: string;
  approverId: string;
  approverRole: string;
  comments?: string;
}

export interface IWorkflowRepository {
  // eslint-disable-next-line no-unused-vars
  createRule(command: CreateApprovalRuleCommand): Promise<ApprovalRuleEntity>;
  // eslint-disable-next-line no-unused-vars
  findRules(organizationId: string, action: WorkflowAction, branchId?: string): Promise<ApprovalRuleEntity[]>;
  // eslint-disable-next-line no-unused-vars
  createRequest(command: RequestApprovalCommand): Promise<ApprovalRequestEntity>;
  // eslint-disable-next-line no-unused-vars
  findPendingRequests(organizationId: string, approverRole: string): Promise<ApprovalRequestEntity[]>;
  // eslint-disable-next-line no-unused-vars
  findRequestById(id: string, organizationId: string): Promise<ApprovalRequestEntity | null>;
  // eslint-disable-next-line no-unused-vars
  approveRequest(command: ApprovalDecisionCommand): Promise<ApprovalRequestEntity>;
  // eslint-disable-next-line no-unused-vars
  rejectRequest(command: ApprovalDecisionCommand): Promise<ApprovalRequestEntity>;
  // eslint-disable-next-line no-unused-vars
  findRequestHistory(organizationId: string, entityType: string, entityId: string): Promise<ApprovalRequestEntity[]>;
}
