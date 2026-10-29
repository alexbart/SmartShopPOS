export interface CreateAuditLogModel {
  organizationId: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  branchId?: string;
  roleId?: string;
}
