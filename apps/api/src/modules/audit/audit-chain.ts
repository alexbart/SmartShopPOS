import { randomUUID } from 'node:crypto';
import { AuditAction, Prisma, type PrismaClient } from '@prisma/client';
import type { CreateAuditLogModel } from '../auth/repositories/models/create-audit-log.model.js';
import { hashAuditValue } from './audit-integrity.js';

type AuditDatabase = PrismaClient | Prisma.TransactionClient;

export async function writeHashedAuditEvent(
  database: AuditDatabase,
  event: CreateAuditLogModel & {
    actorName?: string;
    roles?: string[];
    route?: string;
    method?: string;
    outcome?: 'SUCCESS' | 'FAILED' | 'DENIED';
    summary?: string;
  },
) {
  const persist = async (tx: Prisma.TransactionClient) => {
    const orgIdHash = Math.abs(
      event.organizationId.split('-').reduce((acc, part) => {
        let hash = 0;
        for (let i = 0; i < part.length; i++) {
          hash = (hash << 5) - hash + part.charCodeAt(i);
          hash |= 0;
        }
        return acc ^ hash;
      }, 0) & 0x7fffffff,
    );
    // pg_advisory_xact_lock() returns void, which $queryRaw cannot deserialize; cast it to text.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${orgIdHash})::text AS locked`;
    const previous = await tx.auditLog.findFirst({
      where: { organizationId: event.organizationId, chainSequence: { not: null } },
      orderBy: { chainSequence: 'desc' },
      select: { eventHash: true, chainSequence: true },
    });
    const previousHash = previous?.eventHash ?? null;
    const chainSequence = (previous?.chainSequence ?? 0n) + 1n;
    const createdAt = new Date();

    let actorName = event.actorName;
    let branchId = event.branchId;
    let roles = event.roles;
    if (event.actorId && (!actorName || !branchId || !roles)) {
      const actor = await tx.user.findFirst({
        where: { id: event.actorId, organizationId: event.organizationId },
        select: {
          firstName: true,
          lastName: true,
          branchId: true,
          roles: { select: { role: { select: { name: true } } } },
        },
      });
      if (actor) {
        actorName ??= `${actor.firstName} ${actor.lastName}`.trim();
        branchId ??= actor.branchId;
        roles ??= actor.roles.map(({ role }) => role.name);
      }
    }

    const action = event.action as AuditAction;
    const outcome = event.outcome ?? 'SUCCESS';
    const summary = (event.summary ?? `${event.action} ${event.entity}`).slice(0, 500);
    const oldValues = event.oldValues ?? null;
    const newValues = event.newValues ?? null;
    const hashData = {
      id: randomUUID(),
      organizationId: event.organizationId,
      actorId: event.actorId ?? null,
      actorName: actorName ?? null,
      branchId: branchId ?? null,
      roleId: event.roleId ?? null,
      roles: roles ?? [],
      action,
      entity: event.entity,
      entityId: event.entityId,
      route: event.route ?? null,
      method: event.method ?? null,
      outcome,
      summary,
      oldValues,
      newValues,
      ipAddress: event.ipAddress ?? null,
      userAgent: event.userAgent ?? null,
      requestId: event.requestId ?? null,
      chainSequence: chainSequence.toString(),
      createdAt: createdAt.toISOString(),
      previousHash,
    };
    const id = hashData.id;
    const eventHash = hashAuditValue(hashData);

    await tx.auditLog.create({
      data: {
        id,
        organizationId: event.organizationId,
        actorId: event.actorId,
        actorName,
        roles: (roles ?? []) as Prisma.InputJsonValue,
        branchId,
        roleId: event.roleId,
        action,
        entity: event.entity,
        entityId: event.entityId,
        route: event.route,
        method: event.method,
        outcome,
        summary,
        oldValues: oldValues === null ? Prisma.JsonNull : (oldValues as Prisma.InputJsonValue),
        newValues: newValues === null ? Prisma.JsonNull : (newValues as Prisma.InputJsonValue),
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        requestId: event.requestId,
        createdAt,
        previousHash,
        eventHash,
        chainSequence,
      },
    });
  };

  const transaction = (database as PrismaClient).$transaction;
  if (typeof transaction === 'function') return transaction.call(database, persist);
  return persist(database as Prisma.TransactionClient);
}
