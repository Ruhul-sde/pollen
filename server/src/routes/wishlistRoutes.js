import express from "express";
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } from "../controllers/wishlistController.js";
import { requireAuth } from "../shared/middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", getWishlist);
router.post("/add", addToWishlist);
router.delete("/:productId", removeFromWishlist);
router.get("/check/:productId", checkWishlist);

export default router;
