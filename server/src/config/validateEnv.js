/**
 * Environment variable validation.
 * Call this BEFORE connecting to any services.
 * Fails fast with a clear error if required vars are missing.
 */

const REQUIRED_VARS = [
  "MONGO_URI",
  "JWT_SECRET",
  // JWT_REFRESH_SECRET is optional — falls back to JWT_SECRET (see shared/utils/jwt.js)
];

// Required only in production
const REQUIRED_IN_PROD = [
  "CLIENT_URL",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
];

export function validateEnv() {
  const missing = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) missing.push(key);
  }

  if (process.env.NODE_ENV === "production") {
    for (const key of REQUIRED_IN_PROD) {
      if (!process.env[key]) missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `\n[ENV] ❌ Missing required environment variables:\n` +
        missing.map((k) => `  • ${k}`).join("\n") +
        `\n\nCopy server/.env.example to server/.env and fill in the values.\n`
    );
    process.exit(1);
  }
}
