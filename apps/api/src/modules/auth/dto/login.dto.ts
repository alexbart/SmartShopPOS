import { z } from 'zod';
import { loginSchema } from '../schemas/login.schema.js';

export type LoginRequest = z.infer<typeof loginSchema>;
