import { describe, expect, it } from 'vitest';
import type { FastifyRequest } from 'fastify';
import { createAuthorizeHook } from '../../auth/middleware/auth.middleware.js';

describe('cashier inventory permissions', () => {
  const cashierRequest = {
    requestContext: {
      userId: 'cashier-user',
      organizationId: 'organization',
      branchId: 'branch',
      roles: ['CASHIER'],
      permissions: ['inventory:read'],
      requestId: 'request',
    },
  } as FastifyRequest;

  it('allows reading inventory', async () => {
    await expect(createAuthorizeHook(['inventory:read'])(cashierRequest)).resolves.toBeUndefined();
  });

  it.each(['inventory:adjust', 'inventory:transfer'])(
    'denies stock manipulation requiring %s',
    async (permission) => {
      await expect(createAuthorizeHook([permission])(cashierRequest)).rejects.toThrow(
        `Missing required permissions: ${permission}`,
      );
    },
  );
});
