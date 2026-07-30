import argon2 from 'argon2';
import { passwordSchema } from '../../../shared/validators/password.validator.js';

export async function hashPassword(plain: string): Promise<string> {
  const parsed = passwordSchema.parse(plain);
  return argon2.hash(parsed, { type: argon2.argon2id });
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
