import Return from "../models/Return.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import { RETURN_STATUS, NOTIFICATION_TYPE, NOTIFICATION_CHANNEL, ORDER_STATUS } from "../config/constants.js";
import { paginate } from "../shared/utils/pagination.js";

/** POST /api/v1/orders/:id/return */
export async function requestReturn(req, res, next) {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (order.status !== ORDER_STATUS.DELIVERED) {
      return res.status(400).json({ success: false, message: "Only delivered orders can be returned" });
    }

    // Check return window (7 days)
    const deliveredEvent = order.trackingEvents.findLast((e) => e.status === "delivered");
    const deliveredAt = deliveredEvent?.timestamp || order.updatedAt;
    const daysSinceDelivery = (Date.now() - new Date(deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return res.status(400).json({ success: false, message: "Return window (7 days) has expired" });
    }

    const existing = await Return.findOne({ orderId: order._id, status: { $nin: ["rejected"] } });
    if (existing) return res.status(400).json({ success: false, message: "Return already requested for this order" });

    const { items, type, reason, images } = req.body;

    // Validate items belong to order
    const validItems = items.map((ri) => {
      const orderItem = order.items.id(ri.orderItemId);
      if (!orderItem) throw new Error(`Item ${ri.orderItemId} not found in order`);
      return {
        orderItemId: ri.orderItemId,
        productId: orderItem.productId,
        name: orderItem.name,
        qty: ri.qty,
        unitPrice: orderItem.unitPrice,
        reason: ri.reason || reason,
      };
    });

    const returnRequest = await Return.create({
      orderId: order._id,
      userId: req.user.id,
      items: validItems,
      type,
      reason,
      images: images || [],
    });

    order.status = ORDER_STATUS.RETURN_REQUESTED;
    await order.save();

    Notification.create({
      userId: req.user.id,
      type: NOTIFICATION_TYPE.RETURN_REQUESTED,
      channel: NOTIFICATION_CHANNEL.EMAIL,
      subject: `Return Request #${returnRequest.returnId}`,
      body: `Your return request for order ${order.orderId} has been submitted.`,
      status: "sent",
      sentAt: new Date(),
      metadata: { returnId: returnRequest._id, orderRef: order.orderId },
    }).catch(() => null);

    res.status(201).json({
      success: true,
      message: "Return request submitted",
      data: { returnId: returnRequest.returnId, status: returnRequest.status },
    });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/returns — user's returns */
export async function getMyReturns(req, res, next) {
  try {
    const returns = await Return.find({ userId: req.user.id })
      .populate("orderId", "orderId total")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: returns });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/admin/returns */
export async function adminGetReturns(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    const result = await paginate(Return, filter, {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      sort: { createdAt: -1 },
      populate: "orderId userId",
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/admin/returns/:id */
export async function processReturn(req, res, next) {
  try {
    const { status, adminNotes, rejectionReason, refundAmount, refundMethod } = req.body;

    const returnReq = await Return.findById(req.params.id).populate("orderId");
    if (!returnReq) return res.status(404).json({ success: false, message: "Return not found" });

    returnReq.status = status;
    if (adminNotes) returnReq.adminNotes = adminNotes;
    if (rejectionReason) returnReq.rejectionReason = rejectionReason;
    if (refundAmount) {
      returnReq.refundAmount = refundAmount;
      returnReq.refundMethod = refundMethod || "original";
    }
    if (status === RETURN_STATUS.PROCESSED) returnReq.processedAt = new Date();
    if (status === RETURN_STATUS.REFUNDED) {
      returnReq.refundedAt = new Date();
      await Order.findByIdAndUpdate(returnReq.orderId, {
        status: ORDER_STATUS.REFUNDED,
        paymentStatus: "refunded",
      });
    }

    await returnReq.save();

    res.json({ success: true, message: "Return processed", data: { status: returnReq.status } });
  } catch (err) {
    next(err);
  }
}
