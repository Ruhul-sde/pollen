import User from "../models/User.js";
import OTP from "../models/OTP.js";
import Loyalty from "../models/Loyalty.js";
import Referral from "../models/Referral.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../shared/utils/jwt.js";
import { generateOTP, getOTPExpiry, isOTPExpired } from "../shared/utils/otp.js";
import { sendOTPEmail, sendWelcomeEmail } from "../shared/utils/email.js";
import { ROLES, LOYALTY_TIER, POINTS_PER_RUPEE } from "../config/constants.js";
import crypto from "crypto";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateReferralCode(name = "") {
  const prefix = name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${prefix}${suffix}`;
}

function sendTokens(res, user) {
  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Set httpOnly cookies
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return { accessToken, refreshToken };
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** POST /api/v1/auth/register */
export async function register(req, res, next) {
  try {
    const { name, email, phone, password, referralCode } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (!existing.isVerified) {
        // Unverified user from prior attempt - generate new OTP and resend
        await OTP.deleteMany({ email: existing.email, type: "email_verify" });
        const otp = generateOTP();
        await OTP.create({
          userId: existing._id,
          email: existing.email,
          code: otp,
          type: "email_verify",
          expiresAt: getOTPExpiry(),
        });
        console.log(`[Auth] Registration OTP for unverified user ${existing.email}: ${otp}`);
        await sendOTPEmail({ to: existing.email, name: existing.name || name, otp, type: "verification" }).catch((err) =>
          console.error("[Auth] Registration OTP email failed:", err.message)
        );

        return res.status(200).json({
          success: true,
          requiresOtp: true,
          message: "An unverified account exists. A new verification code has been sent to your email.",
          data: { email: existing.email },
        });
      }
      return res.status(409).json({ success: false, message: "Email already registered. Please login." });
    }

    // Handle referral
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) referredBy = referrer._id;
    }

    // Normalize phone with +91 prefix
    let cleanPhone = phone ? String(phone).replace(/[^\d+]/g, "").trim() : "";
    if (cleanPhone && !cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.startsWith("91") && cleanPhone.length === 12
        ? `+${cleanPhone}`
        : `+91${cleanPhone.slice(-10)}`;
    }

    if (!cleanPhone || !/^\+91[6-9]\d{9}$/.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit mobile number.",
      });
    }

    // Check if phone number is already registered with another account
    const existingPhone = await User.findOne({ phone: cleanPhone });
    if (existingPhone && (!existing || String(existingPhone._id) !== String(existing._id))) {
      return res.status(409).json({
        success: false,
        message: "Mobile number is already registered with another account.",
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone: cleanPhone,
      password,
      role: ROLES.USER,
      referralCode: generateReferralCode(name),
      referredBy,
      isVerified: false, // Must verify with OTP code sent to email
      isActive: true,
    });

    // Create loyalty account with 100 welcome bonus points
    await Loyalty.create({
      userId: user._id,
      points: 100,
      lifetimePoints: 100,
      tier: LOYALTY_TIER.BRONZE,
      history: [
        {
          type: "bonus",
          points: 100,
          balance: 100,
          description: "Welcome to Pollen bonus points",
        },
      ],
    });

    // Create referral record if applicable
    if (referredBy) {
      await Referral.create({
        referrerId: referredBy,
        refereeId: user._id,
        code: referralCode,
      });
    }

    // Generate email verification OTP
    await OTP.deleteMany({ email: user.email, type: "email_verify" });
    const otp = generateOTP();
    await OTP.create({
      userId: user._id,
      email: user.email,
      code: otp,
      type: "email_verify",
      expiresAt: getOTPExpiry(),
    });

    console.log(`[Auth] Generated registration OTP for ${user.email}: ${otp}`);

    await sendOTPEmail({
      to: user.email,
      name: user.name,
      otp,
      type: "verification",
    }).catch((err) => console.error("[Auth] Registration OTP email failed:", err.message));

    res.status(201).json({
      success: true,
      requiresOtp: true,
      message: "Registration initiated! Please verify your email with the code sent to your inbox.",
      data: {
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/verify-email */
export async function verifyEmail(req, res, next) {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const cleanOTP = otp?.trim();

    const record = await OTP.findOne({ email: normalizedEmail, type: "email_verify", used: false });
    if (!record || isOTPExpired(record.expiresAt)) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    // Brute-force protection: max 5 attempts
    if (record.attempts >= 5) {
      return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please request a new code." });
    }

    if (record.code !== cleanOTP) {
      record.attempts += 1;
      await record.save();
      const remaining = 5 - record.attempts;
      return res.status(400).json({
        success: false,
        message: remaining > 0 ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` : "Too many incorrect attempts. Please request a new code.",
      });
    }

    record.used = true;
    await record.save();

    const user = await User.findByIdAndUpdate(record.userId, { isVerified: true }, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await sendWelcomeEmail({ to: user.email, name: user.name }).catch(() => null);

    const tokens = sendTokens(res, user);

    res.json({
      success: true,
      message: "Email verified successfully! Welcome to Pollen.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          loyaltyPoints: user.loyaltyPoints || 100,
          loyaltyTier: user.loyaltyTier || "bronze",
          avatar: user.avatar,
        },
        accessToken: tokens.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/resend-otp */
export async function resendOTP(req, res, next) {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (user.isVerified) return res.status(400).json({ success: false, message: "Email is already verified" });

    await OTP.deleteMany({ email: user.email, type: "email_verify" });
    const otp = generateOTP();
    await OTP.create({ userId: user._id, email: user.email, code: otp, type: "email_verify", expiresAt: getOTPExpiry() });

    console.log(`[Auth] Resent registration OTP for ${user.email}: ${otp}`);

    await sendOTPEmail({ to: user.email, name: user.name, otp, type: "verification" }).catch((err) =>
      console.error("[Auth] Resend OTP email failed:", err.message)
    );

    res.json({ success: true, message: "A new verification code has been sent to your email" });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/login */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase().trim() }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (user.isLocked()) {
      return res.status(423).json({ success: false, message: "Account locked. Try again later." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
      }
      await user.save();
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    if (!user.isVerified) {
      await OTP.deleteMany({ email: user.email, type: "email_verify" });
      const otp = generateOTP();
      await OTP.create({
        userId: user._id,
        email: user.email,
        code: otp,
        type: "email_verify",
        expiresAt: getOTPExpiry(),
      });
      console.log(`[Auth] Resending email verification OTP for ${user.email}: ${otp}`);
      await sendOTPEmail({
        to: user.email,
        name: user.name,
        otp,
        type: "verification",
      }).catch((err) => console.error("[Auth] Verification OTP email failed:", err.message));

      return res.json({
        success: true,
        requiresOtp: true,
        isSignup: true,
        message: "Your email is not verified yet. A verification code has been sent to your email.",
        data: {
          email: user.email,
        },
      });
    }

    // Direct Login without OTP when email and password match
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    if (!user.loginHistory) user.loginHistory = [];
    user.loginHistory.unshift({
      timestamp: new Date(),
      ip: req.ip || req.connection?.remoteAddress || "127.0.0.1",
      device: req.headers["user-agent"] ? req.headers["user-agent"].split(" ")[0] : "Web Browser",
      method: "Password",
    });
    if (user.loginHistory.length > 20) user.loginHistory = user.loginHistory.slice(0, 20);
    await user.save();

    const tokens = sendTokens(res, user);

    return res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          loyaltyPoints: user.loyaltyPoints || 100,
          loyaltyTier: user.loyaltyTier || "bronze",
          avatar: user.avatar,
        },
        accessToken: tokens.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/verify-login-otp */
export async function verifyLoginOTP(req, res, next) {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const cleanOTP = otp?.trim();

    const record = await OTP.findOne({ email: normalizedEmail, type: "login_verify", used: false });
    if (!record || isOTPExpired(record.expiresAt)) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
    }

    // Brute-force protection: max 5 attempts
    if (record.attempts >= 5) {
      return res.status(429).json({ success: false, message: "Too many incorrect attempts. Please request a new code." });
    }

    if (record.code !== cleanOTP) {
      record.attempts += 1;
      await record.save();
      const remaining = 5 - record.attempts;
      return res.status(400).json({
        success: false,
        message: remaining > 0 ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` : "Too many incorrect attempts. Please request a new code.",
      });
    }

    record.used = true;
    await record.save();

    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    // Reset failed attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
    if (!user.loginHistory) user.loginHistory = [];
    user.loginHistory.unshift({
      timestamp: new Date(),
      ip: req.ip || req.connection?.remoteAddress || "127.0.0.1",
      device: req.headers["user-agent"] ? req.headers["user-agent"].split(" ")[0] : "Web Browser",
      method: "OTP",
    });
    if (user.loginHistory.length > 20) user.loginHistory = user.loginHistory.slice(0, 20);
    await user.save();

    const tokens = sendTokens(res, user);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          loyaltyPoints: user.loyaltyPoints,
          loyaltyTier: user.loyaltyTier,
          avatar: user.avatar,
        },
        accessToken: tokens.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/resend-login-otp */
export async function resendLoginOTP(req, res, next) {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await OTP.deleteMany({ email: user.email, type: "login_verify" });
    const otp = generateOTP();
    await OTP.create({
      userId: user._id,
      email: user.email,
      code: otp,
      type: "login_verify",
      expiresAt: getOTPExpiry(),
    });

    console.log(`[Auth] Resent login OTP for ${user.email}: ${otp}`);

    await sendOTPEmail({
      to: user.email,
      name: user.name,
      otp,
      type: "login_verify",
    }).catch((err) => console.error("[Auth] Resend login OTP failed:", err.message));

    res.json({ success: true, message: "A new verification code has been sent to your email" });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/logout */
export async function logout(req, res, next) {
  try {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/refresh-token */
export async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: "No refresh token" });

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: "Invalid session" });

    const tokens = sendTokens(res, user);
    res.json({ success: true, data: { accessToken: tokens.accessToken } });
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
}

/** GET /api/v1/auth/me */
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyTier: user.loyaltyTier,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/forgot-password */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    // Always return success to prevent email enumeration
    if (!user) return res.json({ success: true, message: "If the email exists, a verification code has been sent." });

    await OTP.deleteMany({ email: user.email, type: "password_reset" });
    const otp = generateOTP();
    await OTP.create({ userId: user._id, email: user.email, code: otp, type: "password_reset", expiresAt: getOTPExpiry() });

    console.log(`[Auth] Generated password reset OTP for ${user.email}: ${otp}`);

    await sendOTPEmail({ to: user.email, name: user.name, otp, type: "password_reset" }).catch((err) =>
      console.error("[Auth] Password reset email failed:", err.message)
    );

    res.json({ success: true, message: "If the email exists, a verification code has been sent." });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/auth/reset-password */
export async function resetPassword(req, res, next) {
  try {
    const { email, otp, password, newPassword } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const cleanOTP = otp?.trim();
    const targetPassword = password || newPassword;

    const record = await OTP.findOne({ email: normalizedEmail, type: "password_reset", used: false });
    if (!record || isOTPExpired(record.expiresAt) || record.code !== cleanOTP) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification code." });
    }

    record.used = true;
    await record.save();

    const user = await User.findById(record.userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    user.password = targetPassword; // will be hashed by pre-save
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully. Please login with your new password." });
  } catch (err) {
    next(err);
  }
}

// ── Admin Auth ─────────────────────────────────────────────────────────────

/** POST /api/v1/admin/login */
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, role: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN] } }).select("+password");
    if (!admin) return res.status(401).json({ success: false, message: "Invalid admin credentials" });

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid admin credentials" });

    if (!admin.isActive) return res.status(403).json({ success: false, message: "Account deactivated" });

    admin.lastLogin = new Date();
    await admin.save();

    const tokens = sendTokens(res, admin);

    res.json({
      success: true,
      message: "Admin login successful",
      data: {
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
        },
        accessToken: tokens.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** Initialize default admin on startup */
export async function initAdminUser() {
  try {
    const existing = await User.findOne({ role: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN] } });
    if (existing) return;

    await User.create({
      name: "Admin",
      email: process.env.ADMIN_EMAIL || "admin@pollen.com",
      password: process.env.ADMIN_PASSWORD || "admin123",
      role: ROLES.SUPERADMIN,
      isVerified: true,
      isActive: true,
      referralCode: "ADMIN000",
    });

    console.log("[Auth] Default admin created: admin@pollen.com / admin123");
  } catch (err) {
    console.error("[Auth] Failed to init admin:", err.message);
  }
}

/** POST /api/v1/auth/continue-with-email (Passwordless Email OTP Login / Sign Up) */
export async function continueWithEmail(req, res, next) {
  try {
    const { email, name, phone } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    if (!normalizedEmail || !/\S+@\S+\.\S+/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Valid email address is required" });
    }

    let cleanPhone = phone ? String(phone).replace(/[^\d+]/g, "").trim() : "";
    if (cleanPhone && !cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.startsWith("91") && cleanPhone.length === 12
        ? `+${cleanPhone}`
        : `+91${cleanPhone.slice(-10)}`;
    }

    let user = await User.findOne({ email: normalizedEmail });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      if (cleanPhone) {
        const existingPhone = await User.findOne({ phone: cleanPhone });
        if (existingPhone) {
          return res.status(409).json({ success: false, message: "Mobile number is already registered with another account." });
        }
      }
      const userName = name?.trim() || normalizedEmail.split("@")[0];
      user = await User.create({
        name: userName,
        email: normalizedEmail,
        phone: cleanPhone || undefined,
        password: crypto.randomBytes(16).toString("hex"),
        role: ROLES.USER,
        referralCode: generateReferralCode(userName),
        isVerified: false,
        isActive: true,
      });

      // Provision loyalty account with 100 welcome bonus points
      await Loyalty.create({
        userId: user._id,
        points: 100,
        lifetimePoints: 100,
        tier: LOYALTY_TIER.BRONZE,
        history: [
          {
            type: "bonus",
            points: 100,
            balance: 100,
            description: "Welcome to Pollen bonus points",
          },
        ],
      });
    }

    const otpType = (!user.isVerified || isNewUser) ? "email_verify" : "login_verify";

    await OTP.deleteMany({ email: user.email, type: otpType });
    const otp = generateOTP();
    await OTP.create({
      userId: user._id,
      email: user.email,
      code: otp,
      type: otpType,
      expiresAt: getOTPExpiry(),
    });

    console.log(`[Auth] Continue with email OTP for ${user.email} (${otpType}): ${otp}`);

    await sendOTPEmail({
      to: user.email,
      name: user.name,
      otp,
      type: otpType === "email_verify" ? "verification" : "login_verify",
    }).catch((err) => console.error("[Auth] Continue with email OTP email failed:", err.message));

    return res.json({
      success: true,
      requiresOtp: true,
      isSignup: isNewUser || !user.isVerified,
      message: `A verification code has been sent to ${user.email}.`,
      data: {
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
}

