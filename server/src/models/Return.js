import mongoose from "mongoose";
import { RETURN_TYPE, RETURN_STATUS } from "../config/constants.js";

const returnItemSchema = new mongoose.Schema(
  {
    orderItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String },
    qty: { type: Number, min: 1 },
    unitPrice: { type: Number },
    reason: { type: String, default: "" },
  },
  { _id: false }
);

const returnSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    returnId: { type: String, unique: true },

    items: [returnItemSchema],
    type: { type: String, enum: Object.values(RETURN_TYPE), required: true },
    reason: { type: String, required: true },
    images: [{ type: String }], // customer-uploaded proof photos

    status: {
      type: String,
      enum: Object.values(RETURN_STATUS),
      default: RETURN_STATUS.REQUESTED,
    },

    adminNotes: { type: String, default: "" },
    rejectionReason: { type: String, default: "" },

    refundAmount: { type: Number, default: 0 },
    refundMethod: { type: String, default: "" }, // original | wallet | bank
    refundedAt: { type: Date, default: null },
    refundTransactionId: { type: String, default: "" },

    pickupScheduled: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-generate returnId
returnSchema.pre("save", function (next) {
  if (!this.returnId) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    this.returnId = `RET-${ts}-${rand}`;
  }
  next();
});

returnSchema.index({ orderId: 1 });
returnSchema.index({ userId: 1 });
returnSchema.index({ status: 1 });

const Return = mongoose.model("Return", returnSchema);
export default Return;
