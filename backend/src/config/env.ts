import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TMDB_ACCESS_TOKEN: z.string().min(1),
  ANILIST_ENDPOINT: z.string().url().default("https://graphql.anilist.co"),
  JIKAN_ENDPOINT: z.string().url().default("https://api.jikan.moe/v4"),
  CONSUMET_ENDPOINT: z.string().url(),
  CONSUMET_FALLBACK_ENDPOINT: z
    .string()
    .url()
    .default("https://api.consumet.org"),
  STREAM_PROXY_URL: z.string().url(),
  SYNC_SECRET: z.string().min(1),
  ALLOWED_ORIGINS: z.string().min(1),
  CACHE_TTL_SEARCH: z.coerce.number().int().positive().default(3600),
  CACHE_TTL_ANIME: z.coerce.number().int().positive().default(86400),
  CACHE_TTL_EPISODES: z.coerce.number().int().positive().default(21600),
  CACHE_TTL_TRENDING: z.coerce.number().int().positive().default(1800),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function loadEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    console.error("Invalid environment variables:\n" + issues);
    process.exit(1);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getEnv(): Env {
  if (!cachedEnv) {
    return loadEnv();
  }
  return cachedEnv;
}
