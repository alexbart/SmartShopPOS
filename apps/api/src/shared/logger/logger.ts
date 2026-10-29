import pino from "pino";

const isDevelopment = process.env.NODE_ENV === "development";

// @ts-ignore
export const logger = pino({
  level: isDevelopment ? "info" : "warn",
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});
