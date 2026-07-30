import { z } from "zod";

export const registerSchema = z.object({
  organizationName: z.string().min(3, "Organization name must be at least 3 characters").max(255, "Organization name must not exceed 255 characters"),
  ownerFirstName: z.string().min(2, "First name must be at least 2 characters"),
  ownerLastName: z.string().min(2, "Last name must be at least 2 characters"),
  ownerEmail: z.string().email("Invalid email address"),
  ownerPhone: z.string().optional(),
  password: z.string().min(12, "Password must be at least 12 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});
