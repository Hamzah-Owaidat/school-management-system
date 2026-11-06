import { getPrismaClient } from "@sms/db";
import { createApp } from "./app.js";
import { config } from "./core/config.js";
import { logger } from "./core/logger.js";

const server = createApp().listen(config.API_PORT, () => {
  logger.info({ port: config.API_PORT }, "API listening");
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down");

  server.close(() => {
    void getPrismaClient()
      .$disconnect()
      .catch((err: unknown) => {
        logger.error({ err }, "Error while disconnecting from the database");
      })
      .finally(() => {
        process.exit(0);
      });
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
