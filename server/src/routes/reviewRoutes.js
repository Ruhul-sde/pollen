import express from "express";
import {
  submitReview, getProductReviews, updateReview, deleteReview,
} from "../controllers/reviewController.js";
import { requireAuth } from "../shared/middleware/auth.js";
import { validateBody, schemas } from "../shared/middleware/validate.js";

const router = express.Router();

router.get("/product/:productId", getProductReviews);
router.use(requireAuth);
router.post("/", validateBody(schemas.review), submitReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

export default router;
