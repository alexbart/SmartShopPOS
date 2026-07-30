import fp from "fastify-plugin";

export const loggerPlugin = fp(async (fastify) => {
  fastify.log.info(
    { service: "SmartShopPOS API", version: "1.0.0" },
    "Logger plugin initialized"
  );
}, { name: "logger-plugin" });
