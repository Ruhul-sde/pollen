import logger from "../config/logger.js";

/**
 * 404 Handler for undefined routes
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.method} ${req.originalUrl}`,
  });
}

// Alias for consistency
export const notFound = notFoundHandler;

/**
 * Centralized error handling middleware
 */
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || "Internal Server Error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Log server errors (5xx) with stack trace; client errors (4xx) at warn level
  if (statusCode >= 500) {
    logger.error(`[Error] ${req.method} ${req.originalUrl}`, {
      statusCode,
      message,
      stack: err.stack,
    });
  } else {
    logger.warn(`[Error] ${req.method} ${req.originalUrl}`, { statusCode, message });
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only expose stack traces in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
