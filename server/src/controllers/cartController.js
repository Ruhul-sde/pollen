import Cart from "../models/Cart.js";
import Variant from "../models/Variant.js";
import { Product } from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import { COUPON_TYPE } from "../config/constants.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function calculateCartTotal(cart) {
  let subtotal = 0;
  for (const item of cart.items) {
    subtotal += item.unitPrice * item.qty;
  }

  let couponDiscount = cart.couponDiscount || 0;
  let giftCardDiscount = cart.giftCardDiscount || 0;
  let pointsDiscount = cart.pointsDiscount || 0;
  let total = subtotal - couponDiscount - giftCardDiscount - pointsDiscount;

  return { subtotal, couponDiscount, giftCardDiscount, pointsDiscount, total: Math.max(0, total) };
}

// ── Controllers ───────────────────────────────────────────────────────────────

/** GET /api/v1/cart */
export async function getCart(req, res, next) {
  try {
    let cart = await Cart.findOne({ userId: req.user.id })
      .populate("items.productId", "name imageUrl slug isPublished inStock")
      .populate("items.variantId", "volume sellingPrice discountPrice stock isActive")
      .lean();

    if (!cart) return res.json({ success: true, data: { items: [], subtotal: 0, total: 0 } });

    const totals = await calculateCartTotal(cart);
    res.json({ success: true, data: { ...cart, ...totals } });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/cart/add */
export async function addToCart(req, res, next) {
  try {
    const { productId, variantId, qty = 1 } = req.body;

    // Validate product and variant exist
    const product = await Product.findById(productId);
    if (!product || !product.isPublished) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    let unitPrice = product.price;
    let MRP = product.originalPrice || product.price;
    let volume = product.volume;

    if (variantId) {
      const variant = await Variant.findById(variantId);
      if (!variant || !variant.isActive) {
        return res.status(404).json({ success: false, message: "Variant not found" });
      }
      if (variant.availableStock < qty) {
        return res.status(400).json({ success: false, message: "Insufficient stock" });
      }
      unitPrice = variant.discountPrice ?? variant.sellingPrice;
      MRP = variant.MRP;
      volume = variant.volume;
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

    // Check if item already in cart
    const existingIdx = cart.items.findIndex(
      (i) => i.productId.toString() === productId && (!variantId || i.variantId?.toString() === variantId)
    );

    if (existingIdx >= 0) {
      cart.items[existingIdx].qty += qty;
    } else {
      cart.items.push({
        productId,
        variantId: variantId || undefined,
        name: product.name,
        volume,
        imageUrl: product.imageUrl,
        qty,
        unitPrice,
        MRP,
      });
    }

    cart.lastActivity = new Date();
    await cart.save();

    res.json({ success: true, message: "Added to cart", data: { itemCount: cart.items.length } });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/cart/update */
export async function updateCart(req, res, next) {
  try {
    const { productId, variantId, qty } = req.body;
    if (qty < 1) return res.status(400).json({ success: false, message: "Quantity must be at least 1" });

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const idx = cart.items.findIndex(
      (i) => i.productId.toString() === productId && (!variantId || i.variantId?.toString() === variantId)
    );

    if (idx === -1) return res.status(404).json({ success: false, message: "Item not in cart" });

    cart.items[idx].qty = qty;
    await cart.save();

    res.json({ success: true, message: "Cart updated" });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/cart/remove/:productId */
export async function removeFromCart(req, res, next) {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ success: false, message: "Cart not found" });

    const { variantId } = req.query;
    cart.items = cart.items.filter(
      (i) =>
        !(i.productId.toString() === req.params.productId &&
          (!variantId || i.variantId?.toString() === variantId))
    );

    await cart.save();
    res.json({ success: true, message: "Item removed from cart" });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/cart/clear */
export async function clearCart(req, res, next) {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { items: [], couponId: null, couponCode: "", couponDiscount: 0, giftCardCode: "", giftCardDiscount: 0, pointsDiscount: 0 }
    );
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/cart/apply-coupon */
export async function applyCoupon(req, res, next) {
  try {
    const { code } = req.body;
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
      startsAt: { $lte: new Date() },
    });

    if (!coupon) return res.status(404).json({ success: false, message: "Invalid or expired coupon" });

    const subtotal = cart.items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order of ₹${coupon.minOrderAmount} required for this coupon`,
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    }

    // Check per-user limit
    const userUsed = coupon.usedBy.filter((id) => id.toString() === req.user.id).length;
    if (userUsed >= coupon.perUserLimit) {
      return res.status(400).json({ success: false, message: "You have already used this coupon" });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === COUPON_TYPE.PERCENTAGE) {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === COUPON_TYPE.FLAT) {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === COUPON_TYPE.FREE_SHIPPING) {
      discount = 0; // shipping discount applied at checkout
    } else if (coupon.type === COUPON_TYPE.BXGY) {
      // Find get items and add discount (simplified)
      discount = cart.items
        .filter((i) => coupon.getProducts.some((p) => p.toString() === i.productId.toString()))
        .slice(0, coupon.getQty || 1)
        .reduce((s, i) => s + i.unitPrice, 0);
    }

    cart.couponId = coupon._id;
    cart.couponCode = coupon.code;
    cart.couponDiscount = discount;
    await cart.save();

    const totals = await calculateCartTotal(cart);

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" applied!`,
      data: {
        discount,
        couponType: coupon.type,
        freeShipping: coupon.type === COUPON_TYPE.FREE_SHIPPING,
        ...totals,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/cart/coupon */
export async function removeCoupon(req, res, next) {
  try {
    await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { couponId: null, couponCode: "", couponDiscount: 0 }
    );
    res.json({ success: true, message: "Coupon removed" });
  } catch (err) {
    next(err);
  }
}
