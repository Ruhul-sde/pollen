import express from "express";
import {
  getProducts, getProductById, getProductBySlug,
  getCategories, getBrands, updateProduct, deleteProduct, createProduct,
} from "../controllers/productController.js";
import { validateQuery, schemas } from "../shared/middleware/validate.js";
import { requireAuth, requireAdmin } from "../shared/middleware/auth.js";

const router = express.Router();

router.get("/", validateQuery(schemas.productQuery), getProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);

// Admin operations also available on product routes for maximum client compatibility
router.post("/", requireAuth, requireAdmin, createProduct);
router.put("/:id", requireAuth, requireAdmin, updateProduct);
router.delete("/:id", requireAuth, requireAdmin, deleteProduct);

export default router;
