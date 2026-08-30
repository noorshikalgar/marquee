import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  TMDB_API_KEY: z.string().min(1, "TMDB_API_KEY is required"),
  GEMINI_API_KEY: z.string().optional().default(""),
  TAVILY_API_KEY: z.string().optional().default(""),
  VAPID_PUBLIC_KEY: z.string().optional().default(""),
  VAPID_PRIVATE_KEY: z.string().optional().default(""),
  VAPID_SUBJECT: z.string().optional().default("mailto:you@example.com"),
  PORT: z.coerce.number().default(8787),
  // 127.0.0.1 for local dev (never exposed beyond the host). Docker deployments
  // must set this to 0.0.0.0 — otherwise the process is unreachable from other
  // containers (nginx reverse proxy) or from a published port.
  HOST: z.string().default("127.0.0.1"),
  DB_PATH: z.string().default("./data/movie-scout.db"),
  NOTIFICATION_CRON: z.string().default("0 9 * * *"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:5173"),
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string().default("changeme123"),
  COOKIE_SECURE: z.boolean().default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const featureFlags = {
  aiSearchEnabled: env.GEMINI_API_KEY.length > 0,
  tavilyEnabled: env.TAVILY_API_KEY.length > 0,
  pushEnabled: env.VAPID_PUBLIC_KEY.length > 0 && env.VAPID_PRIVATE_KEY.length > 0,
};
