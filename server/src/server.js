import dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initAdminUser } from "./controllers/authController.js";
import { autoSeedProducts } from "./controllers/productController.js";
import { initDefaultSettings } from "./controllers/adminController.js";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  // Connect to MongoDB
  await connectDB();

  // Ensure default admin user exists
  await initAdminUser();

  // Ensure catalog products exist in MongoDB
  await autoSeedProducts();

  // Ensure default store settings & dynamic features exist
  await initDefaultSettings();

  // Start Express server (bind to 0.0.0.0 so other devices on local network can access)
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`========================================`);
    console.log(`🚀 Pollen Server running on port ${PORT}`);
    console.log(`   Local:        http://localhost:${PORT}/api/health`);
    console.log(`   Network:      http://0.0.0.0:${PORT}/api/health`);
    console.log(`   Environment:  ${process.env.NODE_ENV || "development"}`);
    console.log(`========================================`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log("\n[Server] Shutting down gracefully...");
    server.close(() => {
      console.log("[Server] Closed HTTP server");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

bootstrap().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
