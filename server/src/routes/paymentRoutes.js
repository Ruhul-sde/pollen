import express from "express";
import {
  createPaymentOrder, verifyPayment, handleWebhook, getPaymentStatus,
} from "../controllers/paymentController.js";
import { optionalAuth } from "../shared/middleware/auth.js";
import { paymentLimiter } from "../shared/middleware/rateLimiter.js";

const router = express.Router();

// Webhook must be raw body — register before JSON middleware in app.js
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

router.use(optionalAuth);
router.post("/create-order", paymentLimiter, createPaymentOrder);
router.post("/verify", paymentLimiter, verifyPayment);
router.get("/:orderId/status", getPaymentStatus);

export default router;
