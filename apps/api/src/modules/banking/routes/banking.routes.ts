import { FastifyPluginAsync } from 'fastify';
import { BankingController } from '../controller/banking.controller.js';
import { BankingService } from '../service/banking.service.js';
import { BankingRepositoryImpl } from '../repository/banking.repository.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const bankingRoutes: FastifyPluginAsync = async (fastify) => {
  const repository = new BankingRepositoryImpl(prisma);
  const service = new BankingService(repository);
  const controller = new BankingController(service);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  const preHandler = [authenticateHook];

  fastify.get(
    '/bank-accounts',
    { preHandler },
    async (request, reply) => controller.listAccounts(request, reply),
  );

  fastify.post(
    '/bank-accounts',
    { preHandler },
    async (request, reply) => controller.createAccount(request, reply),
  );

  fastify.post(
    '/deposits',
    { preHandler },
    async (request, reply) => controller.deposit(request, reply),
  );
};
