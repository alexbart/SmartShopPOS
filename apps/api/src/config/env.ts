import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  REDIS_ENABLED: z.coerce.boolean().default(false),
  REDIS_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  // Daraja — optional so the app starts without them; STK push will fail cleanly if absent
  MPESA_CONSUMER_KEY: z.string().optional(),
  MPESA_CONSUMER_SECRET: z.string().optional(),
  MPESA_SHORTCODE: z.string().optional(),
  MPESA_PASSKEY: z.string().optional(),
  MPESA_CALLBACK_URL: z.string().url().optional(),
  MPESA_TRANSACTION_TYPE: z
    .enum(['CustomerPayBillOnline', 'CustomerBuyGoodsOnline'])
    .default('CustomerPayBillOnline'),
  MPESA_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_ENABLED: process.env.REDIS_ENABLED ?? false,
  REDIS_URL: process.env.REDIS_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
  MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
  MPESA_SHORTCODE: process.env.MPESA_SHORTCODE,
  MPESA_PASSKEY: process.env.MPESA_PASSKEY,
  MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL,
  MPESA_TRANSACTION_TYPE: process.env.MPESA_TRANSACTION_TYPE,
  MPESA_ENVIRONMENT: process.env.MPESA_ENVIRONMENT,
});
