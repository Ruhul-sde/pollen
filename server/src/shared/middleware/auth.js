import { verifyAccessToken } from "../utils/jwt.js";
import User from "../../models/User.js";
import { ROLES } from "../../config/constants.js";

/**
 * Middleware: require a valid JWT access token.
 * Sets req.user = { id, email, role }
 */
export async function requireAuth(req, res, next) {
  try {
    let token;

    // Check Authorization header first
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7);
    }
    // Fallback: check httpOnly cookie
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

/**
 * Middleware factory: require one of the specified roles.
 * Must be used after requireAuth.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    next();
  };
}

/**
 * Middleware: require admin role (admin or superadmin)
 */
export function requireAdmin(req, res, next) {
  return requireRole(ROLES.ADMIN, ROLES.SUPERADMIN)(req, res, next);
}

/**
 * Middleware: require superadmin role only
 */
export function requireSuperAdmin(req, res, next) {
  return requireRole(ROLES.SUPERADMIN)(req, res, next);
}

/**
 * Middleware: optional auth — sets req.user if valid token present, continues anyway
 */
export async function optionalAuth(req, res, next) {
  try {
    let token;
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.slice(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
  } catch {
    // ignore — auth is optional
  }
  next();
}
