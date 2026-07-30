import { loginSchema } from '../schemas/login.schema';

export type LoginRequest = z.infer<typeof loginSchema>;
