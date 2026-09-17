import { FastifyRequest, FastifyReply } from "fastify";
import { getSupabase } from "../lib/supabase.js";
import { unauthorized } from "./errors.js";

export interface AuthUser {
  id: string;
  email: string;
}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export async function requireAuth(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw unauthorized();
  }

  const token = header.slice(7);
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw unauthorized();
  }

  request.user = {
    id: data.user.id,
    email: data.user.email ?? "",
  };
}
