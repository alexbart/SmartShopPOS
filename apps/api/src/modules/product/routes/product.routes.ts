import { FastifyPluginAsync } from 'fastify';
import { ProductController } from '../controllers/product.controller.js';
import { ProductService } from '../service/product.service.js';
import { ProductRepositoryImpl } from '../repositories/product.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';

const prisma = new PrismaClient();

export const productRoutes: FastifyPluginAsync = async (fastify) => {
  const productRepository = new ProductRepositoryImpl(prisma);
  const productService = new ProductService(productRepository);
  const productController = new ProductController(productService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    productController.findAll(request, reply),
  );
  fastify.get('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    productController.findById(request, reply),
  );
  fastify.post('/', { preHandler: [authenticateHook] }, async (request, reply) =>
    productController.create(request, reply),
  );
  fastify.patch('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    productController.update(request, reply),
  );
  fastify.delete('/:id', { preHandler: [authenticateHook] }, async (request, reply) =>
    productController.delete(request, reply),
  );
};
