import { Router } from "express";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
} from "../controllers/addressController.js";

const router = Router();

router.get("/", getAddresses);
router.post("/", createAddress);
router.put("/:id", updateAddress);
router.patch("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;

