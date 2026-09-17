import Fastify from "fastify";
import { loadEnv, getEnv } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { registerCors } from "./middleware/cors.js";
import { registerRateLimit } from "./middleware/rate-limit.js";
import { errorHandler } from "./middleware/errors.js";
import { healthRoutes } from "./routes/health.js";
import { searchRoutes } from "./routes/search.js";
import { animeRoutes } from "./routes/anime.js";
import { watchRoutes } from "./routes/watch.js";
import { meRoutes } from "./routes/me.js";
import { syncRoutes } from "./routes/sync.js";

async function main() {
  // Fail fast on missing env
  loadEnv();
  const env = getEnv();

  const server = Fastify({
    logger: false, // we use our own pino
    trustProxy: true,
  });

  server.setErrorHandler(errorHandler);

  await registerCors(server);
  await registerRateLimit(server);

  await server.register(healthRoutes);
  await server.register(searchRoutes);
  await server.register(animeRoutes);
  await server.register(watchRoutes);
  await server.register(meRoutes);
  await server.register(syncRoutes);

  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" });
    logger.info(`Backend listening on port ${env.PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
