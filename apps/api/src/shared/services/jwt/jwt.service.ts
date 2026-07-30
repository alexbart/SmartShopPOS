import { injectable } from "tsyringe";
import jwt, { type SignOptions, type VerifyOptions } from "jsonwebtoken";
import { JwtConfig } from "../../config/jwt.config.js";
import type { IJwtService } from "./jwt.interface.js";

@injectable()
export class JwtService implements IJwtService {
  async generateAccessToken(payload: { userId: string; organizationId: string; roles: string[] }): Promise<string> {
    const options: SignOptions = {
      expiresIn: JwtConfig.accessTokenExpiresIn as SignOptions["expiresIn"],
      issuer: JwtConfig.issuer,
      audience: JwtConfig.audience,
    };
    return jwt.sign(payload, process.env.JWT_SECRET!, options);
  }

  async generateRefreshToken(payload: { userId: string; sessionId: string }): Promise<string> {
    const options: SignOptions = {
      expiresIn: JwtConfig.refreshTokenExpiresIn as SignOptions["expiresIn"],
      issuer: JwtConfig.issuer,
      audience: JwtConfig.audience,
    };
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, options);
  }

  async verifyAccessToken(token: string): Promise<{ userId: string; organizationId: string; roles: string[] }> {
    const options: VerifyOptions = {
      issuer: JwtConfig.issuer,
      audience: JwtConfig.audience,
    };
    return jwt.verify(token, process.env.JWT_SECRET!, options) as { userId: string; organizationId: string; roles: string[] };
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string; sessionId: string }> {
    const options: VerifyOptions = {
      issuer: JwtConfig.issuer,
      audience: JwtConfig.audience,
    };
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, options) as { userId: string; sessionId: string };
  }
}
