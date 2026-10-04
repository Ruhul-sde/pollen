import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../config/constants.js";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    orderRef: { type: String, index: true }, // human-readable order ID

    // Razorpay fields
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true, default: "" },
    razorpaySignature: { type: String, select: false },

    method: { type: String, default: "" }, // card, upi, netbanking, wallet, cod
    provider: { type: String, default: "razorpay" }, // razorpay | cod | gift_card

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },

    failureCode: { type: String, default: "" },
    failureReason: { type: String, default: "" },

    refunds: [
      {
        refundId: String,
        amount: Number,
        reason: String,
        status: { type: String, enum: ["initiated", "processed", "failed"], default: "initiated" },
        initiatedAt: { type: Date, default: Date.now },
        processedAt: Date,
      },
    ],

    webhookPayload: { type: mongoose.Schema.Types.Mixed, select: false },
    capturedAt: { type: Date },
    idempotencyKey: { type: String, unique: true, sparse: true }, // prevent double capture
  },
  { timestamps: true }
);

paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
