import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  
  PAYMENT_ROUTING_CURRENCY: z.string().default("INR"),
  SKYDO_THRESHOLD_MINOR: z.coerce.number().default(100000),
  
  RAZORPAY_KEY_ID: z.string().min(1, "Razorpay Key ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "Razorpay Key Secret is required"),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  
  SKYDO_API_KEY: z.string().optional(),
  SKYDO_API_SECRET: z.string().optional(),
  SKYDO_WEBHOOK_SECRET: z.string().optional(),
  
  PAYMENT_RETURN_URL: z.string().url().default("http://localhost:3000/checkout/callback"),
  
  REDIS_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables:",
    _env.error.flatten().fieldErrors
  );
  throw new Error("Invalid environment variables");
}

export const env = _env.data;
