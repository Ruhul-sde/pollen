import express from "express";
import {
  getProducts, getProductById, getProductBySlug,
  getCategories, getBrands,
} from "../controllers/productController.js";
import { validateQuery, schemas } from "../shared/middleware/validate.js";
import { optionalAuth } from "../shared/middleware/auth.js";

const router = express.Router();

router.get("/", validateQuery(schemas.productQuery), getProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/:id", getProductById);

export default router;
