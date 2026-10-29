import { PrismaClient, Prisma } from '@prisma/client';
import type { IAuditLogRepository } from './audit-log.repository.js';

export class AuditLogRepositoryImpl implements IAuditLogRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(_model: Parameters<IAuditLogRepository['create']>[0]) {
    await this._prisma.auditLog.create({
      data: {
        organizationId: _model.organizationId,
        actorId: _model.actorId,
        action: _model.action,
        entity: _model.entity,
        entityId: _model.entityId,
        oldValues: (_model.oldValues ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        newValues: (_model.newValues ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        ipAddress: _model.ipAddress,
        userAgent: _model.userAgent,
        requestId: _model.requestId,
        branchId: _model.branchId,
        roleId: _model.roleId,
      },
    });
  }
}
