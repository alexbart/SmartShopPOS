import "reflect-metadata";
import { describe, it, expect, beforeAll } from "vitest";
import { buildApp } from "../../../app.js";
import type { FastifyInstance } from "fastify";

process.env.NODE_ENV = "test";
process.env.PORT = "4000";
process.env.DATABASE_URL = "postgresql://postgres:admin@localhost:5432/smartshop";
process.env.JWT_SECRET = "test-jwt-secret-key-that-is-long-enough-for-testing";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key-that-is-long-enough-for-testing";

describe("POST /api/v1/auth/register", () => {
  let app: FastifyInstance;
  const uniqueName = `SmartShop Test ${Date.now()}`;

  beforeAll(async () => {
    app = await buildApp();
  });

  it("returns 201 with registration payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        organizationName: uniqueName,
        ownerFirstName: "Alex",
        ownerLastName: "Kiprop",
        ownerEmail: `alex-${Date.now()}@smartshop.test`,
        ownerPhone: "+254700000001",
        password: "StrongPassword123!",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.organization.name).toBe(uniqueName);
    expect(body.data.user.email).toBeDefined();
    expect(body.data.tokens.accessToken).toBeDefined();
    expect(body.data.tokens.refreshToken).toBeDefined();
  });

  it("rejects short password", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        organizationName: uniqueName,
        ownerFirstName: "Alex",
        ownerLastName: "Kiprop",
        ownerEmail: `alex-${Date.now()}@smartshop.test`,
        password: "weak",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects missing required fields", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        organizationName: uniqueName,
        ownerFirstName: "Alex",
      },
    });

    expect(response.statusCode).toBe(400);
  });
});
