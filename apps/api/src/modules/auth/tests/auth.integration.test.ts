import "reflect-metadata";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { buildApp } from "../../../app.js";
import type { FastifyInstance } from "fastify";

vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("PORT", "4000");
vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
vi.stubEnv("JWT_SECRET", "test-jwt-secret-key-that-is-long-enough");
vi.stubEnv("JWT_REFRESH_SECRET", "test-refresh-secret-key-that-is-long-enough");

describe("POST /api/v1/auth/register", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  it("returns 201 with registration payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        organization: {
          name: "SmartShop Demo Ltd.",
          email: "info@smartshop.test",
          phone: "+254700000000",
          kraPin: "P051234567A",
        },
        owner: {
          firstName: "Alex",
          lastName: "Kiprop",
          email: "alex@smartshop.test",
          phone: "+254700000001",
          password: "StrongPassword123!",
        },
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.organization.name).toBe("SmartShop Demo Ltd.");
    expect(body.data.user.email).toBe("alex@smartshop.test");
    expect(body.data.tokens.accessToken).toBeDefined();
    expect(body.data.tokens.refreshToken).toBeDefined();
  });
});
