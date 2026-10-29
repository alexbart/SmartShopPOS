export const JwtConfig = {
  issuer: "SmartShopPOS",
  audience: "SmartShopPOS Clients",
  accessTokenExpiresIn: "15m",
  refreshTokenExpiresIn: "7d",
} as const;
