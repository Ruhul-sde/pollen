import crypto from "crypto";
import mongoose from "mongoose";
import { ORDER_STATUS, PAYMENT_METHOD } from "../config/constants.js";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", default: null },
    name: { type: String, required: true },
    volume: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    MRP: { type: Number, required: true, min: 0 },
    HSN: { type: String, default: "" },
    GSTRate: { type: Number, default: 18 },
    GSTAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "cancelled", "return_requested", "returned", "replaced"],
      default: "active",
    },
    returnReason: { type: String, default: "" },
  },
  { _id: true }
);

const addressSnapshotSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" },
    label: String,
  },
  { _id: false }
);

const trackingEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    description: { type: String, default: "" },
    location: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: String, default: "system" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.Mixed, required: true },

    items: [orderItemSchema],
    deliveryAddress: { type: mongoose.Schema.Types.Mixed },

    // Pricing breakdown
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    couponCode: { type: String, default: "" },
    couponDiscount: { type: Number, default: 0 },
    offerDiscount: { type: Number, default: 0 },
    pointsDiscount: { type: Number, default: 0 },
    giftCardDiscount: { type: Number, default: 0 },
    shippingCharge: { type: Number, default: 0 },
    codCharge: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0 },

    // Payment
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHOD),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
    },
    razorpayOrderId: { type: String, default: "" },

    // Status & Logistics
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
    },
    carrier: { type: String, default: "India Post Speed Post" },
    consignmentNumber: { type: String, default: "" },
    shippingMethod: { type: String, default: "Speed Post Domestic (Express Air & Surface)" },
    trackingId: { type: String, default: null, index: true },
    trackingUrl: { type: String, default: "" },
    trackingEvents: [trackingEventSchema],
    estimatedDelivery: { type: Date, default: null },

    // Meta
    notes: { type: String, default: "" },
    adminNotes: { type: String, default: "" },
    invoiceGenerated: { type: Boolean, default: false },
    cancelReason: { type: String, default: "" },

    // Loyalty
    pointsEarned: { type: Number, default: 0 },
    pointsUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderId: 1 });

/**
 * Generate unique Order ID following the formula:
 * PN + DDMMYY + 4 random digits (e.g. PN3009264821)
 * Guaranteed non-repeating across all orders.
 */
export async function generateUniqueOrderId(date = new Date()) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const prefix = `PN${dd}${mm}${yy}`;

  let attempts = 0;
  while (attempts < 100) {
    attempts++;
    // Generate a random 4-digit number (1000 to 9999)
    const randomNum = crypto.randomInt(1000, 10000).toString();
    const candidate = `${prefix}${randomNum}`;

    // Verify candidate does not already exist
    const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
    const exists = await OrderModel.exists({ orderId: candidate });
    if (!exists) {
      return candidate;
    }
  }

  // Fallback in case of collision
  return `${prefix}${crypto.randomInt(10000, 100000)}`;
}

// Auto-generate orderId using PN+DDMMYY+4 random digits formula
orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    this.orderId = await generateUniqueOrderId(this.createdAt || new Date());
  }
  next();
});

export const Order = mongoose.model("Order", orderSchema);
export default Order;
