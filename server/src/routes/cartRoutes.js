import express from "express";
import {
  getCart, addToCart, updateCart, removeFromCart, clearCart,
  applyCoupon, removeCoupon,
} from "../controllers/cartController.js";
import { requireAuth } from "../shared/middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCart);
router.delete("/remove/:productId", removeFromCart);
router.delete("/clear", clearCart);
router.post("/coupon", applyCoupon);
router.delete("/coupon", removeCoupon);

export default router;
