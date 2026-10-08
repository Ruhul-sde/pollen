import mongoose from "mongoose";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import Address from "../models/Address.js";
import { Product } from "../models/Product.js";
import Variant from "../models/Variant.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import Coupon from "../models/Coupon.js";
import Review from "../models/Review.js";
import Return from "../models/Return.js";
import Payment from "../models/Payment.js";
import AuditLog from "../models/AuditLog.js";
import Banner from "../models/Banner.js";
import Settings from "../models/Settings.js";
import Newsletter from "../models/Newsletter.js";
import { paginate } from "../shared/utils/pagination.js";

// ── Dashboard Analytics ───────────────────────────────────────────────────────

/** GET /api/v1/admin/dashboard & /api/v1/admin/stats */
export async function getDashboard(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last30 = new Date(today);
    last30.setDate(last30.getDate() - 30);

    const [
      totalRevenueAgg,
      todayRevenueAgg,
      totalOrders,
      todayOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      pendingReturns,
      lowStockVariants,
      recentOrders,
      recentUsers,
      statusAgg,
    ] = await Promise.all([
      Order.aggregate([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.aggregate([{ $match: { paymentStatus: "paid", createdAt: { $gte: today } } }, { $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ role: "user" }),
      Product.countDocuments(),
      Order.countDocuments({ status: { $in: ["pending", "confirmed", "processing"] } }),
      Return.countDocuments({ status: "requested" }),
      Variant.find({ stock: { $lte: 5 }, isActive: true }).populate("productId", "name imageUrl").select("volume stock productId").limit(10).lean(),
      Order.find().sort({ createdAt: -1 }).limit(6).populate("userId", "name email").lean(),
      User.find({ role: "user" }).sort({ createdAt: -1 }).limit(6).select("name email createdAt isActive").lean(),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
    ]);

    // Format status counts
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      return_requested: 0,
      refunded: 0,
    };
    for (const item of statusAgg) {
      if (item._id && statusCounts.hasOwnProperty(item._id)) {
        statusCounts[item._id] = item.count;
      }
    }

    // Revenue last 30 days trend
    const revenueTrend = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: last30 } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const totalRevenue = totalRevenueAgg[0]?.total || 0;
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    res.json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          todayRevenue,
          totalOrders,
          todayOrders,
          totalCustomers,
          totalProducts,
          pendingOrders,
          pendingReturns,
          lowStockCount: lowStockVariants.length,
        },
        // Backward-compat direct fields
        totalOrders,
        totalProducts,
        totalUsers: totalCustomers,
        totalRevenue,
        statusCounts,
        recentOrders,
        recentUsers,
        lowStockVariants,
        revenueTrend,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── User Management ───────────────────────────────────────────────────────────

/** GET /api/v1/admin/users */
export async function adminGetUsers(req, res, next) {
  try {
    const filter = { role: "user" };
    if (req.query.search) {
      filter.$or = [
        { name: new RegExp(req.query.search, "i") },
        { email: new RegExp(req.query.search, "i") },
      ];
    }
    if (req.query.isActive) filter.isActive = req.query.isActive === "true";

    const result = await paginate(User, filter, {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      select: "-password -refreshTokens -passwordResetToken",
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/admin/users/:id/status */
export async function toggleUserStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, select: "name email isActive" }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await AuditLog.create({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: isActive ? "UNBAN_USER" : "BAN_USER",
      entity: "User",
      entityId: req.params.id,
      description: `${isActive ? "Activated" : "Deactivated"} user ${user.email}`,
      ip: req.ip,
    });

    res.json({ success: true, message: `User ${isActive ? "activated" : "deactivated"}`, data: { isActive: user.isActive } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/admin/users/:id/details */
export async function adminGetUserDetails(req, res, next) {
  try {
    const { id } = req.params;
    let user;
    if (mongoose.isValidObjectId(id)) {
      user = await User.findById(id).select("-password -passwordResetToken");
    } else {
      user = await User.findOne({ $or: [{ email: id }, { phone: id }] }).select("-password -passwordResetToken");
    }
    if (!user) return res.status(404).json({ success: false, message: "Customer not found" });

    // 1. Fetch Orders for this user
    const userQuery = {
      $or: [
        { userId: user._id },
        { userId: user._id.toString() },
        { customerEmail: user.email },
        ...(user.phone ? [{ "deliveryAddress.phone": user.phone }] : []),
      ],
    };
    const orders = await Order.find(userQuery).sort({ createdAt: -1 }).lean();

    // 2. Fetch active Cart
    const cart = await Cart.findOne({
      $or: [{ userId: user._id }, { userId: user._id.toString() }],
    }).lean();

    // 3. Fetch Wishlist populated with products
    const wishlistDoc = await Wishlist.findOne({
      $or: [{ userId: user._id }, { userId: user._id.toString() }],
    }).populate("products").lean();

    // 4. Fetch Addresses
    const addresses = await Address.find({
      $or: [{ userId: user._id }, { userId: user._id.toString() }],
    }).sort({ isDefault: -1, createdAt: -1 }).lean();

    // 5. Calculate Metrics
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || Number(o.totalAmount) || 0), 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;
    const cartItemsCount = cart?.items?.reduce((sum, i) => sum + (Number(i.qty) || 1), 0) || 0;
    const cartValue = cart?.items?.reduce((sum, i) => sum + (Number(i.unitPrice) || 0) * (Number(i.qty) || 1), 0) || 0;
    const wishlistCount = wishlistDoc?.products?.length || 0;

    // 6. Build login history & sessions
    const loginHistory = user.loginHistory && user.loginHistory.length > 0
      ? user.loginHistory
      : user.lastLogin
      ? [{ timestamp: user.lastLogin, ip: "127.0.0.1", device: "Desktop Browser (Chrome)", method: "Password" }]
      : [
          {
            timestamp: user.createdAt,
            ip: "127.0.0.1",
            device: "Web Browser",
            method: "Account Registration",
          },
        ];

    res.json({
      success: true,
      data: {
        user: {
          ...user.toObject(),
          id: user._id,
        },
        orders,
        cart: {
          items: cart?.items || [],
          itemCount: cartItemsCount,
          subtotal: cartValue,
          updatedAt: cart?.updatedAt || cart?.lastActivity || null,
        },
        wishlist: wishlistDoc?.products || [],
        addresses,
        loginHistory,
        metrics: {
          totalOrders,
          totalSpent,
          avgOrderValue,
          cartItemsCount,
          cartValue,
          wishlistCount,
          savedAddressesCount: addresses.length,
          accountAgeDays: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
          lastActive: user.lastLogin || cart?.lastActivity || (orders[0] ? orders[0].createdAt : user.createdAt),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Admin Management ──────────────────────────────────────────────────────────

/** GET /api/v1/admin/admins */
export async function getAdmins(req, res, next) {
  try {
    const admins = await User.find({ role: { $in: ["admin", "superadmin"] } })
      .select("-password -refreshTokens")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: admins });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/admin/admins */
export async function createAdmin(req, res, next) {
  try {
    const { name, email, password, phone, role, permissions, isActive } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Admin full name is required" });
    }
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Valid email address is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    if (phone?.trim()) {
      const existingPhone = await User.findOne({ phone: phone.trim() });
      if (existingPhone) {
        return res.status(409).json({ success: false, message: "Phone number is already associated with another account" });
      }
    }

    const adminRole = role === "superadmin" ? "superadmin" : "admin";
    const perms = Array.isArray(permissions) && permissions.length > 0 ? permissions : ["all"];

    const admin = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone?.trim() || undefined,
      role: adminRole,
      permissions: perms,
      isVerified: true,
      isActive: isActive !== false,
    });

    // Safely write audit log without throwing
    try {
      let actorId = mongoose.isValidObjectId(req.user?.id) ? req.user.id : null;
      if (!actorId) {
        const rootAdmin = await User.findOne({ role: { $in: ["admin", "superadmin"] } }).select("_id");
        actorId = rootAdmin?._id || admin._id;
      }

      await AuditLog.create({
        adminId: actorId,
        adminEmail: req.user?.email || "admin",
        action: "CREATE_ADMIN",
        entity: "User",
        entityId: admin._id.toString(),
        description: `Created admin ${admin.name} (${admin.email}) [Role: ${adminRole}]`,
        ip: req.ip || "",
      });
    } catch (auditErr) {
      console.warn("[AuditLog] Failed to log admin creation:", auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: `Admin ${admin.name} created successfully`,
      data: {
        _id: admin._id,
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive,
        isVerified: admin.isVerified,
        createdAt: admin.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/admin/admins/:id */
export async function updateAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, phone, role, permissions, isActive, password } = req.body;

    const admin = await User.findById(id).select("+password");
    if (!admin || !["admin", "superadmin"].includes(admin.role)) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (email && email.toLowerCase().trim() !== admin.email) {
      const emailTaken = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: id } });
      if (emailTaken) {
        return res.status(409).json({ success: false, message: "Email is already taken by another account" });
      }
      admin.email = email.toLowerCase().trim();
    }

    if (phone !== undefined) {
      const cleanPhone = phone?.trim() || "";
      if (cleanPhone && cleanPhone !== admin.phone) {
        const phoneTaken = await User.findOne({ phone: cleanPhone, _id: { $ne: id } });
        if (phoneTaken) {
          return res.status(409).json({ success: false, message: "Phone number is already associated with another account" });
        }
      }
      admin.phone = cleanPhone || undefined;
    }

    if (name?.trim()) admin.name = name.trim();
    if (role && ["admin", "superadmin"].includes(role)) admin.role = role;
    if (Array.isArray(permissions)) admin.permissions = permissions;
    if (typeof isActive === "boolean") admin.isActive = isActive;
    if (password && password.trim().length >= 6) {
      admin.password = password.trim();
    }

    await admin.save();

    try {
      let actorId = mongoose.isValidObjectId(req.user?.id) ? req.user.id : null;
      if (!actorId) {
        const rootAdmin = await User.findOne({ role: { $in: ["admin", "superadmin"] } }).select("_id");
        actorId = rootAdmin?._id || admin._id;
      }

      await AuditLog.create({
        adminId: actorId,
        adminEmail: req.user?.email || "admin",
        action: "UPDATE_ADMIN",
        entity: "User",
        entityId: admin._id.toString(),
        description: `Updated admin ${admin.name} (${admin.email})`,
        ip: req.ip || "",
      });
    } catch (auditErr) {
      console.warn("[AuditLog] Failed to log admin update:", auditErr.message);
    }

    const safeAdmin = admin.toObject();
    delete safeAdmin.password;
    delete safeAdmin.refreshTokens;

    res.json({
      success: true,
      message: "Admin details updated successfully",
      data: safeAdmin,
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/admin/admins/:id */
export async function deleteAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const admin = await User.findById(id);
    if (!admin || !["admin", "superadmin"].includes(admin.role)) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Safety checks: don't allow deleting self or primary system admins
    if (req.user?.id && String(req.user.id) === String(id)) {
      return res.status(400).json({ success: false, message: "You cannot delete your own admin account" });
    }
    if (req.user?.email && req.user.email.toLowerCase() === admin.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own admin account" });
    }

    const protectedEmails = [
      "admin@pollen.com",
      (process.env.ADMIN_EMAIL || "").toLowerCase().trim(),
    ].filter(Boolean);

    if (protectedEmails.includes(admin.email.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Primary system administrator account cannot be deleted" });
    }

    await User.findByIdAndDelete(id);

    try {
      let actorId = mongoose.isValidObjectId(req.user?.id) ? req.user.id : null;
      if (!actorId) {
        const rootAdmin = await User.findOne({ role: { $in: ["admin", "superadmin"] } }).select("_id");
        actorId = rootAdmin?._id;
      }

      await AuditLog.create({
        adminId: actorId,
        adminEmail: req.user?.email || "admin",
        action: "DELETE_ADMIN",
        entity: "User",
        entityId: id,
        description: `Deleted admin ${admin.name} (${admin.email})`,
        ip: req.ip || "",
      });
    } catch (auditErr) {
      console.warn("[AuditLog] Failed to log admin deletion:", auditErr.message);
    }

    res.json({ success: true, message: `Admin ${admin.email} deleted successfully` });
  } catch (err) {
    next(err);
  }
}

// ── Reports ───────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/reports/sales */
export async function salesReport(req, res, next) {
  try {
    const { from, to, groupBy = "day" } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = to ? new Date(to) : new Date();

    const format = groupBy === "month" ? "%Y-%m" : groupBy === "week" ? "%Y-W%V" : "%Y-%m-%d";

    const report = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $dateToString: { format, date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: "$total" },
          totalDiscount: { $sum: "$discount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totals = report.reduce((s, r) => ({
      revenue: s.revenue + r.revenue,
      orders: s.orders + r.orders,
    }), { revenue: 0, orders: 0 });

    res.json({ success: true, data: { report, totals, period: { from: start, to: end } } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/admin/reports/inventory */
export async function inventoryReport(req, res, next) {
  try {
    const variants = await Variant.find({ isActive: true })
      .populate("productId", "name slug imageUrl")
      .sort({ stock: 1 })
      .lean();

    const summary = {
      total: variants.length,
      outOfStock: variants.filter((v) => v.stock === 0).length,
      lowStock: variants.filter((v) => v.stock > 0 && v.stock <= 10).length,
      inStock: variants.filter((v) => v.stock > 10).length,
    };

    res.json({ success: true, data: { summary, variants } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/admin/reports/customers */
export async function customerReport(req, res, next) {
  try {
    const { from, to } = req.query;
    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = to ? new Date(to) : new Date();

    const [newCustomers, topCustomers] = await Promise.all([
      User.countDocuments({ role: "user", createdAt: { $gte: start, $lte: end } }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: "$userId", totalSpend: { $sum: "$total" }, orderCount: { $sum: 1 } } },
        { $sort: { totalSpend: -1 } },
        { $limit: 10 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { name: "$user.name", email: "$user.email", totalSpend: 1, orderCount: 1 } },
      ]),
    ]);

    res.json({ success: true, data: { newCustomers, topCustomers } });
  } catch (err) {
    next(err);
  }
}

// ── Banners ───────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/banners */
export async function adminGetBanners(req, res, next) {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1 }).lean();
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
}

/** GET /api/v1/banners — public */
export async function getPublicBanners(req, res, next) {
  try {
    const now = new Date();
    const filter = {
      isActive: true,
      $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
      $and: [{ $or: [{ endsAt: null }, { endsAt: { $gte: now } }] }],
    };
    if (req.query.position) filter.position = req.query.position;

    const banners = await Banner.find(filter).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
}

/** POST /api/v1/admin/banners */
export async function createBanner(req, res, next) {
  try {
    const banner = await Banner.create(req.body);
    res.status(201).json({ success: true, data: banner });
  } catch (err) { next(err); }
}

/** PUT /api/v1/admin/banners/:id */
export async function updateBanner(req, res, next) {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: banner });
  } catch (err) { next(err); }
}

/** DELETE /api/v1/admin/banners/:id */
export async function deleteBanner(req, res, next) {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Banner deleted" });
  } catch (err) { next(err); }
}

// ── Settings ───────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/settings */
export async function getSettings(req, res, next) {
  try {
    const filter = {};
    if (req.query.group) filter.group = req.query.group;
    let settings = await Settings.find(filter).lean();

    // If no settings exist yet, auto-seed defaults
    if (settings.length === 0) {
      await initDefaultSettings();
      settings = await Settings.find(filter).lean();
    }

    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
}

/** GET /api/v1/settings (Public Storefront Settings) */
export async function getPublicSettings(req, res, next) {
  try {
    const allSettings = await Settings.find({}).lean();
    
    // Convert array of settings to structured tenant config
    const featuresSetting = allSettings.find((s) => s.key === "features");
    const themeSetting = allSettings.find((s) => s.key === "theme");
    const adminThemeSetting = allSettings.find((s) => s.key === "adminTheme");
    const brandingSetting = allSettings.find((s) => s.key === "branding");
    const navigationSetting = allSettings.find((s) => s.key === "navigation");
    const policiesSetting = allSettings.find((s) => s.key === "policies");

    res.json({
      success: true,
      data: {
        features: featuresSetting?.value || null,
        theme: themeSetting?.value || null,
        adminTheme: adminThemeSetting?.value || null,
        branding: brandingSetting?.value || null,
        navigation: navigationSetting?.value || null,
        policies: policiesSetting?.value || null,
        raw: allSettings.filter((s) => s.isPublic !== false),
      },
    });
  } catch (err) { next(err); }
}

/** PUT /api/v1/admin/settings */
export async function updateSettings(req, res, next) {
  try {
    const body = req.body;
    let updates = [];

    if (Array.isArray(body)) {
      updates = body;
    } else if (body && typeof body === "object") {
      // Could be { settings: [...] } or { features: {...}, theme: {...} }
      if (Array.isArray(body.settings)) {
        updates = body.settings;
      } else {
        updates = Object.entries(body).map(([key, value]) => ({
          key,
          value,
          group: ["features", "theme", "branding", "navigation", "policies"].includes(key) ? key : "general",
          isPublic: true,
        }));
      }
    }

    const userId = req.user?.id || null;
    const ops = updates.map(({ key, value, group, label, description, isPublic }) => {
      const updateData = { value, updatedBy: userId };
      if (group !== undefined) updateData.group = group;
      if (label !== undefined) updateData.label = label;
      if (description !== undefined) updateData.description = description;
      if (isPublic !== undefined) updateData.isPublic = isPublic;

      return Settings.findOneAndUpdate(
        { key },
        { $set: updateData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    const updated = await Promise.all(ops);
    res.json({ success: true, message: "Settings updated successfully", data: updated });
  } catch (err) { next(err); }
}

const DEFAULT_ABOUT_STORY = `POLLEN is a fragrance brand made for everyday life.
A few sprays before leaving home.
Perfume before meeting someone.
Getting ready for no particular reason.
We like those little moments.
So we make fragrances that fit into them.
Different moods,days or different versions of you.
Pick the one that feels right today.
POLLEN, for the little moments that become part of your day.`;

const DEFAULT_POLICIES_DATA = {
  terms: {
    title: "Terms & Conditions",
    lastUpdated: "September 2026",
    intro: "Welcome to POLLEN.\n\nBy using our website or placing an order, you agree to these terms.",
    sections: [
      {
        id: "terms-products",
        heading: "Products",
        body: "We do our best to show our products as accurately as possible.\n\nThe colour of a product may look slightly different depending on your screen or device.",
      },
      {
        id: "terms-pricing",
        heading: "Pricing",
        body: "All prices are shown in Indian Rupees (₹).\n\nThe price shown at checkout applies to your order. Any applicable shipping charges will be shown before you complete your purchase.",
      },
      {
        id: "terms-orders",
        heading: "Orders",
        body: "Once your order is placed, you'll receive an order confirmation.\n\nAn order may be cancelled if the product becomes unavailable, there is an incorrect price or product detail on the website, or an order appears to involve fraudulent activity.\n\nIf we've already received your payment, we'll refund the amount paid for a cancelled order.",
      },
      {
        id: "terms-delivery",
        heading: "Delivery",
        body: "Orders are shipped to the address provided during checkout.\n\nDelivery time can vary depending on your location and the courier service.\n\nPlease check your address and phone number before placing your order.",
      },
      {
        id: "terms-damaged",
        heading: "Damaged or Incorrect Orders",
        body: "If your order arrives damaged, leaking, defective, or with the wrong product, contact us within 48 hours of delivery.\n\nPlease send your order number along with clear photos or a video of the product and packaging.\n\nWe'll review the issue and help with the appropriate resolution.",
      },
      {
        id: "terms-content",
        heading: "Website Content",
        body: "All POLLEN photographs, designs, text, product names, logos and other website content belong to POLLEN or are used with permission.\n\nPlease contact us before using any of our content elsewhere.",
      },
    ],
  },
  ordersShipping: {
    title: "Orders & Shipping",
    lastUpdated: "September 2026",
    intro: "Every POLLEN fragrance is priced at ₹499 for 50 ml. Shipping charges, if applicable, will be shown at checkout.",
    sections: [
      {
        id: "ship-pricing",
        heading: "Pricing & Checkout",
        body: "All prices are shown in Indian Rupees (₹).\n\nThe price shown at checkout applies to your order. Any applicable shipping charges will be shown before you complete your purchase.",
      },
      {
        id: "ship-delivery",
        heading: "Delivery Timelines",
        body: "Orders are shipped via India Post Speed Post EMS.\n\nDelivery time can vary depending on your location and the courier service. Please check your address and phone number before placing your order.",
      },
      {
        id: "ship-support",
        heading: "Customer Support",
        body: "For shipping questions or updates, reach out to us at contactpollen@gmail.com or on WhatsApp at +91 9609180954.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "September 2026",
    intro: "When you shop with POLLEN, we collect the information needed to process your order and get it to you.\n\nThis may include your name, phone number, email address, billing address, delivery address and order details.",
    sections: [
      {
        id: "privacy-usage",
        heading: "How We Use Your Information",
        body: "We use your information to:\n1. Process and deliver your orders\n2. Send order and delivery updates\n3. Respond to your questions\n4. Process payments\n5. Improve our website and products\n6. Prevent fraud and misuse\n7. Send marketing messages when you've chosen to receive them",
      },
      {
        id: "privacy-sharing",
        heading: "Sharing Your Information",
        body: "Some information needs to be shared with the people and services that help us run POLLEN.\n\nThis may include payment providers, courier partners, website providers and customer support services.\n\nWe only share information needed for these services.",
      },
      {
        id: "privacy-security",
        heading: "Your Information",
        body: "We take reasonable steps to keep your information safe.\n\nIf you have a question about your personal information or want to make a request about it, contact us at contactpollen@gmail.com.",
      },
    ],
  },
  refund: {
    title: "Refund & Exchange Policy",
    lastUpdated: "September 2026",
    intro: "We do not offer refunds; however, if the issue is genuine, a gift code of the same value will be provided to the customer.",
    sections: [
      {
        id: "refund-cover",
        heading: "What We Cover",
        body: "We offer replacements or gift codes for orders that arrive damaged, defective, or incorrect. This includes leakage, breakage, or a wrong item being delivered. As a fragrance brand our products cannot be returned or resold once opened, items cannot be returned once delivered.",
      },
      {
        id: "refund-claim",
        heading: "How to Raise a Claim",
        body: "We cover damaged, defective, or incorrect items. Report within 48 hours of delivery.\n\nWhat you need:\n1. Your order number\n2. An unboxing video showing the sealed package, opening and the issue\n3. Photos of the damaged packaging box with shipping label affixed and photos of damaged or wrong item.",
      },
      {
        id: "refund-contact",
        heading: "Contact Us",
        body: "On WhatsApp: +91 9609180954 OR mail: contactpollen@gmail.com",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    lastUpdated: "September 2026",
    intro: "POLLEN uses cookies to keep the website working properly and understand how people use it.",
    sections: [
      {
        id: "cookie-essential",
        heading: "Essential Website Cookies",
        body: "Some cookies help with things like your cart, checkout and website security.",
      },
      {
        id: "cookie-analytics",
        heading: "Analytics & Experience",
        body: "Others help us understand which parts of the website people use, so we can make the experience better.",
      },
      {
        id: "cookie-advertising",
        heading: "Advertising Performance",
        body: "We may also use cookies to understand how our advertising performs.",
      },
      {
        id: "cookie-manage",
        heading: "Managing Your Cookies",
        body: "You can manage or turn off cookies through your browser settings.\n\nSome parts of the website may not work properly when certain cookies are turned off.",
      },
    ],
  },
};

/** Default Settings Initializer */
export async function initDefaultSettings() {
  try {
    const count = await Settings.countDocuments();
    if (count > 0) {
      // Ensure policies setting is present
      const policiesExist = await Settings.findOne({ key: "policies" });
      if (!policiesExist) {
        await Settings.create({
          key: "policies",
          value: DEFAULT_POLICIES_DATA,
          group: "policies",
          label: "Store Legal & Policies",
          description: "Terms, Refund, Privacy, Shipping, and Cookie policies",
          isPublic: true,
        });
        console.log("[Settings] Default store policies seeded into existing settings");
      }

      // Ensure branding setting has aboutTitle and aboutStory
      const brandingSetting = await Settings.findOne({ key: "branding" });
      if (brandingSetting) {
        let changed = false;
        const currentVal = brandingSetting.value || {};
        if (!currentVal.aboutTitle) {
          currentVal.aboutTitle = "About POLLEN";
          changed = true;
        }
        if (!currentVal.aboutStory) {
          currentVal.aboutStory = DEFAULT_ABOUT_STORY;
          changed = true;
        }
        if (!currentVal.supportEmail || currentVal.supportEmail.includes("concierge@")) {
          currentVal.supportEmail = "contactpollen@gmail.com";
          changed = true;
        }
        if (!currentVal.supportPhone || currentVal.supportPhone.includes("98765")) {
          currentVal.supportPhone = "+91 9609180954";
          changed = true;
        }
        if (changed) {
          brandingSetting.value = currentVal;
          brandingSetting.markModified("value");
          await brandingSetting.save();
          console.log("[Settings] Updated branding settings with official Google Doc copy");
        }
      }
      return;
    }

    const defaults = [
      {
        key: "features",
        value: {
          reviews: true,
          returns: true,
          coupons: true,
          newsletter: true,
          giftSet: true,
          adminDashboard: true,
          savedAddresses: true,
          dynamicPricing: true,
          orderTracking: true,
          socialProof: true,
        },
        group: "features",
        label: "Platform Features",
        description: "Dynamic feature toggles across the storefront",
        isPublic: true,
      },
      {
        key: "theme",
        value: {
          accentColor: "#f59e0b",
          primaryColor: "#000000",
          mode: "auto",
          bannerEnabled: true,
          bannerText: "Complimentary India Post Speed Post on orders above ₹499 · Luxury Samples Included",
        },
        group: "theme",
        label: "Store Theme",
        description: "Visual appearance, theme mode, and announcement messaging",
        isPublic: true,
      },
      {
        key: "adminTheme",
        value: {
          mode: "dark",
          accentColor: "#f59e0b",
          sidebarStyle: "solid",
        },
        group: "theme",
        label: "Admin Theme",
        description: "Visual appearance, theme mode, and accent colors for Admin Dashboard",
        isPublic: true,
      },
      {
        key: "branding",
        value: {
          companyId: "pollen-luxury",
          brandName: "Pollen",
          brandTagline: "Fragrances made for everyday life.",
          aboutTitle: "About POLLEN",
          aboutStory: DEFAULT_ABOUT_STORY,
          currencySymbol: "₹",
          currencyCode: "INR",
          supportEmail: "contactpollen@gmail.com",
          supportPhone: "+91 9609180954",
          socialLinks: {
            instagram: "https://www.instagram.com/_pollen.co",
            facebook: "https://www.facebook.com/share/1EKwnHM4Ya/",
          },
        },
        group: "branding",
        label: "Company Branding",
        description: "Store name, branding tagline, support and social media channels",
        isPublic: true,
      },
      {
        key: "navigation",
        value: {
          showCollectionLink: true,
          showGiftSetLink: true,
          showAboutLink: true,
        },
        group: "navigation",
        label: "Navigation Controls",
        description: "Store navigation visibility settings",
        isPublic: true,
      },
      {
        key: "policies",
        value: DEFAULT_POLICIES_DATA,
        group: "policies",
        label: "Store Legal & Policies",
        description: "Terms, Refund, Privacy, Shipping, and Cookie policies",
        isPublic: true,
      },
    ];

    await Settings.insertMany(defaults);
    console.log("[Settings] Default store settings, features & policies initialized");
  } catch (err) {
    console.error("[Settings] Failed to seed default settings:", err.message);
  }
}

// ── Newsletter ─────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/newsletter */
export async function getNewsletterSubscribers(req, res, next) {
  try {
    const result = await paginate(Newsletter, {}, {
      page: req.query.page || 1,
      limit: req.query.limit || 50,
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

/** POST /api/v1/newsletter/subscribe — public */
export async function subscribe(req, res, next) {
  try {
    const { email, name } = req.body;
    await Newsletter.findOneAndUpdate(
      { email },
      { email, name, isSubscribed: true, subscribedAt: new Date() },
      { upsert: true }
    );
    res.json({ success: true, message: "Subscribed successfully!" });
  } catch (err) { next(err); }
}

/** POST /api/v1/newsletter/unsubscribe — public */
export async function unsubscribe(req, res, next) {
  try {
    const { email } = req.body;
    await Newsletter.findOneAndUpdate({ email }, { isSubscribed: false, unsubscribedAt: new Date() });
    res.json({ success: true, message: "Unsubscribed" });
  } catch (err) { next(err); }
}

// ── Audit Log ──────────────────────────────────────────────────────────────────

/** GET /api/v1/admin/audit-logs */
export async function getAuditLogs(req, res, next) {
  try {
    const result = await paginate(AuditLog, {}, {
      page: req.query.page || 1,
      limit: req.query.limit || 50,
      sort: { createdAt: -1 },
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}
