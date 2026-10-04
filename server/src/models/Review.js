import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100, default: "" },
    body: { type: String, trim: true, maxlength: 1000, default: "" },
    images: [{ type: String }],

    isApproved: { type: Boolean, default: false },
    isVerifiedPurchase: { type: Boolean, default: false },

    adminResponse: { type: String, default: "" },
    helpfulCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

reviewSchema.index({ productId: 1, isApproved: 1 });
reviewSchema.index({ userId: 1 });
// One review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
