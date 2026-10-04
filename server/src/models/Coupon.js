import mongoose from "mongoose";
import { COUPON_TYPE } from "../config/constants.js";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: Object.values(COUPON_TYPE),
      required: true,
    },
    value: { type: Number, required: true, min: 0 }, // % or flat amount
    maxDiscount: { type: Number, default: null }, // cap for percentage coupons
    minOrderAmount: { type: Number, default: 0 },
    freeShipping: { type: Boolean, default: false },

    // BXGY fields
    buyQty: { type: Number, default: null },
    getQty: { type: Number, default: null },
    buyProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    getProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // Restrictions
    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    excludedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // Usage
    usageLimit: { type: Number, default: null }, // total uses
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 }, // uses per user
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Validity
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },

    isActive: { type: Boolean, default: true },
    isPrivate: { type: Boolean, default: false }, // If true, hidden from checkout available offers
    isFestival: { type: Boolean, default: false },
    festivalName: { type: String, default: "" },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ isPrivate: 1 });

const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
