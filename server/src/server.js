import dotenv from "dotenv";

// Load environment variables from .env FIRST, before any other imports
dotenv.config();

import { validateEnv } from "./config/validateEnv.js";
import logger from "./config/logger.js";

// Validate required env vars — exits process immediately if any are missing
validateEnv();

import mongoose from "mongoose";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initAdminUser } from "./controllers/authController.js";
import { autoSeedProducts } from "./controllers/productController.js";
import { initDefaultSettings } from "./controllers/adminController.js";

const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || "development";

async function bootstrap() {
  // Connect to MongoDB
  await connectDB();

  // Ensure default admin user exists
  await initAdminUser();

  // Ensure catalog products exist in MongoDB
  await autoSeedProducts();

  // Ensure default store settings & dynamic features exist
  await initDefaultSettings();

  // Start Express server (bind to 0.0.0.0 for Docker / network access)
  const server = app.listen(PORT, "0.0.0.0", () => {
    logger.info("========================================");
    logger.info(`🚀 Pollen Server running on port ${PORT}`);
    logger.info(`   Local:        http://localhost:${PORT}/api/health`);
    logger.info(`   Network:      http://0.0.0.0:${PORT}/api/health`);
    logger.info(`   Environment:  ${ENV}`);
    logger.info("========================================");
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`[Server] ${signal} received — shutting down gracefully...`);

    // Give in-flight requests up to 10 s to finish
    const forceExit = setTimeout(() => {
      logger.error("[Server] Graceful shutdown timed out — forcing exit");
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    // Stop accepting new connections
    server.close(async () => {
      logger.info("[Server] HTTP server closed");

      // Close MongoDB connection cleanly
      try {
        await mongoose.connection.close(false);
        logger.info("[Server] MongoDB connection closed");
      } catch (err) {
        logger.error("[Server] Error closing MongoDB:", { error: err.message });
      }

      logger.info("[Server] Shutdown complete");
      process.exit(0);
    });

    // Close idle keep-alive sockets immediately so server.close doesn't hang
    if (typeof server.closeIdleConnections === "function") {
      server.closeIdleConnections();
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Catch unhandled promise rejections — log and exit so Docker restarts the container
  process.on("unhandledRejection", (reason) => {
    logger.error("[Server] Unhandled promise rejection:", { reason: String(reason) });
    shutdown("unhandledRejection");
  });

  // Catch uncaught exceptions — log and exit
  process.on("uncaughtException", (err) => {
    logger.error("[Server] Uncaught exception:", { error: err.message, stack: err.stack });
    shutdown("uncaughtException");
  });
}

bootstrap().catch((err) => {
  logger.error("[Server] Fatal startup error:", { error: err.message, stack: err.stack });
  process.exit(1);
});
