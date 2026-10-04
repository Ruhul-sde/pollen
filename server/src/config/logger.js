/**
 * Structured logger using Winston.
 * - In development: pretty colorized console output
 * - In production: JSON lines to stdout (Docker/cloud-friendly)
 */

import { createLogger, format, transports } from "winston";

const { combine, timestamp, colorize, printf, json, errors } = format;

const isDev = process.env.NODE_ENV !== "production";

// Human-readable format for development
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? " " + JSON.stringify(meta) : "";
    return `${ts} [${level}] ${message}${stack ? "\n" + stack : ""}${metaStr}`;
  })
);

// JSON format for production (stdout → aggregators like Datadog / CloudWatch / Loki)
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  format: isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console({
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
  exitOnError: false,
});

export default logger;
