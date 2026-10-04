import mongoose from "mongoose";
import { LOYALTY_TIER } from "../config/constants.js";

const loyaltyHistorySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["earn", "redeem", "expire", "bonus", "adjust"], required: true },
    points: { type: Number, required: true },
    balance: { type: Number, required: true },
    description: { type: String, default: "" },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const loyaltySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    points: { type: Number, default: 0, min: 0 },
    lifetimePoints: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: Object.values(LOYALTY_TIER),
      default: LOYALTY_TIER.BRONZE,
    },
    history: [loyaltyHistorySchema],
    nextTierAt: { type: Number, default: 500 }, // points needed for next tier
  },
  { timestamps: true }
);

const Loyalty = mongoose.model("Loyalty", loyaltySchema);
export default Loyalty;
