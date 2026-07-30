import { FastifyPluginAsync } from "fastify";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthService } from "../services/auth.service.js";
import { AuthRepositoryImpl } from "../repositories/auth.repository.impl.js";
import { PrismaClient } from "@prisma/client";
import { UnitOfWork } from "../../../shared/database/unit-of-work.js";
import { PasswordService } from "../../../shared/services/password/password.service.js";
import { JwtService } from "../../../shared/services/jwt/jwt.service.js";
import { OrganizationCodeService } from "../../../shared/services/organization-code/organization-code.service.js";

const prisma = new PrismaClient();

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
    unitOfWork
  );

  const authController = new AuthController(authService);

  fastify.post(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["organizationName", "ownerFirstName", "ownerLastName", "ownerEmail", "password"],
          properties: {
            organizationName: { type: "string", minLength: 3, maxLength: 255 },
            ownerFirstName: { type: "string", minLength: 2 },
            ownerLastName: { type: "string", minLength: 2 },
            ownerEmail: { type: "string", format: "email" },
            ownerPhone: { type: "string" },
            password: { type: "string", minLength: 12 },
          },
        },
        tags: ["auth"],
        description: "Register a new organization",
        summary: "Register organization",
        consumes: ["application/json"],
        produces: ["application/json"],
        response: {
          201: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              message: { type: "string", example: "Organization registered successfully." },
              data: {
                type: "object",
                properties: {
                  organization: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      code: { type: "string" },
                      name: { type: "string" },
                    },
                  },
                  user: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      firstName: { type: "string" },
                      lastName: { type: "string" },
                      email: { type: "string" },
                    },
                  },
                  tokens: {
                    type: "object",
                    properties: {
                      accessToken: { type: "string" },
                      refreshToken: { type: "string" },
                    },
                  },
                },
              },
            },
          },
          400: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
          409: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
          500: {
            type: "object",
            properties: {
              success: { type: "boolean", example: false },
              error: {
                type: "object",
                properties: {
                  code: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
      },
      handler: async (request, reply) => authController.register(request, reply),
    }
  );

  fastify.post("/login", async (request, reply) => authController.login(request, reply));
  fastify.post("/refresh", async (request, reply) => authController.refresh(request, reply));
  fastify.post("/logout", async (request, reply) => authController.logout(request, reply));
  fastify.post("/forgot-password", async (request, reply) => authController.forgotPassword(request, reply));
  fastify.post("/reset-password", async (request, reply) => authController.resetPassword(request, reply));
  fastify.get("/me", async (request, reply) => authController.me(request, reply));
  fastify.patch("/profile", async (request, reply) => authController.updateProfile(request, reply));
  fastify.patch("/password", async (request, reply) => authController.changePassword(request, reply));
  fastify.get("/sessions", async (request, reply) => authController.getSessions(request, reply));
  fastify.delete("/sessions/:id", async (request, reply) => authController.deleteSession(request, reply));
  fastify.delete("/sessions", async (request, reply) => authController.deleteAllSessions(request, reply));
};
