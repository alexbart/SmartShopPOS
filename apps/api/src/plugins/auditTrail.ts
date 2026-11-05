import fp from 'fastify-plugin';
import type { FastifyRequest } from 'fastify';
import { AuditAction } from '@prisma/client';
import { getPrisma } from '../shared/database/prisma.js';
import { writeHashedAuditEvent } from '../modules/audit/audit-chain.js';
import { JwtService } from '../shared/services/jwt/jwt.service.js';

type AuditOutcome = 'SUCCESS' | 'FAILED' | 'DENIED';

function redact(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[truncated]';
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => redact(item, depth + 1));
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string' && value.length > 500) return `${value.slice(0, 500)}…`;
    return value;
  }

  const secret =
    /password|token|secret|authorization|credential|pin|private.?key|cookie|card.?number|cvv|security.?code/i;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .slice(0, 100)
      .map(([key, item]) => [key, secret.test(key) ? '[redacted]' : redact(item, depth + 1)]),
  );
}

function getSensitiveRead(request: FastifyRequest): boolean {
  const path = request.url.split('?')[0].toLowerCase();
  return /\/(users|roles|permissions|customers|payments|banking|finance|reports|export|organization)(\/|$)/.test(
    path,
  );
}

function getModelForPath(path: string): string | undefined {
  const segments = path.toLowerCase().split('/').filter(Boolean);
  const resource = segments[2] === 'finance' ? segments[3] : segments[2];
  const models: Record<string, string> = {
    organization: 'organization',
    products: 'product',
    categories: 'category',
    brands: 'brand',
    units: 'unit',
    taxes: 'tax',
    customers: 'customer',
    suppliers: 'supplier',
    warehouses: 'warehouse',
    'purchase-orders': 'purchaseOrder',
    sales: 'sale',
    expenses: 'expense',
  };
  return models[resource || ''];
}

function serializeForAudit(value: unknown): unknown {
  const serialized = JSON.stringify(value, (_key, item) =>
    typeof item === 'bigint' ? item.toString() : item,
  );
  return serialized ? redact(JSON.parse(serialized)) : null;
}

function extractCreatedId(payload: unknown): string | undefined {
  if (typeof payload !== 'string') return undefined;
  try {
    const body = JSON.parse(payload) as { data?: unknown; id?: unknown };
    const candidates = [
      body.id,
      (body.data as { id?: unknown } | null)?.id,
      (body.data as { data?: { id?: unknown } } | null)?.data?.id,
    ];
    return candidates.find((candidate): candidate is string => typeof candidate === 'string');
  } catch {
    return undefined;
  }
}

function getAction(request: FastifyRequest, statusCode: number): AuditAction {
  const path = request.url.split('?')[0].toLowerCase();
  if (path.endsWith('/login') && statusCode >= 400) return AuditAction.AUTH_FAILURE;
  if (statusCode === 401 || statusCode === 403) return AuditAction.ACCESS_DENIED;
  if (statusCode >= 400) return AuditAction.FAILED;
  if (path.endsWith('/login')) return AuditAction.LOGIN;
  if (path.endsWith('/logout')) return AuditAction.LOGOUT;
  if (/\/receive(?:-goods)?(?:\/|$)/.test(path)) return AuditAction.RECEIVE_GOODS;
  if (/\/(approve|submit)(\/|$)/.test(path)) return AuditAction.SUBMIT;
  if (/\/(cancel|void|reject)(\/|$)/.test(path)) return AuditAction.CANCEL;

  switch (request.method) {
    case 'POST':
      return AuditAction.CREATE;
    case 'PATCH':
    case 'PUT':
      return AuditAction.UPDATE;
    case 'DELETE':
      return AuditAction.DELETE;
    default:
      return AuditAction.READ;
  }
}

export const auditTrailPlugin = fp(
  async (fastify) => {
    const prisma = getPrisma();
    const jwtService = new JwtService();

    fastify.addHook('onRequest', async (request) => {
      if (!['PATCH', 'PUT', 'DELETE'].includes(request.method)) return;
      const path = request.url.split('?')[0];
      if (!path.startsWith('/api/v1/')) return;
      const modelName = getModelForPath(path);
      const authorization = request.headers.authorization;
      if (!modelName || !authorization?.startsWith('Bearer ')) return;

      try {
        const identity = await jwtService.verifyAccessToken(authorization.slice(7));
        const params = request.params as Record<string, unknown> | undefined;
        const entityId =
          typeof params?.id === 'string'
            ? params.id
            : path === '/api/v1/organization'
              ? identity.organizationId
              : undefined;
        if (!entityId) return;
        const delegate = (
          prisma as unknown as Record<
            string,
            {
              findFirst(_args: { where: Record<string, unknown> }): Promise<unknown>;
            }
          >
        )[modelName];
        const record = await delegate.findFirst({
          where:
            modelName === 'organization'
              ? { id: identity.organizationId }
              : { id: entityId, organizationId: identity.organizationId },
        });
        if (record) {
          (request as FastifyRequest & { auditOldValues?: unknown }).auditOldValues =
            serializeForAudit(record);
        }
      } catch {
        // Authentication and request handling remain the source of truth if a snapshot is unavailable.
      }
    });

    fastify.addHook('onSend', async (request, _reply, payload) => {
      (request as FastifyRequest & { auditCreatedId?: string }).auditCreatedId =
        extractCreatedId(payload);
      return payload;
    });

    fastify.addHook('onResponse', async (request, reply) => {
      const path = request.url.split('?')[0];
      if (!path.startsWith('/api/v1/') || path.startsWith('/api/v1/audit')) return;
      if (reply.statusCode < 400 && /^\/api\/v1\/(inventory|purchase-orders)(\/|$)/.test(path))
        return;
      if (path.startsWith('/api/v1/health')) return;
      if (path.startsWith('/api/v1/auth/')) {
        // Auth success and core auth mutations already create domain audit events.
        if (reply.statusCode < 400 && request.method !== 'GET') return;
      }
      if (request.method === 'GET' && !getSensitiveRead(request) && reply.statusCode < 400) return;

      const context = (
        request as FastifyRequest & {
          requestContext?: {
            userId?: string;
            organizationId?: string;
            branchId?: string;
            roleId?: string;
            roles?: string[];
          };
        }
      ).requestContext;
      let organizationId: string | undefined = context?.organizationId;
      let actorId: string | undefined = context?.userId;
      let actorName: string | undefined;
      let branchId: string | undefined = context?.branchId;
      const roles = context?.roles;

      // Failed sign-ins occur before authentication middleware sets requestContext.
      if (!organizationId && request.url.toLowerCase().startsWith('/api/v1/auth/login')) {
        const body = request.body as Record<string, unknown> | undefined;
        const organizationCode =
          typeof body?.organizationCode === 'string'
            ? body.organizationCode.trim().toUpperCase()
            : '';
        const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
        if (organizationCode) {
          const organization = await prisma.organization.findUnique({
            where: { code: organizationCode },
            select: { id: true },
          });
          organizationId = organization?.id;
          if (organizationId && email) {
            const user = await prisma.user.findUnique({
              where: { organizationId_email: { organizationId, email } },
              select: { id: true, firstName: true, lastName: true, branchId: true },
            });
            actorId = user?.id;
            actorName = user ? `${user.firstName} ${user.lastName}`.trim() : email;
            branchId = user?.branchId;
          }
        }
      }
      if (!organizationId) return;

      if (!actorName && actorId) {
        const actor = await prisma.user.findUnique({
          where: { id: actorId },
          select: { firstName: true, lastName: true },
        });
        actorName = actor ? `${actor.firstName} ${actor.lastName}`.trim() : undefined;
      }

      const params = request.params as Record<string, unknown> | undefined;
      const auditRequest = request as FastifyRequest & {
        auditCreatedId?: string;
        auditOldValues?: unknown;
      };
      const targetId =
        typeof params?.id === 'string' ? params.id : auditRequest.auditCreatedId || request.id;
      const segments = path
        .replace(/^\/api\/v1\//, '')
        .split('/')
        .filter(Boolean);
      const resource = (segments[0] || 'request').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80);
      const outcome: AuditOutcome =
        reply.statusCode < 400
          ? 'SUCCESS'
          : reply.statusCode === 401 || reply.statusCode === 403
            ? 'DENIED'
            : 'FAILED';
      const action = getAction(request, reply.statusCode);
      const route = (request.routeOptions?.url || path).slice(0, 500);
      const summary = `${request.method} ${path} returned ${reply.statusCode}`;
      const body =
        request.body && typeof request.body === 'object' ? redact(request.body) : undefined;

      try {
        await writeHashedAuditEvent(prisma, {
          organizationId,
          actorId,
          actorName,
          branchId,
          roleId: context?.roleId,
          roles,
          action,
          entity: `API:${resource}`,
          entityId: targetId,
          route,
          method: request.method,
          outcome,
          summary,
          oldValues: auditRequest.auditOldValues as Record<string, unknown> | undefined,
          newValues: body as Record<string, unknown> | undefined,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'],
          requestId: context?.requestId || request.id,
        });
      } catch (error) {
        request.log.error({ err: error, requestId: request.id }, 'Could not persist audit event');
      }
    });
  },
  { name: 'audit-trail-plugin' },
);
