import { FastifyPluginAsync } from "fastify";

export const healthRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get("/health", () => ({
    success: true,
    service: "SmartShopPOS API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  }));
};
