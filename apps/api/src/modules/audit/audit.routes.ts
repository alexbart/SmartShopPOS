import type { FastifyPluginAsync } from 'fastify';
import { AuditAction, Prisma } from '@prisma/client';
import { createAuthenticateHook, createAuthorizeHook } from '../auth/middleware/auth.middleware.js';
import { AuthRepositoryImpl } from '../auth/repositories/auth.repository.impl.js';
import { JwtService } from '../../shared/services/jwt/jwt.service.js';
import { getPrisma } from '../../shared/database/prisma.js';
import { hashAuditValue } from './audit-integrity.js';
import { PdfFormatter } from '../export/formats/pdf.js';

const prisma = getPrisma();
const validActions = new Set<string>(Object.values(AuditAction));

export const auditRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = createAuthenticateHook(new JwtService(), new AuthRepositoryImpl(prisma));
  const authorizeRead = createAuthorizeHook(['audit:read']);

  fastify.get(
    '/export.pdf',
    { preHandler: [authenticate, authorizeRead] },
    async (request, reply) => {
      const query = request.query as Record<string, string | undefined>;
      const search = query.search?.trim();
      const from = query.from ? new Date(query.from) : undefined;
      const to = query.to ? new Date(query.to) : undefined;
      const action =
        query.action && validActions.has(query.action) ? (query.action as AuditAction) : undefined;
      const where: Prisma.AuditLogWhereInput = {
        organizationId: request.requestContext.organizationId,
        ...(action ? { action } : {}),
        ...(query.outcome ? { outcome: query.outcome.toUpperCase() } : {}),
        ...(query.entity ? { entity: { contains: query.entity, mode: 'insensitive' } } : {}),
        ...(query.actorId ? { actorId: query.actorId } : {}),
        ...(query.requestId ? { requestId: { contains: query.requestId } } : {}),
        ...((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))
          ? {
              createdAt: {
                ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
                ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
              },
            }
          : {}),
        ...(search
          ? {
              OR: [
                { actorName: { contains: search, mode: 'insensitive' } },
                { entity: { contains: search, mode: 'insensitive' } },
                { entityId: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
                { requestId: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      };
      const [events, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 5000,
        }),
        prisma.auditLog.count({ where }),
      ]);
      const pdf = await new PdfFormatter().export({
        title: `Audit Activity — latest ${events.length} of ${total}`,
        columns: [
          { key: 'createdAt', label: 'Timestamp' },
          { key: 'actorName', label: 'User' },
          { key: 'action', label: 'Action' },
          { key: 'entity', label: 'Entity' },
          { key: 'entityId', label: 'Record ID' },
          { key: 'outcome', label: 'Outcome' },
          { key: 'summary', label: 'Summary' },
        ],
        rows: events.map((event) => ({
          createdAt: event.createdAt,
          actorName: event.actorName ?? event.actorId ?? 'System / unknown user',
          action: event.action,
          entity: event.entity,
          entityId: event.entityId,
          outcome: event.outcome,
          summary: event.summary ?? '',
        })),
      });
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', 'attachment; filename="audit-report.pdf"');
      reply.header(
        'Access-Control-Expose-Headers',
        'X-Exported-Events, X-Total-Events, Content-Disposition',
      );
      reply.header('X-Exported-Events', String(events.length));
      reply.header('X-Total-Events', String(total));
      return reply.send(pdf);
    },
  );

  fastify.get(
    '/integrity',
    { preHandler: [authenticate, authorizeRead] },
    async (request, reply) => {
      const events = await prisma.auditLog.findMany({
        where: {
          organizationId: request.requestContext.organizationId,
          chainSequence: { not: null },
        },
        orderBy: { chainSequence: 'asc' },
      });
      let previousHash: string | null = null;
      let firstInvalidEventId: string | null = null;

      for (const event of events) {
        const expected = hashAuditValue({
          id: event.id,
          organizationId: event.organizationId,
          actorId: event.actorId,
          actorName: event.actorName,
          branchId: event.branchId,
          roleId: event.roleId,
          roles: event.roles ?? [],
          action: event.action,
          entity: event.entity,
          entityId: event.entityId,
          route: event.route,
          method: event.method,
          outcome: event.outcome,
          summary: event.summary,
          chainSequence: event.chainSequence?.toString(),
          oldValues: event.oldValues,
          newValues: event.newValues,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          requestId: event.requestId,
          createdAt: event.createdAt.toISOString(),
          previousHash,
        });
        if (event.previousHash !== previousHash || event.eventHash !== expected) {
          firstInvalidEventId = event.id;
          break;
        }
        previousHash = event.eventHash;
      }

      return reply.send({
        success: true,
        data: {
          valid: firstInvalidEventId === null,
          checkedEvents: events.length,
          firstInvalidEventId,
          latestHash: previousHash,
          verifiedAt: new Date().toISOString(),
        },
      });
    },
  );

  fastify.get('/', { preHandler: [authenticate, authorizeRead] }, async (request, reply) => {
    const query = request.query as Record<string, string | undefined>;
    const page = Math.max(1, Number.parseInt(query.page ?? '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit ?? '50', 10) || 50));
    const search = query.search?.trim();
    const action =
      query.action && validActions.has(query.action) ? (query.action as AuditAction) : undefined;
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    const context = request.requestContext;

    const where: Prisma.AuditLogWhereInput = {
      organizationId: context.organizationId,
      ...(action ? { action } : {}),
      ...(query.outcome ? { outcome: query.outcome.toUpperCase() } : {}),
      ...(query.entity ? { entity: { contains: query.entity, mode: 'insensitive' } } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.requestId ? { requestId: { contains: query.requestId } } : {}),
      ...((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))
        ? {
            createdAt: {
              ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
              ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { actorName: { contains: search, mode: 'insensitive' } },
              { entity: { contains: search, mode: 'insensitive' } },
              { entityId: { contains: search, mode: 'insensitive' } },
              { summary: { contains: search, mode: 'insensitive' } },
              { requestId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, firstName: true, lastName: true, email: true } },
          branch: { select: { id: true, name: true } },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: {
        items: items.map((entry) => ({
          id: entry.id,
          actorId: entry.actorId,
          actorName: entry.actorName,
          user: entry.actor,
          action: entry.action,
          resource: entry.entity,
          resourceId: entry.entityId,
          details: {
            oldValues: entry.oldValues,
            newValues: entry.newValues,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            branch: entry.branch,
            route: entry.route,
            method: entry.method,
            outcome: entry.outcome,
            summary: entry.summary,
            previousHash: entry.previousHash,
            eventHash: entry.eventHash,
            roles: entry.roles,
          },
          requestId: entry.requestId,
          createdAt: entry.createdAt,
        })),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  });
};
