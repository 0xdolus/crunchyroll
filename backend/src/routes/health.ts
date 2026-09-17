import { FastifyInstance } from "fastify";
import type { HealthResponse } from "../types/api.js";

export async function healthRoutes(server: FastifyInstance) {
  server.get("/health", async (_request, reply) => {
    const body: HealthResponse = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    };
    return reply.status(200).send(body);
  });
}
