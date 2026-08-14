import { z } from 'zod';

const isServer = typeof window === 'undefined';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url("NEXT_PUBLIC_API_BASE_URL must be a valid URL").optional(),
});

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().default("12D16C923BA17672F89B18C1DB22A"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL").optional(),
  PAYMENT_ROUTING_CURRENCY: z.string().default("INR"),
  PAYMENT_RETURN_URL: z.string().url().default("http://localhost:3000/api/payments/return"),
  SKYDO_THRESHOLD_MINOR: z.coerce.number().default(100000),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  SKYDO_CLIENT_ID: z.string().optional(),
  SKYDO_CLIENT_SECRET: z.string().optional(),
  SKYDO_API_URL: z.string().optional(),
  SKYDO_WEBHOOK_SECRET: z.string().optional(),
});

const schema = isServer ? envSchema.merge(serverEnvSchema) : envSchema;

const _env = schema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  ...(isServer ? {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    PAYMENT_ROUTING_CURRENCY: process.env.PAYMENT_ROUTING_CURRENCY,
    PAYMENT_RETURN_URL: process.env.PAYMENT_RETURN_URL,
    SKYDO_THRESHOLD_MINOR: process.env.SKYDO_THRESHOLD_MINOR,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    SKYDO_CLIENT_ID: process.env.SKYDO_CLIENT_ID,
    SKYDO_CLIENT_SECRET: process.env.SKYDO_CLIENT_SECRET,
    SKYDO_API_URL: process.env.SKYDO_API_URL,
    SKYDO_WEBHOOK_SECRET: process.env.SKYDO_WEBHOOK_SECRET,
  } : {})
});

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data as z.infer<typeof envSchema> & Partial<z.infer<typeof serverEnvSchema>>;
