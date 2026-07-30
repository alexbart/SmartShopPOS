import { z } from 'zod';

export const organizationSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters').max(120),
  code: z.string().min(2, 'Organization code must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  kraPin: z.string().optional(),
});

export const ownerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

export const registerSchema = z.object({
  organization: organizationSchema,
  owner: ownerSchema,
});
