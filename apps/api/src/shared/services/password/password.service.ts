import { injectable, inject } from "tsyringe";
import argon2 from "argon2";
import { SecurityConfig } from "../../config/security.config.js";

export interface IPasswordService {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

@injectable()
export class PasswordService implements IPasswordService {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: SecurityConfig.argon2.memoryCost,
      timeCost: SecurityConfig.argon2.timeCost,
      parallelism: SecurityConfig.argon2.parallelism,
    });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
