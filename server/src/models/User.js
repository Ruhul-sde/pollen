import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, LOYALTY_TIER } from "../config/constants.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    password: { type: String, required: true, select: false, minlength: 6 },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.USER },
    avatar: { type: String, default: null },

    // Verification
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // Loyalty
    loyaltyPoints: { type: Number, default: 0 },
    loyaltyTier: { type: String, enum: Object.values(LOYALTY_TIER), default: LOYALTY_TIER.BRONZE },

    // Referral
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Password reset
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },

    // Refresh tokens (store hashed tokens for multi-device support)
    refreshTokens: [{ token: String, createdAt: { type: Date, default: Date.now } }],

    // Admin & Session fields
    permissions: [{ type: String }],
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    loginHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        ip: { type: String, default: "" },
        device: { type: String, default: "Web Browser" },
        method: { type: String, default: "Password" },
      },
    ],
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 });

// ── Pre-save: hash password ────────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Methods ────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isAdmin = function () {
  return this.role === ROLES.ADMIN || this.role === ROLES.SUPERADMIN;
};

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// ── Virtuals ───────────────────────────────────────────────────────────────
userSchema.virtual("fullProfile").get(function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    role: this.role,
    isVerified: this.isVerified,
    loyaltyPoints: this.loyaltyPoints,
    loyaltyTier: this.loyaltyTier,
    referralCode: this.referralCode,
  };
});

const User = mongoose.model("User", userSchema);
export default User;
