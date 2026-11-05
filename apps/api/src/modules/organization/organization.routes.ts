import type { FastifyPluginAsync } from 'fastify';
import { getPrisma } from '../../shared/database/prisma.js';
import { createAuthenticateHook, createAuthorizeHook } from '../auth/middleware/auth.middleware.js';
import { AuthRepositoryImpl } from '../auth/repositories/auth.repository.impl.js';
import { JwtService } from '../../shared/services/jwt/jwt.service.js';

const prisma = getPrisma();
const profileSelect = {
  id: true,
  name: true,
  code: true,
  email: true,
  phone: true,
  kraPin: true,
  currency: true,
  timezone: true,
  logoUrl: true,
  tagline: true,
  businessType: true,
  vatNumber: true,
  website: true,
  receiptFooter: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const organizationRoutes: FastifyPluginAsync = async (fastify) => {
  const authenticate = createAuthenticateHook(new JwtService(), new AuthRepositoryImpl(prisma));
  const authorizeRead = createAuthorizeHook(['organization:read']);
  const authorizeUpdate = createAuthorizeHook(['organization:update']);

  // Cashiers print receipts but do not hold organization:read, so receipt branding
  // is exposed to any authenticated session. It carries no sensitive profile data.
  fastify.get('/branding', { preHandler: [authenticate] }, async (request, reply) => {
    const branding = await prisma.organization.findFirst({
      where: { id: request.requestContext.organizationId, deletedAt: null },
      select: {
        name: true,
        tagline: true,
        email: true,
        phone: true,
        website: true,
        kraPin: true,
        vatNumber: true,
        logoUrl: true,
        receiptFooter: true,
        currency: true,
      },
    });
    if (!branding)
      return reply.status(404).send({ success: false, message: 'Organization not found.' });
    return reply.send({
      success: true,
      data: { ...branding, businessName: branding.name },
    });
  });

  fastify.get('/', { preHandler: [authenticate, authorizeRead] }, async (request, reply) => {
    const organization = await prisma.organization.findFirst({
      where: { id: request.requestContext.organizationId, deletedAt: null },
      select: profileSelect,
    });
    if (!organization)
      return reply.status(404).send({ success: false, message: 'Organization not found.' });
    return reply.send({
      success: true,
      data: { ...organization, businessName: organization.name },
    });
  });

  fastify.patch(
    '/',
    {
      preHandler: [authenticate, authorizeUpdate],
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            businessName: { type: 'string', minLength: 1, maxLength: 255 },
            tagline: { type: 'string', maxLength: 500 },
            businessType: { type: 'string', maxLength: 100 },
            email: {
              anyOf: [
                { type: 'string', format: 'email', maxLength: 255 },
                { type: 'string', maxLength: 0 },
              ],
            },
            phone: { type: 'string', maxLength: 50 },
            kraPin: { type: 'string', maxLength: 50 },
            vatNumber: { type: 'string', maxLength: 50 },
            currency: { type: 'string', minLength: 3, maxLength: 3 },
            timezone: { type: 'string', maxLength: 100 },
            website: { type: 'string', maxLength: 255 },
            receiptFooter: { type: 'string', maxLength: 2000 },
            logoUrl: { type: 'string', maxLength: 2048 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = (request.body ?? {}) as Record<string, string | undefined>;
      if (body.businessName !== undefined && !body.businessName.trim()) {
        return reply
          .status(400)
          .send({ success: false, message: 'Business name cannot be blank.' });
      }
      const data = {
        ...(body.businessName !== undefined ? { name: body.businessName.trim() } : {}),
        ...(body.tagline !== undefined ? { tagline: body.tagline } : {}),
        ...(body.businessType !== undefined ? { businessType: body.businessType } : {}),
        ...(body.email !== undefined ? { email: body.email.trim() || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.kraPin !== undefined ? { kraPin: body.kraPin } : {}),
        ...(body.vatNumber !== undefined ? { vatNumber: body.vatNumber } : {}),
        ...(body.currency !== undefined ? { currency: body.currency.toUpperCase() } : {}),
        ...(body.timezone !== undefined ? { timezone: body.timezone } : {}),
        ...(body.website !== undefined ? { website: body.website } : {}),
        ...(body.receiptFooter !== undefined ? { receiptFooter: body.receiptFooter } : {}),
        ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl.trim() || null } : {}),
      };
      if (!Object.keys(data).length) {
        return reply
          .status(400)
          .send({ success: false, message: 'Provide at least one profile field to update.' });
      }
      const organization = await prisma.organization.update({
        where: { id: request.requestContext.organizationId },
        data,
        select: profileSelect,
      });
      return reply.send({
        success: true,
        message: 'Organization profile updated successfully.',
        data: { ...organization, businessName: organization.name },
      });
    },
  );
};
