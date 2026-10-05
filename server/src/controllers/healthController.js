import { getDBStatus } from "../config/db.js";

/**
 * Health check endpoint returning server and database status
 */
export function getHealth(req, res) {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus.stateCode === 1;

  res.status(200).json({
    success: true,
    message: isHealthy ? "Server and MongoDB are healthy" : "Server is running; MongoDB is connecting",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: {
      status: dbStatus.state,
      host: dbStatus.host,
      database: dbStatus.name,
    },
  });
}
