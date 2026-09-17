import { FastifyRequest, FastifyReply } from "fastify";
import { getEnv } from "../config/env.js";
import { unauthorized } from "./errors.js";

export async function requireSyncAuth(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw unauthorized("Missing or invalid sync authorization.");
  }

  const token = header.slice(7);
  const expected = getEnv().SYNC_SECRET;

  if (token !== expected) {
    throw unauthorized("Invalid sync secret.");
  }
}
