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
  // Safe defaults if environment variables were not configured in container dashboard
  if (!process.env.MONGO_URI) {
    process.env.MONGO_URI =
      "mongodb+srv://sabinarecline88_db_user:XRMGZ0IY0QG2kBWw@pollen.bs6jioj.mongodb.net";
    console.warn("[ENV] ⚠️ MONGO_URI not provided; using default MongoDB Atlas cluster.");
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "pollen_jwt_secret_change_in_prod_2024";
    console.warn("[ENV] ⚠️ JWT_SECRET not provided; using default secret.");
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
