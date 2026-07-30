import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { loggerPlugin } from "./plugins/logger.js";
import { errorHandlerPlugin } from "./plugins/errorHandler.js";
import { swaggerConfig } from "./config/swagger.js";
import { healthRoute } from "./routes/health.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === "development" ? "info" : "warn",
    },
  });

  await app.register(cors, { origin: true });
  await app.register(swagger, swaggerConfig);
  await app.register(swaggerUi, { routePrefix: "/docs" });
  await app.register(loggerPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(healthRoute, { prefix: "/api/v1" });

  return app;
}
