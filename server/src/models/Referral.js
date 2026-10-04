import mongoose from "mongoose";

const referralSchema = new mongoose.Schema(
  {
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "rewarded", "expired"],
      default: "pending",
    },
    referrerReward: { type: Number, default: 0 }, // points given to referrer
    refereeReward: { type: Number, default: 0 }, // points given to referee
    rewardGiven: { type: Boolean, default: false },
    qualifyingOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

referralSchema.index({ referrerId: 1 });
referralSchema.index({ refereeId: 1 });
referralSchema.index({ code: 1 });

const Referral = mongoose.model("Referral", referralSchema);
export default Referral;
