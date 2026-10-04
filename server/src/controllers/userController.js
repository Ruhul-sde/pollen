import User from "../models/User.js";
import Address from "../models/Address.js";
import Loyalty from "../models/Loyalty.js";
import Referral from "../models/Referral.js";
import Order from "../models/Order.js";

/** GET /api/v1/users/profile */
export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        isVerified: user.isVerified,
        loyaltyPoints: user.loyaltyPoints,
        loyaltyTier: user.loyaltyTier,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/users/profile */
export async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone) update.phone = phone;

    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true, runValidators: true });

    res.json({
      success: true,
      message: "Profile updated",
      data: { name: user.name, phone: user.phone },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/users/avatar */
export async function uploadAvatar(req, res, next) {
  try {
    if (!req.file?.path) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { avatar: req.file.path }, { new: true });

    res.json({ success: true, message: "Avatar updated", data: { avatar: user.avatar } });
  } catch (err) {
    next(err);
  }
}

// ── Addresses ─────────────────────────────────────────────────────────────────

/** GET /api/v1/users/addresses */
export async function getAddresses(req, res, next) {
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.json({ success: true, data: addresses });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/users/addresses */
export async function addAddress(req, res, next) {
  try {
    const data = { ...req.body, userId: req.user.id };

    // If this is the first address or isDefault requested, ensure uniqueness
    if (data.isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    } else {
      const count = await Address.countDocuments({ userId: req.user.id });
      if (count === 0) data.isDefault = true; // first address is default
    }

    const address = await Address.create(data);
    res.status(201).json({ success: true, message: "Address added", data: address });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/users/addresses/:id */
export async function updateAddress(req, res, next) {
  try {
    const address = await Address.findOne({ _id: req.params.id, userId: req.user.id });
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    if (req.body.isDefault) {
      await Address.updateMany({ userId: req.user.id }, { isDefault: false });
    }

    Object.assign(address, req.body);
    await address.save();

    res.json({ success: true, message: "Address updated", data: address });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/users/addresses/:id */
export async function deleteAddress(req, res, next) {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    // If we deleted the default, promote the next one
    if (address.isDefault) {
      const next = await Address.findOne({ userId: req.user.id }).sort({ createdAt: 1 });
      if (next) { next.isDefault = true; await next.save(); }
    }

    res.json({ success: true, message: "Address deleted" });
  } catch (err) {
    next(err);
  }
}

// ── Loyalty ────────────────────────────────────────────────────────────────────

/** GET /api/v1/users/loyalty */
export async function getLoyalty(req, res, next) {
  try {
    const loyalty = await Loyalty.findOne({ userId: req.user.id })
      .populate("history.orderId", "orderId total")
      .lean();

    if (!loyalty) return res.json({ success: true, data: { points: 0, tier: "bronze", history: [] } });

    res.json({ success: true, data: loyalty });
  } catch (err) {
    next(err);
  }
}

// ── Referrals ──────────────────────────────────────────────────────────────────

/** GET /api/v1/users/referral */
export async function getReferral(req, res, next) {
  try {
    const user = await User.findById(req.user.id, "referralCode loyaltyPoints").lean();
    const referrals = await Referral.find({ referrerId: req.user.id })
      .populate("refereeId", "name email createdAt")
      .lean();

    const referralLink = `${process.env.CLIENT_URL}/?ref=${user.referralCode}`;

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        totalReferrals: referrals.length,
        completedReferrals: referrals.filter((r) => r.status === "completed").length,
        pointsEarned: referrals.filter((r) => r.rewardGiven).reduce((s, r) => s + r.referrerReward, 0),
        referrals: referrals.slice(0, 20),
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/users/orders — quick summary for user dashboard */
export async function getMyOrders(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("orderId status total paymentMethod paymentStatus createdAt items trackingId estimatedDelivery")
        .lean(),
      Order.countDocuments({ userId: req.user.id }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}
