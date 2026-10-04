import express from "express";
import {
  getProfile, updateProfile, uploadAvatar,
  getAddresses, addAddress, updateAddress, deleteAddress,
  getLoyalty, getReferral, getMyOrders,
} from "../controllers/userController.js";
import { requireAuth } from "../shared/middleware/auth.js";
import { validateBody, schemas } from "../shared/middleware/validate.js";

const router = express.Router();

// All user routes require authentication
router.use(requireAuth);

router.get("/profile", getProfile);
router.put("/profile", validateBody(schemas.updateProfile), updateProfile);
router.post("/avatar", uploadAvatar);

router.get("/addresses", getAddresses);
router.post("/addresses", validateBody(schemas.address), addAddress);
router.put("/addresses/:id", validateBody(schemas.address), updateAddress);
router.delete("/addresses/:id", deleteAddress);

router.get("/loyalty", getLoyalty);
router.get("/referral", getReferral);
router.get("/orders", getMyOrders);

export default router;
