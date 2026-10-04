import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    volume: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    qty: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    MRP: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
    couponCode: { type: String, default: "" },
    couponDiscount: { type: Number, default: 0 },
    giftCardCode: { type: String, default: "" },
    giftCardDiscount: { type: Number, default: 0 },
    pointsUsed: { type: Number, default: 0 },
    pointsDiscount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Virtual: subtotal before discounts
cartSchema.virtual("subtotal").get(function () {
  return this.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
