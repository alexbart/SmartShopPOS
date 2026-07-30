import fp from "fastify-plugin";
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

export const errorHandlerPlugin = fp(async (fastify) => {
  fastify.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";

    fastify.log.error(
      { statusCode, message, service: "SmartShopPOS API" },
      "Unhandled application error"
    );

    return reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message,
        ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
      },
    });
  });
}, { name: "error-handler-plugin" });
