import express from "express";
import {
  placeOrder, getOrders, getOrderById, trackOrder,
  cancelOrder, downloadInvoice, deleteOrder, updateOrderPaymentStatus,
} from "../controllers/orderController.js";
import { requestReturn, getMyReturns } from "../controllers/returnController.js";
import { optionalAuth, requireAuth } from "../shared/middleware/auth.js";

const router = express.Router();

router.post("/", optionalAuth, placeOrder);
router.get("/", optionalAuth, getOrders);
router.get("/track/:trackingId", trackOrder);
router.get("/:id", optionalAuth, getOrderById);
router.patch("/:id/status", optionalAuth, updateOrderPaymentStatus);
router.delete("/:id", optionalAuth, deleteOrder);
router.post("/:id/cancel", optionalAuth, cancelOrder);
router.get("/:id/invoice", optionalAuth, downloadInvoice);
router.post("/:id/return", requireAuth, requestReturn);

export default router;
