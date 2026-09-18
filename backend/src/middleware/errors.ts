import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../lib/logger.js";

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
}

export function errorHandler(
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode ?? 500;
  const body: ApiErrorBody = {
    statusCode,
    error: error.name || "InternalServerError",
    message: error.message || "An unexpected error occurred",
  };

  if (statusCode >= 500) {
    logger.error({ err: error }, "Unhandled error");
  } else {
    logger.warn({ err: error }, "Client error");
  }

  return reply.status(statusCode).send(body);
}

export class AppError extends Error {
  statusCode: number;
  error: string;

  constructor(statusCode: number, error: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.error = error;
    this.name = error;
  }
}

export function unauthorized(message = "Invalid or expired token.") {
  return new AppError(401, "Unauthorized", message);
}

export function tooManyRequests(retryAfter: number) {
  return new AppError(
    429,
    "Too Many Requests",
    `Rate limit exceeded. Retry after ${retryAfter} seconds.`
  );
}

export function providerUnavailable() {
  return new AppError(
    503,
    "ProviderUnavailable",
    "All stream providers are currently unavailable. Please try again later."
  );
}
