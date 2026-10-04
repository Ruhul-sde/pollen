import mongoose from "mongoose";
import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import { PAYMENT_STATUS } from "../config/constants.js";

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/** POST /api/v1/payments/create-order */
export async function createPaymentOrder(req, res, next) {
  try {
    const { orderId, amount, receipt } = req.body;

    let order = null;
    if (orderId) {
      order = await Order.findOne({
        $or: [
          mongoose.isValidObjectId(orderId) ? { _id: orderId } : null,
          { orderId: orderId },
        ].filter(Boolean),
      });
    }

    if (order && order.paymentStatus === PAYMENT_STATUS.PAID) {
      return res.status(400).json({ success: false, message: "Order already paid" });
    }

    const razorpay = getRazorpay();
    const finalAmount = order ? Math.round(order.total * 100) : Math.round((Number(amount) || 0) * 100);
    const receiptId = receipt || order?.orderId || order?.trackingId || `PLN_${Date.now()}`;

    const rzpOrder = await razorpay.orders.create({
      amount: finalAmount, // paise
      currency: "INR",
      receipt: receiptId.slice(0, 40),
      notes: { orderId: order?._id?.toString() || orderId || "", orderRef: order?.orderId || receiptId },
    });

    // Save razorpay order ID on our order if found
    if (order) {
      order.razorpayOrderId = rzpOrder.id;
      await order.save();

      // Create pending payment record
      await Payment.findOneAndUpdate(
        { orderId: order._id },
        {
          orderId: order._id,
          orderRef: order.orderId,
          razorpayOrderId: rzpOrder.id,
          amount: order.total,
          status: PAYMENT_STATUS.PENDING,
          provider: "razorpay",
          idempotencyKey: rzpOrder.id,
        },
        { upsert: true, new: true }
      );
    }

    res.json({
      success: true,
      data: {
        id: rzpOrder.id,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        key: process.env.RAZORPAY_KEY_ID,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderRef: order?.orderId || receiptId,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/payments/verify */
export async function verifyPayment(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // HMAC-SHA256 verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: PAYMENT_STATUS.FAILED, failureReason: "Signature mismatch" }
      );
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // Idempotency: check if already captured
    const existingPayment = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingPayment?.status === PAYMENT_STATUS.PAID) {
      const order = await Order.findById(existingPayment.orderId).lean();
      return res.json({ success: true, message: "Payment already captured", data: { orderId: order?.orderId } });
    }

    // Update payment record
    let payment = null;
    if (razorpay_order_id) {
      payment = await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: PAYMENT_STATUS.PAID,
          capturedAt: new Date(),
        },
        { new: true }
      );
    }

    // Update order to confirmed status
    const targetOrderId = payment?.orderId || orderId;
    let order = null;
    if (targetOrderId) {
      order = await Order.findOne({
        $or: [
          mongoose.isValidObjectId(targetOrderId) ? { _id: targetOrderId } : null,
          { orderId: targetOrderId },
        ].filter(Boolean),
      });
    }

    if (order) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
      order.status = "confirmed";
      if (razorpay_payment_id) {
        order.razorpayOrderId = razorpay_payment_id;
      }
      if (!order.trackingEvents?.some((e) => e.status === "confirmed")) {
        order.trackingEvents.push({
          status: "confirmed",
          description: "Payment confirmed. Order confirmed and sent to fulfillment.",
          location: "Pollen Atelier Processing Center",
          timestamp: new Date(),
        });
      }
      await order.save();
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId: order?.orderId || targetOrderId,
        paymentId: razorpay_payment_id,
        status: order?.status || "confirmed",
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/payments/webhook */
export async function handleWebhook(req, res, next) {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret) {
      const digest = crypto
        .createHmac("sha256", webhookSecret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (digest !== signature) {
        return res.status(400).json({ success: false, message: "Invalid webhook signature" });
      }
    }

    const { event, payload } = req.body;

    if (event === "payment.captured") {
      const paymentId = payload.payment.entity.id;
      const rzpOrderId = payload.payment.entity.order_id;

      await Payment.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId },
        { razorpayPaymentId: paymentId, status: PAYMENT_STATUS.PAID, capturedAt: new Date(), webhookPayload: payload }
      );

      const payment = await Payment.findOne({ razorpayOrderId: rzpOrderId });
      if (payment) {
        await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: PAYMENT_STATUS.PAID, status: "confirmed" });
      }
    } else if (event === "payment.failed") {
      const rzpOrderId = payload.payment.entity.order_id;
      await Payment.findOneAndUpdate(
        { razorpayOrderId: rzpOrderId },
        { status: PAYMENT_STATUS.FAILED, failureReason: payload.payment.entity.error_description, webhookPayload: payload }
      );
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/payments/:orderId */
export async function getPaymentStatus(req, res, next) {
  try {
    const order = await Order.findById(req.params.orderId).lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const payment = await Payment.findOne({ orderId: order._id }).lean();

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        paymentStatus: order.paymentStatus,
        payment: payment
          ? {
              id: payment._id,
              razorpayOrderId: payment.razorpayOrderId,
              razorpayPaymentId: payment.razorpayPaymentId,
              amount: payment.amount,
              status: payment.status,
              method: payment.method,
              capturedAt: payment.capturedAt,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/admin/payments/:id/refund */
export async function initiateRefund(req, res, next) {
  try {
    const { amount, reason } = req.body;
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (payment.status !== PAYMENT_STATUS.PAID) {
      return res.status(400).json({ success: false, message: "Payment not eligible for refund" });
    }

    const razorpay = getRazorpay();
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, {
      amount: Math.round(amount * 100),
      notes: { reason },
    });

    payment.refunds.push({
      refundId: refund.id,
      amount,
      reason,
      status: "initiated",
      initiatedAt: new Date(),
    });
    payment.status = PAYMENT_STATUS.REFUNDED;
    await payment.save();

    await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: PAYMENT_STATUS.REFUNDED });

    res.json({ success: true, message: "Refund initiated", data: { refundId: refund.id, amount } });
  } catch (err) {
    next(err);
  }
}
