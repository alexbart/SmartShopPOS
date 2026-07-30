export const swaggerConfig = {
  openapi: {
    info: {
      title: "SmartShopPOS API",
      description: "Smart and Simple POS for everyone",
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:4000/api/v1",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http" as const,
          scheme: "bearer" as const,
          bearerFormat: "JWT" as const,
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  exposeHeadRoutes: false,
  exposeUnsafeRoutes: false,
};
