import { FastifyPluginAsync } from 'fastify';
import { BrandController } from '../controllers/brand.controller.js';
import { BrandService } from '../service/brand.service.js';
import { BrandRepositoryImpl } from '../repositories/brand.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';

const prisma = new PrismaClient();

export const brandRoutes: FastifyPluginAsync = async (fastify) => {
  const brandRepository = new BrandRepositoryImpl(prisma);
  const brandService = new BrandService(brandRepository);
  const brandController = new BrandController(brandService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['brands'],
      description: 'List brands',
      summary: 'List brands',
      produces: ['application/json'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Brands retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      organizationId: { type: 'string' },
                      name: { type: 'string' },
                      code: { type: 'string' },
                      description: { type: 'string' },
                      logoUrl: { type: 'string' },
                      website: { type: 'string' },
                      isActive: { type: 'boolean' },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' },
                    },
                  },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'number' },
                    limit: { type: 'number' },
                    total: { type: 'number' },
                    pages: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => brandController.findAll(request, reply),
  });

  fastify.get('/:id', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['brands'],
      description: 'Get brand by ID',
      summary: 'Get brand by ID',
      produces: ['application/json'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Brand retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                organizationId: { type: 'string' },
                name: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' },
                logoUrl: { type: 'string' },
                website: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => brandController.findById(request, reply),
  });

  fastify.post('/', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['brands'],
      description: 'Create brand',
      summary: 'Create brand',
      consumes: ['application/json'],
      produces: ['application/json'],
      body: {
        type: 'object',
        required: ['name', 'code'],
        properties: {
          name: { type: 'string', maxLength: 150 },
          code: { type: 'string', maxLength: 50 },
          description: { type: 'string' },
          logoUrl: { type: 'string', format: 'uri' },
          website: { type: 'string', format: 'uri' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Brand created successfully.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                organizationId: { type: 'string' },
                name: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' },
                logoUrl: { type: 'string' },
                website: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => brandController.create(request, reply),
  });

  fastify.patch('/:id', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['brands'],
      description: 'Update brand',
      summary: 'Update brand',
      consumes: ['application/json'],
      produces: ['application/json'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 150 },
          code: { type: 'string', maxLength: 50 },
          description: { type: 'string' },
          logoUrl: { type: 'string', format: 'uri' },
          website: { type: 'string', format: 'uri' },
          isActive: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Brand updated successfully.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                organizationId: { type: 'string' },
                name: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' },
                logoUrl: { type: 'string' },
                website: { type: 'string' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => brandController.update(request, reply),
  });

  fastify.delete('/:id', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['brands'],
      description: 'Delete brand',
      summary: 'Delete brand',
      produces: ['application/json'],
      response: {
        204: {
          type: 'object',
          properties: {},
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => brandController.delete(request, reply),
  });
};
