import { FastifyPluginAsync } from 'fastify';
import { CategoryController } from '../controllers/category.controller.js';
import { CategoryService } from '../service/category.service.js';
import { CategoryRepositoryImpl } from '../repositories/category.repository.impl.js';
import { createAuthenticateHook } from '../../auth/middleware/auth.middleware.js';
import { PrismaClient } from '@prisma/client';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { AuthRepositoryImpl } from '../../auth/repositories/auth.repository.impl.js';

const prisma = new PrismaClient();

export const categoryRoutes: FastifyPluginAsync = async (fastify) => {
  const categoryRepository = new CategoryRepositoryImpl(prisma);
  const categoryService = new CategoryService(categoryRepository);
  const categoryController = new CategoryController(categoryService);
  const jwtService = new JwtService();
  const authRepository = new AuthRepositoryImpl(prisma);
  const authenticateHook = createAuthenticateHook(jwtService, authRepository);

  fastify.get('/', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['categories'],
      description: 'List categories',
      summary: 'List categories',
      produces: ['application/json'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Categories retrieved successfully.' },
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
                      color: { type: 'string' },
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
    handler: async (request, reply) => categoryController.findAll(request, reply),
  });

  fastify.get('/:id', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['categories'],
      description: 'Get category by ID',
      summary: 'Get category by ID',
      produces: ['application/json'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Category retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                organizationId: { type: 'string' },
                name: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' },
                color: { type: 'string' },
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
    handler: async (request, reply) => categoryController.findById(request, reply),
  });

  fastify.post('/', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['categories'],
      description: 'Create category',
      summary: 'Create category',
      consumes: ['application/json'],
      produces: ['application/json'],
      body: {
        type: 'object',
        required: ['name', 'code'],
        properties: {
          name: { type: 'string', maxLength: 150 },
          code: { type: 'string', maxLength: 50 },
          description: { type: 'string' },
          color: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Category created successfully.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                organizationId: { type: 'string' },
                name: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' },
                color: { type: 'string' },
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
    handler: async (request, reply) => categoryController.create(request, reply),
  });

  fastify.patch('/:id', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['categories'],
      description: 'Update category',
      summary: 'Update category',
      consumes: ['application/json'],
      produces: ['application/json'],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', maxLength: 150 },
          code: { type: 'string', maxLength: 50 },
          description: { type: 'string' },
          color: { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' },
          isActive: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Category updated successfully.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                organizationId: { type: 'string' },
                name: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' },
                color: { type: 'string' },
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
    handler: async (request, reply) => categoryController.update(request, reply),
  });

  fastify.delete('/:id', {
    preHandler: [authenticateHook],
    schema: {
      tags: ['categories'],
      description: 'Delete category',
      summary: 'Delete category',
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
    handler: async (request, reply) => categoryController.delete(request, reply),
  });
};
