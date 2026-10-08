import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import compression from "compression";
import hpp from "hpp";
import { globalLimiter } from "./shared/middleware/rateLimiter.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import logger from "./config/logger.js";

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
const isProd = process.env.NODE_ENV === "production";

// ── Trust reverse proxy (Docker, Nginx, Cloudflare) ────────────────────────
app.set("trust proxy", 1);

// ── CORS (Allow all origins & methods) ─────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Reflect request origin to allow all origins with credentials: true
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "x-admin-token",
    "x-access-token",
    "x-razorpay-signature",
    "baggage",
    "sentry-trace",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Explicit CORS header fallback to guarantee headers on all responses and preflights
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
  const requestHeaders = req.headers["access-control-request-headers"];
  if (requestHeaders) {
    res.header("Access-Control-Allow-Headers", requestHeaders);
  } else {
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, x-admin-token, x-access-token, x-razorpay-signature, baggage, sentry-trace"
    );
  }
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Normalize any accidental double /api/api prefix
app.use((req, res, next) => {
  if (req.url.startsWith("/api/api/")) {
    req.url = req.url.replace(/^\/api\/api\//, "/api/");
  }
  next();
});

// ── Security headers (Helmet) ──────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
    hsts: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
  })
);

// ── Rate limiting ──────────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Body parsing ───────────────────────────────────────────────────────────
// NOTE: Payment webhook route uses raw body — registered before JSON middleware in paymentRoutes.js
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── HTTP Parameter Pollution protection ────────────────────────────────────
app.use(hpp());

// ── NoSQL injection sanitization ───────────────────────────────────────────
app.use(mongoSanitize());

// ── Response compression ───────────────────────────────────────────────────
app.use(compression());

// ── Request logging ────────────────────────────────────────────────────────
if (!isProd) {
  // Development: colorized Morgan through Winston
  const morgan = (await import("morgan")).default;
  const morganStream = { write: (msg) => logger.http(msg.trim()) };
  app.use(morgan("dev", { stream: morganStream }));
} else {
  // Production: minimal structured access log (method, url, status, response-time)
  const morgan = (await import("morgan")).default;
  const morganStream = { write: (msg) => logger.info(msg.trim()) };
  app.use(morgan("combined", { stream: morganStream }));
}

// ── Static uploads serving ────────────────────────────────────────────────
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// ── Root endpoint for reverse proxy / browser checks ─────────────────────
app.get("/", (req, res) => {
  if (req.accepts("html")) {
    return res.status(200).send(`<!DOCTYPE html>
<html>
  <head>
    <title>Pollen API Server</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
      .card { background: #171717; border: 1px solid #262626; padding: 2.5rem; border-radius: 1rem; text-align: center; max-width: 440px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
      h1 { font-size: 1.5rem; margin: 0.75rem 0 0.5rem; color: #22c55e; }
      p { color: #a3a3a3; font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.5; }
      .badge { display: inline-block; background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; }
      a { color: #f59e0b; text-decoration: none; font-size: 0.85rem; font-weight: 500; }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="badge">&#9679; Live &amp; Operational</span>
      <h1>Server is Running</h1>
      <p>Pollen Node.js &amp; MongoDB backend is healthy and responding.</p>
      <a href="/api/health">View /api/health status &rarr;</a>
    </div>
  </body>
</html>`);
  }

  res.status(200).json({
    success: true,
    message: "Server is running",
    environment: process.env.NODE_ENV || "development",
    health: "/api/health",
  });
});

app.get(["/health", "/healthz", "/ping"], (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// ── Routes (versioned under /api/v1) ──────────────────────────────────────
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
app.use("/api/v1/shipping", couponRoutes);
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
app.use("/api/shipping", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/settings", settingsRoutes);

// ── Error handling ─────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
