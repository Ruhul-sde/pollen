import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import { globalLimiter } from "./shared/middleware/rateLimiter.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

// ── Route imports ──────────────────────────────────────────────────────────
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import path from "path";
import couponRoutes from "./routes/couponRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

const app = express();

// ── Security middleware ────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://192.168.1.2:3000",
  "https://pollenstore.in",
  "https://www.pollenstore.in",
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  // Always permit any origin during development
  if (process.env.NODE_ENV !== "production") return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172.") ||
      hostname.endsWith(".local")
    ) {
      return true;
    }
  } catch {}
  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-razorpay-signature"],
  })
);

// ── Rate limiting ──────────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Body parsing ───────────────────────────────────────────────────────────
// NOTE: Payment webhook route uses raw body — registered before JSON middleware in paymentRoutes.js
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── Sanitization ───────────────────────────────────────────────────────────
app.use(mongoSanitize());

// ── Logging (dev only) ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  const morgan = (await import("morgan")).default;
  app.use(morgan("dev"));
}

// ── Static uploads serving ────────────────────────────────────────────────
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// ── Routes (all versioned under /api/v1) ──────────────────────────────────
app.use("/api/health", healthRoutes);         // backward compat
app.use("/api/v1/health", healthRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/coupons", couponRoutes);
// NOTE: couponRoutes also handles /shipping and /newsletter sub-routes via its own router
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/admin/upload", uploadRoutes);
app.use("/api/v1/settings", settingsRoutes);

// ── Backward-compatible legacy routes ─────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/settings", settingsRoutes);

// ── Error handling ─────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
