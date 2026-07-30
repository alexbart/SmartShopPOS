import { z } from "zod";
import { passwordSchema } from "../../../shared/validators/password.validator.js";

export const organizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Organization name must be at least 3 characters")
    .max(120),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20).optional(),
  kraPin: z.string().max(20).optional(),
});

export const ownerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2)
    .max(50),
  lastName: z
    .string()
    .trim()
    .min(2)
    .max(50),
  email: z
    .string()
    .trim()
    .email(),
  phone: z
    .string()
    .min(10)
    .max(20)
    .optional(),
  password: passwordSchema,
});

export const registerSchema = z.object({
  organization: organizationSchema,
  owner: ownerSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
