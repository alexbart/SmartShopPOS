import { Prisma, PrismaClient } from '@prisma/client';
import type { IAuditLogRepository } from './audit-log.repository.js';
import { writeHashedAuditEvent } from '../../audit/audit-chain.js';

export class AuditLogRepositoryImpl implements IAuditLogRepository {
  constructor(private readonly _prisma: PrismaClient | Prisma.TransactionClient) {}

  async create(_model: Parameters<IAuditLogRepository['create']>[0]) {
    await writeHashedAuditEvent(this._prisma, _model);
  }
}
