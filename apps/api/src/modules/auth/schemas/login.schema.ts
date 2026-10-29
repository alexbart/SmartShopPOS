import { z } from 'zod';

export const loginSchema = z.object({
  organizationCode: z.string().min(1, 'Organization code is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
