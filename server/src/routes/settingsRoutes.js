import express from "express";
import { getPublicSettings } from "../controllers/adminController.js";

const router = express.Router();

// GET /api/v1/settings (Public Storefront Configuration)
router.get("/", getPublicSettings);

export default router;
