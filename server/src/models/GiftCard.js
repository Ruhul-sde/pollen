import mongoose from "mongoose";

const giftCardSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    initialBalance: { type: Number, required: true, min: 0 },
    balance: { type: Number, required: true, min: 0 },
    issuedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // admin
    expiresAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageHistory: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        amount: Number,
        usedAt: { type: Date, default: Date.now },
      },
    ],
    message: { type: String, default: "" }, // gift message
  },
  { timestamps: true }
);

giftCardSchema.index({ code: 1 });

const GiftCard = mongoose.model("GiftCard", giftCardSchema);
export default GiftCard;
