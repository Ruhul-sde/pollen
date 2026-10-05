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
    const missingProd = REQUIRED_IN_PROD.filter((k) => !process.env[k]);
    if (missingProd.length > 0) {
      console.warn(
        `\n[ENV] ⚠️ Warning: Missing recommended production environment variables:\n` +
          missingProd.map((k) => `  • ${k}`).join("\n")
      );
    }
  }
}
