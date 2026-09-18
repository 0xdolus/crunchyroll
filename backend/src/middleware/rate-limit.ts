import { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";

export async function registerRateLimit(server: FastifyInstance) {
  await server.register(rateLimit, {
    global: false,
    hook: "onRequest",
    enableDraftSpec: false,
  });
}

export const rateLimitConfigs = {
  search: { max: 60, timeWindow: "1 minute" },
  anime: { max: 120, timeWindow: "1 minute" },
  watch: { max: 30, timeWindow: "1 minute" },
  me: { max: 120, timeWindow: "1 minute" },
  sync: { max: 10, timeWindow: "1 hour" },
} as const;
