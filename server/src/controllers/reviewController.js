import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { Product } from "../models/Product.js";
import { paginate } from "../shared/utils/pagination.js";

/** POST /api/v1/reviews */
export async function submitReview(req, res, next) {
  try {
    const { productId, rating, title, body, orderId } = req.body;

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Check verified purchase
    let isVerifiedPurchase = false;
    if (orderId) {
      const order = await Order.findOne({ _id: orderId, userId: req.user.id, status: "delivered" });
      if (order) {
        isVerifiedPurchase = order.items.some((i) => i.productId.toString() === productId);
      }
    }

    const review = await Review.create({
      productId,
      userId: req.user.id,
      orderId: orderId || null,
      rating,
      title,
      body,
      isVerifiedPurchase,
      isApproved: false, // admin must approve
    });

    res.status(201).json({
      success: true,
      message: "Review submitted and pending approval",
      data: { id: review._id },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already reviewed this product" });
    }
    next(err);
  }
}

/** GET /api/v1/products/:id/reviews */
export async function getProductReviews(req, res, next) {
  try {
    const result = await paginate(Review, { productId: req.params.id, isApproved: true }, {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      sort: req.query.sort === "helpful" ? { helpfulCount: -1 } : { createdAt: -1 },
      populate: "userId",
      select: "-reportCount",
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/reviews/:id — user edits own review */
export async function updateReview(req, res, next) {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user.id });
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    const { rating, title, body } = req.body;
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (body !== undefined) review.body = body;
    review.isApproved = false; // re-queue for approval after edit

    await review.save();
    res.json({ success: true, message: "Review updated, pending re-approval" });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/reviews/:id */
export async function deleteReview(req, res, next) {
  try {
    const filter = { _id: req.params.id };
    if (req.user.role === "user") filter.userId = req.user.id; // users can only delete own

    const review = await Review.findOneAndDelete(filter);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    await recalcProductRating(review.productId);
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    next(err);
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/reviews */
export async function adminGetReviews(req, res, next) {
  try {
    const filter = {};
    if (req.query.isApproved !== undefined) filter.isApproved = req.query.isApproved === "true";
    if (req.query.productId) filter.productId = req.query.productId;

    const result = await paginate(Review, filter, {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      populate: "productId userId",
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/admin/reviews/:id/approve */
export async function approveReview(req, res, next) {
  try {
    const { approve, adminResponse } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    review.isApproved = !!approve;
    if (adminResponse) review.adminResponse = adminResponse;
    await review.save();

    if (approve) await recalcProductRating(review.productId);

    res.json({ success: true, message: `Review ${approve ? "approved" : "rejected"}` });
  } catch (err) {
    next(err);
  }
}

// ── Helper ────────────────────────────────────────────────────────────────────

async function recalcProductRating(productId) {
  const agg = await Review.aggregate([
    { $match: { productId, isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  const rating = agg[0] ? Math.round(agg[0].avgRating * 10) / 10 : 0;
  const reviewCount = agg[0]?.count || 0;

  await Product.findByIdAndUpdate(productId, { rating, reviewCount });
}
