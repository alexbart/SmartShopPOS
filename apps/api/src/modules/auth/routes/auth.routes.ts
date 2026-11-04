import { FastifyPluginAsync } from 'fastify';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../services/auth.service.js';
import { AuthRepositoryImpl } from '../repositories/auth.repository.impl.js';
import { createAuthenticateHook, createAuthorizeHook } from '../middleware/auth.middleware.js';
import { getPrisma } from '../../../shared/database/prisma.js';
import { UnitOfWork } from '../../../shared/database/unit-of-work.js';
import { PasswordService } from '../../../shared/services/password/password.service.js';
import { JwtService } from '../../../shared/services/jwt/jwt.service.js';
import { OrganizationCodeService } from '../../../shared/services/organization-code/organization-code.service.js';

const prisma = getPrisma();

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authRepository = new AuthRepositoryImpl(prisma);
  const unitOfWork = new UnitOfWork();
  const passwordService = new PasswordService();
  const jwtService = new JwtService();
  const organizationCodeService = new OrganizationCodeService();

  const authService = new AuthService(
    authRepository,
    passwordService,
    jwtService,
    organizationCodeService,
    unitOfWork,
  );

  const authController = new AuthController(authService);

  const authenticateHook = createAuthenticateHook(
    new (await import('../../../shared/services/jwt/jwt.service.js')).JwtService(),
    new (await import('../repositories/auth.repository.impl.js')).AuthRepositoryImpl(prisma),
  );
  const authorizeUserRead = createAuthorizeHook(['user:read']);
  const authorizeUserCreate = createAuthorizeHook(['user:create']);
  const authorizeUserUpdate = createAuthorizeHook(['user:update']);
  const authorizeUserDelete = createAuthorizeHook(['user:delete']);
  const authorizeRoleRead = createAuthorizeHook(['role:read']);
  const authorizeRoleCreate = createAuthorizeHook(['role:create', 'permission:assign']);
  const authorizeRoleUpdate = createAuthorizeHook(['role:update', 'permission:assign']);
  const authorizeRoleDelete = createAuthorizeHook(['role:delete']);
  const authorizePermissionRead = createAuthorizeHook(['permission:read']);

  // Register route
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['organizationName', 'ownerFirstName', 'ownerLastName', 'ownerEmail', 'password'],
        properties: {
          organizationName: { type: 'string', minLength: 3, maxLength: 255 },
          ownerFirstName: { type: 'string', minLength: 2 },
          ownerLastName: { type: 'string', minLength: 2 },
          ownerEmail: { type: 'string', format: 'email' },
          ownerPhone: { type: 'string' },
          password: { type: 'string', minLength: 12 },
        },
      },
      tags: ['auth'],
      description: 'Register a new organization',
      summary: 'Register organization',
      consumes: ['application/json'],
      produces: ['application/json'],
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Organization registered successfully.' },
            data: {
              type: 'object',
              properties: {
                organization: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    code: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => authController.register(request, reply),
  });

  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['organizationCode', 'email', 'password'],
        properties: {
          organizationCode: { type: 'string', description: 'Organization code' },
          email: { type: 'string', format: 'email', description: 'User email address' },
          password: { type: 'string', description: 'User password' },
        },
      },
      tags: ['auth'],
      description: 'Login to an organization',
      summary: 'Login',
      consumes: ['application/json'],
      produces: ['application/json'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful.' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    firstName: { type: 'string' },
                    lastName: { type: 'string' },
                    email: { type: 'string' },
                  },
                },
                organization: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' },
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
        403: {
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
        500: {
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
    handler: async (request, reply) => authController.login(request, reply),
  });

  fastify.post('/refresh', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: 'Refresh token' },
        },
      },
      tags: ['auth'],
      description: 'Refresh access token',
      summary: 'Refresh token',
      consumes: ['application/json'],
      produces: ['application/json'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Tokens refreshed successfully.' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
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
    handler: async (request, reply) => authController.refresh(request, reply),
  });

  fastify.get('/me', {
    preHandler: [createAuthenticateHook(jwtService, authRepository)],
    schema: {
      tags: ['auth'],
      description: 'Get current authenticated user',
      summary: 'Current user',
      produces: ['application/json'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Current user retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                email: { type: 'string' },
                organization: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                branch: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
                roles: {
                  type: 'array',
                  items: { type: 'string' },
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
    handler: async (request, reply) => authController.me(request, reply),
  });

  fastify.post('/logout', {
    schema: {
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: 'Refresh token to revoke' },
        },
      },
      tags: ['auth'],
      description: 'Logout and revoke refresh token',
      summary: 'Logout',
      consumes: ['application/json'],
      produces: ['application/json'],
      response: {
        204: {
          type: 'object',
          properties: {},
        },
      },
    },
    handler: async (request, reply) => authController.logout(request, reply),
  });

  fastify.route({
    method: 'GET',
    url: '/users',
    preHandler: [authenticateHook, authorizeUserRead],
    schema: {
      tags: ['users'],
      description: 'List users with pagination and filters',
      summary: 'List Users',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          search: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'] },
          roleId: { type: 'string' },
          branchId: { type: 'string' },
          sortBy: {
            type: 'string',
            enum: ['firstName', 'lastName', 'email', 'createdAt', 'lastLoginAt'],
          },
          sortOrder: { type: 'string', enum: ['asc', 'desc'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Users retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      email: { type: 'string' },
                      phone: { type: 'string', nullable: true },
                      status: { type: 'string' },
                      role: { type: 'string', nullable: true },
                      branchName: { type: 'string', nullable: true },
                      lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => authController.findUsers(request, reply),
  });

  fastify.route({
    method: 'POST',
    url: '/users',
    preHandler: [authenticateHook, authorizeUserCreate],
    schema: {
      tags: ['users'],
      description: 'Create a new user',
      summary: 'Create User',
      body: {
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'password', 'roleId'],
        properties: {
          firstName: { type: 'string', minLength: 2 },
          lastName: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          password: { type: 'string', minLength: 12 },
          roleId: { type: 'string' },
          branchId: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'User created successfully.' },
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => authController.createUser(request, reply),
  });

  fastify.route({
    method: 'PATCH',
    url: '/users/:id',
    preHandler: [authenticateHook, authorizeUserUpdate],
    schema: {
      tags: ['users'],
      description: 'Update a user',
      summary: 'Update User',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          isActive: { type: 'boolean' },
          roleId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'User updated successfully.' },
          },
        },
      },
    },
    handler: async (request, reply) => authController.updateUser(request, reply),
  });

  fastify.route({
    method: 'PATCH',
    url: '/users/:id/deactivate',
    preHandler: [authenticateHook, authorizeUserDelete],
    schema: {
      tags: ['users'],
      description: 'Deactivate a user',
      summary: 'Deactivate User',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'User deactivated successfully.' },
          },
        },
      },
    },
    handler: async (request, reply) => authController.deactivateUser(request, reply),
  });

  fastify.route({
    method: 'POST',
    url: '/users/:id/reset-password',
    preHandler: [authenticateHook, authorizeUserUpdate],
    schema: {
      tags: ['users'],
      description: 'Reset user password',
      summary: 'Reset Password',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', minLength: 12 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Password reset successfully.' },
          },
        },
      },
    },
    handler: async (request, reply) => authController.resetPassword(request, reply),
  });

  // Roles routes
  fastify.route({
    method: 'GET',
    url: '/roles',
    preHandler: [authenticateHook, authorizeRoleRead],
    schema: {
      tags: ['roles'],
      description: 'List all roles',
      summary: 'List Roles',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          search: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Roles retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      description: { type: 'string', nullable: true },
                      isSystem: { type: 'boolean' },
                      userCount: { type: 'integer' },
                      permissions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            resource: { type: 'string' },
                            action: { type: 'string' },
                          },
                        },
                      },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => authController.findRoles(request, reply),
  });

  fastify.route({
    method: 'POST',
    url: '/roles',
    preHandler: [authenticateHook, authorizeRoleCreate],
    schema: {
      tags: ['roles'],
      description: 'Create a new role',
      summary: 'Create Role',
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 50 },
          description: { type: 'string', maxLength: 255 },
          permissionIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Role created successfully.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => authController.createRole(request, reply),
  });

  fastify.route({
    method: 'GET',
    url: '/roles/:id',
    preHandler: [authenticateHook, authorizeRoleRead],
    schema: {
      tags: ['roles'],
      description: 'Get a role by ID',
      summary: 'Get Role',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Role retrieved successfully.' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
                isSystem: { type: 'boolean' },
                userCount: { type: 'integer' },
                permissions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      resource: { type: 'string' },
                      action: { type: 'string' },
                    },
                  },
                },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
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
    handler: async (request, reply) => authController.findRoleById(request, reply),
  });

  fastify.route({
    method: 'PATCH',
    url: '/roles/:id',
    preHandler: [authenticateHook, authorizeRoleUpdate],
    schema: {
      tags: ['roles'],
      description: 'Update a role',
      summary: 'Update Role',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 50 },
          description: { type: 'string', maxLength: 255 },
          permissionIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Role updated successfully.' },
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
    handler: async (request, reply) => authController.updateRole(request, reply),
  });

  fastify.route({
    method: 'DELETE',
    url: '/roles/:id',
    preHandler: [authenticateHook, authorizeRoleDelete],
    schema: {
      tags: ['roles'],
      description: 'Delete a role',
      summary: 'Delete Role',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Role deleted successfully.' },
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
    handler: async (request, reply) => authController.deleteRole(request, reply),
  });

  // Permissions routes
  fastify.route({
    method: 'GET',
    url: '/permissions',
    preHandler: [authenticateHook, authorizePermissionRead],
    schema: {
      tags: ['permissions'],
      description: 'List all permissions',
      summary: 'List Permissions',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Permissions retrieved successfully.' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  resource: { type: 'string' },
                  action: { type: 'string' },
                  description: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
      },
    },
    handler: async (request, reply) => authController.findPermissions(request, reply),
  });
};
