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

const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || "development";

async function bootstrap() {
  const primaryPort = Number(process.env.PORT) || 3000;
  const candidatePorts = Array.from(new Set([primaryPort, 3000, 5000]));
  const activeServers = [];

  for (const port of candidatePorts) {
    try {
      const s = app.listen(port, "0.0.0.0", () => {
        logger.info("========================================");
        logger.info(`🚀 Pollen Server running on port ${port}`);
        logger.info(`   Local:        http://localhost:${port}/api/health`);
        logger.info(`   Network:      http://0.0.0.0:${port}/api/health`);
        logger.info(`   Environment:  ${ENV}`);
        logger.info("========================================");
      });

      s.on("error", (err) => {
        if (err.code === "EADDRINUSE" || err.code === "EACCES") return;
        logger.warn(`[Server] Port ${port} notice: ${err.message}`);
      });

      activeServers.push(s);
    } catch {
      // ignore
    }
  }

  // Connect to MongoDB & initialize data services in background
  try {
    await connectDB();
    await initAdminUser();
    await autoSeedProducts();
    await initDefaultSettings();
  } catch (initErr) {
    logger.warn("[Server] Background database initialization warning:", {
      error: initErr.message,
    });
  }

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`[Server] ${signal} received — shutting down gracefully...`);

    // Stop accepting new connections on all active ports
    activeServers.forEach((s) => {
      try {
        if (typeof s.closeIdleConnections === "function") {
          s.closeIdleConnections();
        }
        s.close();
      } catch {}
    });

    // Close MongoDB connection cleanly
    try {
      await mongoose.connection.close(false);
      logger.info("[Server] MongoDB connection closed");
    } catch (err) {
      logger.error("[Server] Error closing MongoDB:", { error: err.message });
    }

    logger.info("[Server] Shutdown complete");
    process.exit(0);
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
