import express from "express";
import {
  validateCoupon, getAvailableCoupons,
  adminGetCoupons, createCoupon, updateCoupon, deleteCoupon,
} from "../controllers/couponController.js";
import { calculateShipping, getPublicShippingConfig } from "../controllers/couponController.js";
import { subscribe, unsubscribe } from "../controllers/adminController.js";
import { optionalAuth } from "../shared/middleware/auth.js";
import { validateBody, schemas } from "../shared/middleware/validate.js";

const router = express.Router();

// Public / Customer Checkout
router.post("/validate", optionalAuth, validateBody(schemas.couponValidate), validateCoupon);
router.post("/coupons/validate", optionalAuth, validateBody(schemas.couponValidate), validateCoupon);
router.get("/available", optionalAuth, getAvailableCoupons);
router.get("/coupons/available", optionalAuth, getAvailableCoupons);
router.get("/shipping/calculate", calculateShipping);
router.get("/calculate", calculateShipping);
router.get("/shipping/config", getPublicShippingConfig);
router.get("/config", getPublicShippingConfig);
router.get("/shipping", getPublicShippingConfig);
router.post("/newsletter/subscribe", subscribe);
router.post("/newsletter/unsubscribe", unsubscribe);

export default router;
