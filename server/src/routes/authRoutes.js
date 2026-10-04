import express from "express";
import {
  register, verifyEmail, resendOTP, login, logout,
  refreshToken, getMe, forgotPassword, resetPassword,
  adminLogin, verifyLoginOTP, resendLoginOTP, continueWithEmail,
} from "../controllers/authController.js";
import { requireAuth } from "../shared/middleware/auth.js";
import { validateBody, schemas } from "../shared/middleware/validate.js";
import { authLimiter, otpLimiter } from "../shared/middleware/rateLimiter.js";

const router = express.Router();

router.post("/continue-with-email", otpLimiter, continueWithEmail);
router.post("/register", authLimiter, validateBody(schemas.register), register);
router.post("/signup", authLimiter, validateBody(schemas.register), register);
router.post("/verify-email", otpLimiter, validateBody(schemas.verifyOTP), verifyEmail);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/login", authLimiter, validateBody(schemas.login), login);
router.post("/signin", authLimiter, validateBody(schemas.login), login);
router.post("/verify-login-otp", otpLimiter, validateBody(schemas.verifyOTP), verifyLoginOTP);
router.post("/resend-login-otp", otpLimiter, resendLoginOTP);
router.post("/admin-login", authLimiter, adminLogin);
router.post("/logout", requireAuth, logout);
router.post("/refresh-token", refreshToken);
router.get("/me", requireAuth, getMe);
router.post("/forgot-password", authLimiter, validateBody(schemas.forgotPassword), forgotPassword);
router.post("/reset-password", validateBody(schemas.resetPassword), resetPassword);

export default router;
