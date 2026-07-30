import { describe, it, expect, beforeAll, vi } from "vitest";
import { buildApp } from "../app.js";

vi.stubEnv("NODE_ENV", "test");
vi.stubEnv("PORT", "4000");
vi.stubEnv("DATABASE_URL", "postgresql://test:test@localhost:5432/test");
vi.stubEnv("JWT_SECRET", "test-jwt-secret-key-that-is-long-enough");
vi.stubEnv("JWT_REFRESH_SECRET", "test-refresh-secret-key-that-is-long-enough");

describe("GET /api/v1/health", () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    app = await buildApp();
  });

  it("returns 200 with health payload", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/health",
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.service).toBe("SmartShopPOS API");
    expect(body.version).toBe("1.0.0");
    expect(body.timestamp).toBeDefined();
  });
});
