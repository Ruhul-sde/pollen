import rateLimit from "express-rate-limit";

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
    validate: { xForwardedForHeader: false },
  });

// Global API limiter: 200 req / 15 min
export const globalLimiter = createLimiter(
  15 * 60 * 1000,
  200,
  "Too many requests, please try again later"
);

// Auth limiter: 30 attempts in production, 120 in development
export const authLimiter = createLimiter(
  15 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 30 : 120,
  "Too many authentication attempts, please try again in 15 minutes"
);

// OTP limiter: 30 requests in production, 120 in development
export const otpLimiter = createLimiter(
  10 * 60 * 1000,
  process.env.NODE_ENV === "production" ? 30 : 120,
  "Too many OTP requests, please wait before requesting again"
);

// Payment limiter: 20 req / 5 min
export const paymentLimiter = createLimiter(
  5 * 60 * 1000,
  20,
  "Too many payment requests"
);
