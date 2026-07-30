export interface IJwtService {
  generateAccessToken(payload: { userId: string; organizationId: string; roles: string[] }): Promise<string>;
  generateRefreshToken(payload: { userId: string; sessionId: string }): Promise<string>;
  verifyAccessToken(token: string): Promise<{ userId: string; organizationId: string; roles: string[] }>;
  verifyRefreshToken(token: string): Promise<{ userId: string; sessionId: string }>;
}
