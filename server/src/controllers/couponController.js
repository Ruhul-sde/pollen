import Coupon from "../models/Coupon.js";
import ShippingRule from "../models/ShippingRule.js";
import { paginate } from "../shared/utils/pagination.js";
import { calculateSpeedPostTariff } from "../services/indiaPostService.js";

// ── Coupon ─────────────────────────────────────────────────────────────────────

/** POST /api/v1/coupons/validate */
export async function validateCoupon(req, res, next) {
  try {
    const { code, cartTotal = 0, productIds = [] } = req.body;
    const cleanCode = (code || "").toString().trim().toUpperCase();

    if (!cleanCode) {
      return res.status(400).json({ success: false, message: "Please enter a valid coupon code" });
    }

    const coupon = await Coupon.findOne({
      code: cleanCode,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!coupon) return res.status(404).json({ success: false, message: "Invalid or expired coupon" });
    if (cartTotal < (coupon.minOrderAmount || 0)) {
      return res.status(400).json({ success: false, message: `Minimum order of ₹${coupon.minOrderAmount} required` });
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    }

    if (req.user?.id) {
      const userUsed = (coupon.usedBy || []).filter((id) => id.toString() === req.user.id.toString()).length;
      if (userUsed >= coupon.perUserLimit) {
        return res.status(400).json({ success: false, message: "You have already used this coupon" });
      }
    }

    let discount = 0;
    if (coupon.type === "percentage") {
      discount = (cartTotal * coupon.value) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    } else if (coupon.type === "flat") {
      discount = Math.min(coupon.value, cartTotal);
    } else if (coupon.type === "free_shipping") {
      discount = 0;
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: Math.round(discount * 100) / 100,
        freeShipping: coupon.type === "free_shipping" || Boolean(coupon.freeShipping),
        description: coupon.description,
        minOrderAmount: coupon.minOrderAmount || 0,
        maxDiscount: coupon.maxDiscount || null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/coupons/available */
export async function getAvailableCoupons(req, res, next) {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      isPrivate: { $ne: true }, // Only return coupons open to all (public)
      expiresAt: { $gt: new Date() },
      startsAt: { $lte: new Date() },
    })
      .select("code type value description minOrderAmount maxDiscount expiresAt freeShipping isFestival festivalName perUserLimit usedBy isPrivate")
      .sort({ isFestival: -1, createdAt: -1 })
      .limit(20)
      .lean();

    // Filter out per-user exhausted
    const filtered = coupons.filter((c) => {
      if (!c.perUserLimit) return true;
      const used = c.usedBy?.filter((id) => id.toString() === req.user?.id).length || 0;
      return used < (c.perUserLimit || 1);
    });

    res.json({ success: true, data: filtered });
  } catch (err) {
    next(err);
  }
}

// ── Admin Coupons ──────────────────────────────────────────────────────────────

/** GET /api/v1/admin/coupons */
export async function adminGetCoupons(req, res, next) {
  try {
    const filter = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
    if (req.query.isPrivate !== undefined) filter.isPrivate = req.query.isPrivate === "true";

    const result = await paginate(Coupon, filter, {
      page: req.query.page || 1,
      limit: req.query.limit || 50,
      sort: { createdAt: -1 },
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/admin/coupons */
export async function createCoupon(req, res, next) {
  try {
    const payload = { ...req.body };
    let couponType = payload.type || payload.discountType || "percentage";
    if (couponType === "fixed") couponType = "flat";
    payload.type = couponType;

    const val = payload.value !== undefined ? payload.value : payload.discountValue;
    payload.value = Number(val ?? 0);

    if (payload.code) payload.code = payload.code.trim().toUpperCase();
    if (payload.minOrderAmount !== undefined) payload.minOrderAmount = Number(payload.minOrderAmount);
    if (payload.maxDiscount !== undefined && payload.maxDiscount !== null && payload.maxDiscount !== "") {
      payload.maxDiscount = Number(payload.maxDiscount);
    } else {
      payload.maxDiscount = null;
    }
    if (!payload.expiresAt) {
      payload.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    if (payload.isPrivate !== undefined || payload.visibility !== undefined) {
      payload.isPrivate = Boolean(payload.isPrivate || payload.visibility === "private");
    }

    const coupon = await Coupon.create(payload);
    res.status(201).json({ success: true, message: "Coupon created", data: coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Coupon code already exists" });
    next(err);
  }
}

/** PUT /api/v1/admin/coupons/:id */
export async function updateCoupon(req, res, next) {
  try {
    const payload = { ...req.body };
    if (payload.type || payload.discountType) {
      let couponType = payload.type || payload.discountType;
      if (couponType === "fixed") couponType = "flat";
      payload.type = couponType;
    }
    if (payload.value !== undefined || payload.discountValue !== undefined) {
      const val = payload.value !== undefined ? payload.value : payload.discountValue;
      payload.value = Number(val);
    }
    if (payload.code) {
      payload.code = payload.code.trim().toUpperCase();
      const existing = await Coupon.findOne({ code: payload.code, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ success: false, message: "Coupon code already exists" });
      }
    }
    if (payload.minOrderAmount !== undefined) {
      payload.minOrderAmount = Number(payload.minOrderAmount);
    }
    if (payload.maxDiscount !== undefined) {
      payload.maxDiscount = (payload.maxDiscount !== null && payload.maxDiscount !== "")
        ? Number(payload.maxDiscount)
        : null;
    }
    if (payload.isPrivate !== undefined || payload.visibility !== undefined) {
      payload.isPrivate = Boolean(payload.isPrivate || payload.visibility === "private");
    }
    if (payload.isActive !== undefined) {
      payload.isActive = Boolean(payload.isActive);
    }

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found" });
    res.json({ success: true, message: "Coupon updated successfully", data: coupon });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "Coupon code already exists" });
    next(err);
  }
}

/** DELETE /api/v1/admin/coupons/:id */
export async function deleteCoupon(req, res, next) {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    next(err);
  }
}

// ── Shipping Rules ──────────────────────────────────────────────────────────────

/** GET /api/v1/shipping/calculate */
export async function calculateShipping(req, res, next) {
  try {
    const { pincode, cartTotal } = req.query;
    const amount = Number(cartTotal) || 0;

    const rule = (await ShippingRule.findOne({ isActive: true, isDefault: true })) || (await ShippingRule.findOne({ isActive: true }));

    if (rule?.blockedPincodes?.includes(pincode)) {
      return res.json({
        success: true,
        data: { deliverable: false, message: "Delivery not available to this pincode via Speed Post" },
      });
    }

    const freeThreshold = rule?.freeShippingAbove !== undefined && rule?.freeShippingAbove !== null
      ? rule.freeShippingAbove
      : 499;

    const speedPostCalc = calculateSpeedPostTariff({
      pincode: pincode ? String(pincode) : "",
      cartTotal: amount,
      freeShippingAbove: freeThreshold,
      customCharges: rule ? {
        shippingType: rule.shippingType || "tiered",
        flatCharge: rule.flatCharge,
        standardCharge: rule.standardCharge,
        localCharge: rule.localCharge,
        circleCharge: rule.circleCharge,
        nationalCharge: rule.nationalCharge,
        specialCharge: rule.specialCharge,
        waiveShipping: rule.waiveShipping ?? false,
        waiveLabel: rule.waiveLabel || "100% Delivery Fee Waived",
        minDays: rule.minDays,
        maxDays: rule.maxDays,
      } : null,
    });

    res.json({
      success: true,
      data: {
        ...speedPostCalc,
        codAvailable: rule?.codAvailable ?? true,
        codCharge: rule?.codCharge ?? 30,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/admin/shipping */
export async function adminGetShipping(req, res, next) {
  try {
    let rules = await ShippingRule.find().sort({ isDefault: -1, priority: -1 }).lean();
    if (!rules || rules.length === 0) {
      const defaultRule = await ShippingRule.create({
        name: "India Post Speed Post Standard",
        description: "Official domestic express air & surface tier pricing",
        isDefault: true,
        isActive: true,
        shippingType: "tiered",
        freeShippingAbove: 499,
        waiveShipping: false,
        waiveLabel: "100% Delivery Fee Waived",
        flatCharge: 65,
        standardCharge: 65,
        localCharge: 35,
        circleCharge: 47,
        nationalCharge: 65,
        specialCharge: 85,
        codCharge: 30,
        codAvailable: true,
        minDays: 3,
        maxDays: 5,
      });
      rules = [defaultRule.toObject()];
    }
    res.json({ success: true, data: rules });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/admin/shipping */
export async function createShippingRule(req, res, next) {
  try {
    if (req.body.isDefault) {
      await ShippingRule.updateMany({}, { isDefault: false });
    }
    const rule = await ShippingRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/admin/shipping/:id */
export async function updateShippingRule(req, res, next) {
  try {
    const id = req.params.id;
    if (req.body.isDefault) {
      await ShippingRule.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }
    let rule;
    if (id && id !== "default" && id !== "undefined") {
      rule = await ShippingRule.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    }
    if (!rule) {
      rule = await ShippingRule.findOneAndUpdate(
        { isDefault: true },
        req.body,
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }
    res.json({ success: true, data: rule });
  } catch (err) {
    next(err);
  }
}
