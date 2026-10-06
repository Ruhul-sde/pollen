import mongoose from "mongoose";
import Order, { generateUniqueOrderId } from "../models/Order.js";
import Cart from "../models/Cart.js";
import Variant from "../models/Variant.js";
import { Product } from "../models/Product.js";
import Address from "../models/Address.js";
import Coupon from "../models/Coupon.js";
import GiftCard from "../models/GiftCard.js";
import ShippingRule from "../models/ShippingRule.js";
import Payment from "../models/Payment.js";
import Invoice from "../models/Invoice.js";
import Loyalty from "../models/Loyalty.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { generateInvoicePDF } from "../shared/utils/invoice.js";
import { sendOrderConfirmationEmail, sendOrderShippedEmail, sendOrderDeliveredEmail } from "../shared/utils/email.js";
import { sendOrderWhatsApp } from "../shared/utils/whatsapp.js";
import { ORDER_STATUS, PAYMENT_STATUS, POINTS_PER_RUPEE, NOTIFICATION_TYPE, NOTIFICATION_CHANNEL } from "../config/constants.js";
import { paginate } from "../shared/utils/pagination.js";
import {
  generateSpeedPostConsignmentId,
  buildSpeedPostTrackingEvents,
  calculateSpeedPostTariff,
  INDIA_POST_TRACKING_URL,
} from "../services/indiaPostService.js";

// ── Shipping helpers ───────────────────────────────────────────────────────────

async function getShippingCharge(subtotal, pincode, isCOD) {
  const rule = await ShippingRule.findOne({ isActive: true, isDefault: true });
  if (!rule) return { charge: 0, codCharge: 0, isCODAvailable: true };

  if (rule.waiveShipping || (rule.freeShippingAbove && subtotal >= rule.freeShippingAbove)) {
    return { charge: 0, codCharge: isCOD ? rule.codCharge : 0, isCODAvailable: rule.codAvailable };
  }

  if (rule.blockedPincodes?.includes(pincode)) {
    throw new Error("Delivery not available to your pincode");
  }

  return {
    charge: rule.flatCharge,
    codCharge: isCOD ? rule.codCharge : 0,
    isCODAvailable: rule.codAvailable,
  };
}

// ── Place Order ───────────────────────────────────────────────────────────────

export async function placeOrder(req, res, next) {
  const {
    userId,
    customerName,
    deliveryPhone,
    deliveryAddress,
    totalAmount,
    addressId,
    paymentMethod,
    couponCode,
    giftCardCode,
    usePoints,
    notes,
  } = req.body;

  const actualUserId = req.user?.id || userId || ("guest_" + Date.now());

  // If direct checkout from checkout page (with totalAmount or deliveryAddress)
  if (totalAmount !== undefined || (deliveryAddress !== undefined && !addressId)) {
    try {
      const parsedTotal = Number(totalAmount) || 0;
      const consignmentNumber = "";
      const trackingId = null;
      const trackingUrl = "";

      let formattedAddress = {};
      if (typeof deliveryAddress === "string") {
        formattedAddress = {
          name: customerName || "Customer",
          phone: deliveryPhone || "",
          line1: deliveryAddress,
          city: "",
          state: "",
          pincode: "",
          country: "India",
        };
      } else if (deliveryAddress && typeof deliveryAddress === "object") {
        formattedAddress = deliveryAddress;
      }

      const couponCodeVal = (req.body.couponCode || couponCode || "").toString().trim().toUpperCase();
      const couponDiscountVal = Number(req.body.couponDiscount || req.body.discount || 0);
      const shippingChargeVal = Number(req.body.shippingCharge || 0);

      // If couponCode was supplied, record usage
      if (couponCodeVal) {
        try {
          const matchedCoupon = await Coupon.findOne({ code: couponCodeVal });
          if (matchedCoupon) {
            matchedCoupon.usedCount = (matchedCoupon.usedCount || 0) + 1;
            if (actualUserId && !matchedCoupon.usedBy.some((u) => u.toString() === actualUserId.toString())) {
              matchedCoupon.usedBy.push(actualUserId);
            }
            await matchedCoupon.save();
          }
        } catch (couponErr) {
          console.warn("[Order] Failed to update coupon usage:", couponErr.message);
        }
      }

      const generatedOrderId = await generateUniqueOrderId();
      const orderData = {
        orderId: generatedOrderId,
        userId: mongoose.isValidObjectId(actualUserId) ? new mongoose.Types.ObjectId(actualUserId) : actualUserId,
        items: req.body.items || [],
        deliveryAddress: formattedAddress,
        subtotal: Number(req.body.subtotal) || (parsedTotal + couponDiscountVal - shippingChargeVal),
        total: parsedTotal,
        discount: couponDiscountVal,
        couponCode: couponCodeVal,
        couponDiscount: couponDiscountVal,
        shippingCharge: shippingChargeVal,
        paymentMethod: paymentMethod || "razorpay",
        paymentStatus: "pending",
        status: ORDER_STATUS.PENDING,
        carrier: "India Post Speed Post",
        consignmentNumber: "",
        shippingMethod: "Speed Post Domestic (Express Air & Surface)",
        trackingId: null,
        trackingUrl: "",
        trackingEvents: [
          {
            status: "pending",
            description: "Order placed successfully. Waiting for dispatch and tracking assignment.",
            location: "Pollen Atelier Processing Center",
            timestamp: new Date(),
          },
        ],
        notes: notes || "",
      };

      const order = await Order.create(orderData);

      return res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: {
          _id: order._id.toString(),
          id: order._id.toString(),
          orderId: order.orderId || generatedOrderId,
          order_id: order.orderId || generatedOrderId,
          trackingId: order.trackingId || "",
          customerName: customerName || formattedAddress.name || "",
          deliveryPhone: deliveryPhone || formattedAddress.phone || "",
          deliveryAddress: typeof deliveryAddress === "string" ? deliveryAddress : `${formattedAddress.line1 || ""}, ${formattedAddress.city || ""}`,
          status: order.status,
          totalAmount: order.total,
          total: order.total,
          couponCode: order.couponCode || null,
          couponDiscount: order.couponDiscount || 0,
          subtotal: order.subtotal || order.total,
          shippingCharge: order.shippingCharge || 0,
          createdAt: order.createdAt,
        },
      });
    } catch (err) {
      return next(err);
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();

    try {
      // 1. Get cart
      const cart = await Cart.findOne({ userId: req.user?.id || actualUserId }).session(session);
      if (!cart || cart.items.length === 0) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Your cart is empty" });
      }

      // 2. Validate address
      const address = await Address.findOne({ _id: addressId }).session(session);
      if (!address) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Address not found" });
      }

    // 3. Validate and reserve stock
    const orderItems = [];
    let subtotal = 0;

    for (const cartItem of cart.items) {
      const product = await Product.findById(cartItem.productId).session(session);
      if (!product || !product.isPublished) throw new Error(`${cartItem.name} is no longer available`);

      if (cartItem.variantId) {
        const variant = await Variant.findById(cartItem.variantId).session(session);
        if (!variant || variant.availableStock < cartItem.qty) {
          throw new Error(`Insufficient stock for ${cartItem.name}`);
        }
        // Reserve stock
        await Variant.findByIdAndUpdate(
          cartItem.variantId,
          { $inc: { reserved: cartItem.qty } },
          { session }
        );
      }

      const itemTotal = cartItem.unitPrice * cartItem.qty;
      subtotal += itemTotal;

      orderItems.push({
        productId: cartItem.productId,
        variantId: cartItem.variantId || null,
        name: cartItem.name,
        volume: cartItem.volume,
        imageUrl: cartItem.imageUrl,
        qty: cartItem.qty,
        unitPrice: cartItem.unitPrice,
        MRP: cartItem.MRP,
        GSTRate: 18,
        GSTAmount: Math.round((cartItem.unitPrice * cartItem.qty * 18) / 118 * 100) / 100,
        status: "active",
      });
    }

    // 4. Apply coupon
    let couponDiscount = cart.couponDiscount || 0;
    let couponRef = cart.couponCode || "";
    let couponFreeShipping = false;

    if (couponCode && couponCode !== cart.couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
      if (coupon && subtotal >= coupon.minOrderAmount) {
        if (coupon.type === "percentage") {
          couponDiscount = Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity);
        } else if (coupon.type === "flat") {
          couponDiscount = Math.min(coupon.value, subtotal);
        } else if (coupon.type === "free_shipping") {
          couponFreeShipping = true;
          couponDiscount = 0;
        }
        couponRef = coupon.code;
        await Coupon.findByIdAndUpdate(coupon._id, {
          $inc: { usedCount: 1 },
          $push: { usedBy: req.user.id },
        }, { session });
      }
    }

    // 5. Gift card
    let giftCardDiscount = 0;
    let giftCardRef = null;
    if (giftCardCode) {
      const gc = await GiftCard.findOne({ code: giftCardCode.toUpperCase(), isActive: true, expiresAt: { $gt: new Date() } });
      if (gc && gc.balance > 0) {
        giftCardDiscount = Math.min(gc.balance, subtotal - couponDiscount);
        giftCardRef = gc._id;
      }
    }

    // 6. Loyalty points
    let pointsDiscount = 0;
    let pointsUsed = 0;
    if (usePoints) {
      const user = await User.findById(req.user.id).session(session);
      const availablePoints = user.loyaltyPoints || 0;
      const maxDiscount = subtotal * 0.1; // max 10% via points
      const pointsValue = availablePoints * 0.25; // ₹0.25 per point
      pointsDiscount = Math.min(pointsValue, maxDiscount);
      pointsUsed = Math.ceil(pointsDiscount / 0.25);
    }

    // 7. Shipping
    const isCOD = paymentMethod === "cod";
    const shipping = couponFreeShipping
      ? { charge: 0, codCharge: isCOD ? 30 : 0, isCODAvailable: true }
      : await getShippingCharge(subtotal, address.pincode, isCOD).catch(() => ({ charge: 0, codCharge: 0, isCODAvailable: true }));

    if (isCOD && !shipping.isCODAvailable) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "COD not available for your area" });
    }

    // 8. Tax & Total
    const tax = Math.round((subtotal - couponDiscount) * 0.18 / 1.18 * 100) / 100;
    const total = Math.max(
      0,
      subtotal - couponDiscount - giftCardDiscount - pointsDiscount + shipping.charge + shipping.codCharge
    );

    // 9. Points to earn
    const pointsEarned = Math.floor(total * POINTS_PER_RUPEE);

    // 10. Create order
    const generatedOrderId = await generateUniqueOrderId();
    const [order] = await Order.create(
      [
        {
          orderId: generatedOrderId,
          userId: req.user.id,
          items: orderItems,
          deliveryAddress: {
            name: address.name,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            country: address.country,
            label: address.label,
          },
          subtotal,
          discount: couponDiscount + giftCardDiscount + pointsDiscount,
          couponCode: couponRef,
          couponDiscount,
          giftCardDiscount,
          pointsDiscount,
          shippingCharge: shipping.charge,
          codCharge: shipping.codCharge,
          tax,
          total,
          paymentMethod,
          paymentStatus: isCOD ? "pending" : "pending",
          status: isCOD ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING,
          notes,
          pointsEarned,
          pointsUsed,
        },
      ],
      { session }
    );

    // 11. Deduct loyalty points if used
    if (pointsUsed > 0) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { loyaltyPoints: -pointsUsed } }, { session });
      await Loyalty.findOneAndUpdate(
        { userId: req.user.id },
        {
          $inc: { points: -pointsUsed },
          $push: {
            history: {
              type: "redeem",
              points: -pointsUsed,
              balance: 0, // will be recalculated
              description: `Redeemed for order ${order.orderId}`,
              orderId: order._id,
            },
          },
        },
        { session }
      );
    }

    // 12. Deduct gift card balance
    if (giftCardRef && giftCardDiscount > 0) {
      await GiftCard.findByIdAndUpdate(
        giftCardRef,
        { $inc: { balance: -giftCardDiscount }, $push: { usageHistory: { orderId: order._id, amount: giftCardDiscount } } },
        { session }
      );
    }

    // 13. Clear cart
    await Cart.findOneAndUpdate({ userId: req.user.id }, {
      items: [], couponId: null, couponCode: "", couponDiscount: 0,
      giftCardCode: "", giftCardDiscount: 0, pointsUsed: 0, pointsDiscount: 0,
    }, { session });

    await session.commitTransaction();

    // 14. Post-order async tasks (no await — fire and forget)
    const user = await User.findById(req.user.id).lean();
    sendOrderConfirmationEmail({
      to: user.email,
      name: user.name,
      order: {
        orderId: order.orderId,
        trackingId: order.trackingId,
        items: orderItems.map((i) => ({ name: i.name, variant: i.volume, qty: i.qty, price: i.unitPrice })),
        total,
      },
    }).catch(() => null);

    sendOrderWhatsApp({ phone: user.phone, name: user.name, orderId: order.orderId, status: "confirmed" }).catch(() => null);

    Notification.create({
      userId: req.user.id,
      type: NOTIFICATION_TYPE.ORDER_PLACED,
      channel: NOTIFICATION_CHANNEL.EMAIL,
      subject: `Order #${order.orderId} Confirmed`,
      body: `Your order #${order.orderId} has been placed successfully.`,
      status: "sent",
      sentAt: new Date(),
      metadata: { orderId: order._id, orderRef: order.orderId },
    }).catch(() => null);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        orderId: order._id,
        orderRef: order.orderId,
        status: order.status,
        total: order.total,
        paymentMethod,
        razorpayOrderId: order.razorpayOrderId || null,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
}

// ── Get Orders ────────────────────────────────────────────────────────────────

/** GET /api/v1/orders */
export async function getOrders(req, res, next) {
  try {
    const actualUserId = req.query.userId || req.user?.id;
    if (!actualUserId) {
      return res.json({ success: true, data: [] });
    }

    let userQuery = actualUserId;
    if (mongoose.isValidObjectId(actualUserId)) {
      userQuery = { $in: [actualUserId, new mongoose.Types.ObjectId(actualUserId)] };
    }

    const orders = await Order.find({ userId: userQuery }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders.map((o) => {
        const d = new Date(o.createdAt || Date.now());
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yy = String(d.getFullYear()).slice(-2);
        const resolvedOrderId = o.orderId || `PN${dd}${mm}${yy}${o._id.toString().slice(-4).toUpperCase()}`;
        return {
          _id: o._id.toString(),
          id: o._id.toString(),
          orderId: resolvedOrderId,
          order_id: resolvedOrderId,
          trackingId: ["shipped", "out_for_delivery", "delivered"].includes(o.status) ? (o.trackingId || o.consignmentNumber || "") : "",
          customerName: o.deliveryAddress?.name || "",
          deliveryPhone: o.deliveryAddress?.phone || "",
          deliveryAddress: typeof o.deliveryAddress === "string"
            ? o.deliveryAddress
            : [o.deliveryAddress?.line1, o.deliveryAddress?.city, o.deliveryAddress?.state, o.deliveryAddress?.pincode].filter(Boolean).join(", "),
          status: o.status,
          paymentStatus: o.paymentStatus || (o.status === "pending" ? "pending" : "paid"),
          payment_status: o.paymentStatus || (o.status === "pending" ? "pending" : "paid"),
          totalAmount: o.total,
          total: o.total,
          createdAt: o.createdAt,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/orders/:id */
export async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";

    // Customers cannot delete or cancel orders once placed
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Once an order is placed, customers cannot delete it. Please contact customer support.",
      });
    }

    const order = await Order.findOne({
      $or: [
        mongoose.isValidObjectId(id) ? { _id: id } : null,
        { orderId: id },
      ].filter(Boolean),
    });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    await Order.findByIdAndDelete(order._id);
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/v1/orders/:id/status (User repayment or status confirmation) */
export async function updateOrderPaymentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, paymentStatus, paymentId } = req.body;

    const order = await Order.findOne({
      $or: [
        mongoose.isValidObjectId(id) ? { _id: id } : null,
        { orderId: id },
      ].filter(Boolean),
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // When payment succeeds, transition from pending -> confirmed
    if (
      status === "paid" ||
      status === ORDER_STATUS.CONFIRMED ||
      paymentStatus === PAYMENT_STATUS.PAID ||
      paymentStatus === "paid"
    ) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.status = ORDER_STATUS.CONFIRMED;

      if (paymentId) {
        order.razorpayOrderId = paymentId;
      }

      if (!order.trackingEvents?.some((e) => e.status === ORDER_STATUS.CONFIRMED)) {
        order.trackingEvents.push({
          status: ORDER_STATUS.CONFIRMED,
          description: "Payment confirmed. Order confirmed and sent to fulfillment.",
          location: "Pollen Atelier Processing Center",
          timestamp: new Date(),
        });
      }

      await order.save();

      // Send confirmation email asynchronously if user exists
      if (order.userId) {
        User.findById(order.userId)
          .lean()
          .then((u) => {
            if (u) sendOrderConfirmationEmail({ to: u.email, name: u.name, order }).catch(() => null);
          })
          .catch(() => null);
      }

      return res.json({
        success: true,
        message: "Order payment confirmed successfully",
        data: {
          id: order._id.toString(),
          orderId: order.orderId,
          status: order.status,
          paymentStatus: order.paymentStatus,
        },
      });
    }

    // For any other status change, only admin can perform
    const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only payment confirmation can be updated by customer.",
      });
    }

    if (status && Object.values(ORDER_STATUS).includes(status)) {
      order.status = status;
    }
    if (paymentStatus && Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
      order.paymentStatus = paymentStatus;
    }
    await order.save();

    return res.json({
      success: true,
      message: "Order updated successfully",
      data: {
        id: order._id.toString(),
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/orders/:id */
export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const payment = await Payment.findOne({ orderId: order._id }).lean();

    res.json({ success: true, data: { ...order, payment } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/orders/track/:trackingId */
export async function trackOrder(req, res, next) {
  try {
    const rawId = (req.params.trackingId || "").trim();
    const order = await Order.findOne({
      $or: [
        { trackingId: rawId },
        { orderId: rawId },
        { consignmentNumber: rawId },
        ...(mongoose.isValidObjectId(rawId) ? [{ _id: rawId }] : []),
      ],
    }).select("orderId status carrier consignmentNumber shippingMethod trackingId trackingUrl trackingEvents estimatedDelivery deliveryAddress paymentMethod total items createdAt").lean();

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const consignment = order.consignmentNumber || order.trackingId;
    const destPin = order.deliveryAddress?.pincode || order.deliveryAddress?.postal_code || "";
    const destCity = order.deliveryAddress?.city || "";

    // Build or enrich Speed Post events if status is active or delivered
    let dynamicEvents = order.trackingEvents || [];
    if (dynamicEvents.length <= 1 || ["shipped", "delivered"].includes(order.status)) {
      dynamicEvents = buildSpeedPostTrackingEvents({
        consignmentNumber: consignment,
        orderStatus: order.status,
        destinationPincode: destPin,
        destinationCity: destCity,
        bookingDate: order.createdAt,
      });
    }

    const officialUrl = `${INDIA_POST_TRACKING_URL}?consNo=${consignment}`;

    res.json({
      success: true,
      data: {
        ...order,
        carrier: order.carrier || "India Post Speed Post",
        carrierNameHindi: "भारतीय डाक - स्पीड पोस्ट",
        consignmentNumber: consignment,
        shippingMethod: order.shippingMethod || "Speed Post Domestic (Express Air & Surface)",
        trackingUrl: order.trackingUrl || officialUrl,
        officialPortalUrl: INDIA_POST_TRACKING_URL,
        trackingEvents: dynamicEvents,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/orders/:id/cancel */
export async function cancelOrder(req, res, next) {
  try {
    const isAdmin = req.user?.role === "admin" || req.user?.role === "superadmin";

    // Customers cannot cancel orders once placed
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Once an order is placed, customers cannot cancel it. Please contact customer support.",
      });
    }

    const order = await Order.findOne({
      $or: [
        mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : null,
        { orderId: req.params.id },
      ].filter(Boolean),
    });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const cancellableStatuses = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PROCESSING];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled at this stage" });
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.cancelReason = req.body.reason || "Cancelled by admin";
    order.trackingEvents.push({
      status: "cancelled",
      description: req.body.reason || "Cancelled by admin",
      timestamp: new Date(),
    });
    await order.save();

    // Release reserved stock
    for (const item of order.items) {
      if (item.variantId) {
        await Variant.findByIdAndUpdate(item.variantId, { $inc: { reserved: -item.qty } });
      }
    }

    res.json({ success: true, message: "Order cancelled successfully", data: { status: order.status } });
  } catch (err) {
    next(err);
  }
}

// ── Invoice ────────────────────────────────────────────────────────────────────

/** GET /api/v1/orders/:id/invoice */
export async function downloadInvoice(req, res, next) {
  try {
    const order = await Order.findOne({
      $or: [
        mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : null,
        { orderId: req.params.id },
      ].filter(Boolean),
      userId: req.user.id,
    }).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // Invoices are only generated / available after payment is completed
    if (
      order.status === ORDER_STATUS.PENDING ||
      order.status === "pending" ||
      order.paymentStatus === PAYMENT_STATUS.PENDING ||
      order.paymentStatus === "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invoice is only available after payment has been completed.",
      });
    }

    let invoice = await Invoice.findOne({ orderId: order._id }).lean();

    if (!invoice) {
      invoice = await Invoice.create({
        orderId: order._id,
        orderRef: order.orderId,
        userId: req.user.id,
        issueDate: new Date(),
        items: order.items.map((i) => ({
          name: i.name,
          variant: i.volume,
          HSN: i.HSN,
          qty: i.qty,
          unitPrice: i.unitPrice,
          GSTRate: i.GSTRate,
          GSTAmount: i.GSTAmount,
          total: i.unitPrice * i.qty,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        shipping: order.shippingCharge,
        tax: order.tax,
        total: order.total,
        billingAddress: order.deliveryAddress,
      });
      await Order.findByIdAndUpdate(order._id, { invoiceGenerated: true });
    }

    const pdfBuffer = await generateInvoicePDF(invoice, order);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

// ── Admin Order Management ────────────────────────────────────────────────────

/** GET /api/v1/admin/orders */
export async function adminGetOrders(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.userId) filter.userId = req.query.userId;

    const result = await paginate(Order, filter, {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: { createdAt: -1 },
      populate: "userId",
    });

    if (result.data) {
      result.data = result.data.map((o) => {
        const d = new Date(o.createdAt || Date.now());
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const yy = String(d.getFullYear()).slice(-2);
        const resolvedOrderId = o.orderId || `PN${dd}${mm}${yy}${(o._id ? o._id.toString().slice(-4) : "0000").toUpperCase()}`;
        return {
          ...o,
          orderId: resolvedOrderId,
          order_id: resolvedOrderId,
        };
      });
    }

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/admin/orders/:id/status */
export async function updateOrderStatus(req, res, next) {
  try {
    const { status, trackingId, trackingUrl, carrier, consignmentNumber, description, location } = req.body;

    const order = await Order.findOne({
      $or: [
        mongoose.isValidObjectId(req.params.id) ? { _id: req.params.id } : null,
        { orderId: req.params.id },
      ].filter(Boolean),
    });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.status = status;
    const activeConsignment = consignmentNumber || trackingId || order.consignmentNumber || order.trackingId;

    if (carrier) order.carrier = carrier;
    else if (!order.carrier) order.carrier = "India Post Speed Post";

    if (activeConsignment) {
      order.consignmentNumber = activeConsignment;
      order.trackingId = activeConsignment;
    }

    order.trackingUrl =
      trackingUrl || `${INDIA_POST_TRACKING_URL}?consNo=${activeConsignment}`;

    order.trackingEvents.push({
      status,
      description: description || `Speed Post shipment status updated: ${status.toUpperCase()}`,
      location: location || "India Post Sorting Hub",
      timestamp: new Date(),
      updatedBy: req.user?.email || "admin",
    });

    await order.save();

    // Send notifications
    const user = await User.findById(order.userId).lean();
    if (user) {
      if (status === ORDER_STATUS.SHIPPED) {
        sendOrderShippedEmail({ to: user.email, name: user.name, order }).catch(() => null);
      } else if (status === ORDER_STATUS.DELIVERED) {
        sendOrderDeliveredEmail({ to: user.email, name: user.name, order }).catch(() => null);

        // Award loyalty points on delivery
        if (order.pointsEarned > 0) {
          await User.findByIdAndUpdate(order.userId, { $inc: { loyaltyPoints: order.pointsEarned } });
          await Loyalty.findOneAndUpdate(
            { userId: order.userId },
            {
              $inc: { points: order.pointsEarned, lifetimePoints: order.pointsEarned },
              $push: {
                history: {
                  type: "earn",
                  points: order.pointsEarned,
                  balance: 0,
                  description: `Earned from order ${order.orderId}`,
                  orderId: order._id,
                },
              },
            }
          );
        }
      }
    }

    res.json({ success: true, message: "Order status updated", data: { status: order.status } });
  } catch (err) {
    next(err);
  }
}
