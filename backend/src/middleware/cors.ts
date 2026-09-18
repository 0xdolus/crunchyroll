import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { getEnv } from "../config/env.js";

export async function registerCors(server: FastifyInstance) {
  const env = getEnv();
  const isDev = env.NODE_ENV === "development";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());

  await server.register(cors, {
    origin: (origin, cb) => {
      if (isDev) {
        cb(null, true);
        return;
      }
      if (!origin) {
        cb(null, false);
        return;
      }
      if (allowed.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

}
