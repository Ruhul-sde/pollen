import Wishlist from "../models/Wishlist.js";
import { Product } from "../models/Product.js";

/** GET /api/v1/wishlist */
export async function getWishlist(req, res, next) {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id })
      .populate("products", "name imageUrl price originalPrice slug isPublished inStock rating reviewCount")
      .lean();

    res.json({
      success: true,
      data: wishlist
        ? wishlist.products.filter((p) => p.isPublished)
        : [],
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/wishlist/add */
export async function addToWishlist(req, res, next) {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product || !product.isPublished) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Wishlist.findOneAndUpdate(
      { userId: req.user.id },
      { $addToSet: { products: productId } },
      { upsert: true, new: true }
    );

    // Increment product wishlist count
    await Product.findByIdAndUpdate(productId, { $inc: { wishlistCount: 1 } });

    res.json({ success: true, message: "Added to wishlist" });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/wishlist/:productId */
export async function removeFromWishlist(req, res, next) {
  try {
    await Wishlist.findOneAndUpdate(
      { userId: req.user.id },
      { $pull: { products: req.params.productId } }
    );

    await Product.findByIdAndUpdate(req.params.productId, {
      $inc: { wishlistCount: -1 },
    });

    res.json({ success: true, message: "Removed from wishlist" });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/wishlist/check/:productId */
export async function checkWishlist(req, res, next) {
  try {
    const wishlist = await Wishlist.findOne({
      userId: req.user.id,
      products: req.params.productId,
    });
    res.json({ success: true, data: { inWishlist: !!wishlist } });
  } catch (err) {
    next(err);
  }
}
