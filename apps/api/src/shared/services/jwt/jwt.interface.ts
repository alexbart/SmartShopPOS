export interface IJwtService {
  generateAccessToken(_payload: {
    userId: string;
    organizationId: string;
    roles: string[];
  }): Promise<string>;
  generateRefreshToken(_payload: {
    userId: string;
    sessionId: string;
    jti: string;
  }): Promise<string>;
  verifyAccessToken(
    _token: string,
  ): Promise<{ userId: string; organizationId: string; roles: string[] }>;
  verifyRefreshToken(_token: string): Promise<{ userId: string; sessionId: string; jti: string }>;
}
