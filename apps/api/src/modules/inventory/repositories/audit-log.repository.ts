export interface IAuditLogRepository {
  create(_model: CreateAuditLogModel): Promise<void>;
}

export interface CreateAuditLogModel {
  organizationId: string;
  actorId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
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
