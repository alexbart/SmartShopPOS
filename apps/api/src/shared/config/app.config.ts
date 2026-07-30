export const AppConfig = {
  name: process.env.APP_NAME ?? "SmartShopPOS",
  version: process.env.APP_VERSION ?? "1.0.0",
  environment: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
};
