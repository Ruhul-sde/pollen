import express from "express";
import {
  adminLogin,
} from "../controllers/authController.js";
import {
  getDashboard,
  adminGetUsers, toggleUserStatus, adminGetUserDetails,
  getAdmins, createAdmin,
  salesReport, inventoryReport, customerReport,
  adminGetBanners, createBanner, updateBanner, deleteBanner,
  getSettings, updateSettings,
  getNewsletterSubscribers, getAuditLogs,
} from "../controllers/adminController.js";
import {
  adminGetOrders, updateOrderStatus,
} from "../controllers/orderController.js";
import {
  adminGetReturns, processReturn,
} from "../controllers/returnController.js";
import {
  adminGetReviews, approveReview,
} from "../controllers/reviewController.js";
import {
  adminGetCoupons, createCoupon, updateCoupon, deleteCoupon,
  adminGetShipping, createShippingRule, updateShippingRule,
} from "../controllers/couponController.js";
import {
  createProduct, updateProduct, deleteProduct,
  addVariant, updateVariant, updateStock,
  getCategories, getBrands, getProducts,
} from "../controllers/productController.js";
import { initiateRefund } from "../controllers/paymentController.js";
import { requireAuth, requireAdmin, requireSuperAdmin } from "../shared/middleware/auth.js";
import { authLimiter } from "../shared/middleware/rateLimiter.js";

const router = express.Router();

// Admin Login (public)
router.post("/login", authLimiter, adminLogin);

// All routes below require admin role
router.use(requireAuth, requireAdmin);

// Dashboard
router.get("/dashboard", getDashboard);
router.get("/stats", getDashboard);

// User management
router.get("/users", adminGetUsers);
router.get("/users/:id/details", adminGetUserDetails);
router.put("/users/:id/status", toggleUserStatus);

// Admin management (superadmin only)
router.get("/admins", requireSuperAdmin, getAdmins);
router.post("/admins", requireSuperAdmin, createAdmin);

// Products
router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.post("/products/:id/variants", addVariant);
router.put("/variants/:id", updateVariant);
router.put("/variants/:id/stock", updateStock);

// Categories & Brands
router.get("/categories", getCategories);
router.get("/brands", getBrands);

// Orders
router.get("/orders", adminGetOrders);
router.put("/orders/:id/status", updateOrderStatus);

// Payments/Refunds
router.post("/payments/:id/refund", initiateRefund);

// Returns
router.get("/returns", adminGetReturns);
router.put("/returns/:id", processReturn);

// Reviews
router.get("/reviews", adminGetReviews);
router.put("/reviews/:id/approve", approveReview);

// Coupons
router.get("/coupons", adminGetCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

// Shipping
router.get("/shipping", adminGetShipping);
router.post("/shipping", createShippingRule);
router.put("/shipping", updateShippingRule);
router.put("/shipping/:id", updateShippingRule);

// Banners
router.get("/banners", adminGetBanners);
router.post("/banners", createBanner);
router.put("/banners/:id", updateBanner);
router.delete("/banners/:id", deleteBanner);

// Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

// Reports
router.get("/reports/sales", salesReport);
router.get("/reports/inventory", inventoryReport);
router.get("/reports/customers", customerReport);

// Newsletter
router.get("/newsletter", getNewsletterSubscribers);

// Audit Logs
router.get("/audit-logs", getAuditLogs);

export default router;
