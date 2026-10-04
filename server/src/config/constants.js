// App-wide constants

export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
};

export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURN_REQUESTED: "return_requested",
  RETURNED: "returned",
  REFUND_INITIATED: "refund_initiated",
  REFUNDED: "refunded",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
};

export const PAYMENT_METHOD = {
  RAZORPAY: "razorpay",
  COD: "cod",
  WALLET: "wallet",
  GIFT_CARD: "gift_card",
};

export const COUPON_TYPE = {
  PERCENTAGE: "percentage",
  FLAT: "flat",
  FREE_SHIPPING: "free_shipping",
  BXGY: "bxgy",
};

export const RETURN_TYPE = {
  REFUND: "refund",
  RETURN: "return",
  REPLACE: "replace",
};

export const RETURN_STATUS = {
  REQUESTED: "requested",
  APPROVED: "approved",
  REJECTED: "rejected",
  PICKED_UP: "picked_up",
  PROCESSED: "processed",
  REFUNDED: "refunded",
};

export const NOTIFICATION_CHANNEL = {
  EMAIL: "email",
  WHATSAPP: "whatsapp",
  SMS: "sms",
  IN_APP: "in_app",
};

export const NOTIFICATION_TYPE = {
  ORDER_PLACED: "order_placed",
  ORDER_CONFIRMED: "order_confirmed",
  ORDER_SHIPPED: "order_shipped",
  ORDER_DELIVERED: "order_delivered",
  ORDER_CANCELLED: "order_cancelled",
  RETURN_REQUESTED: "return_requested",
  REFUND_INITIATED: "refund_initiated",
  OTP: "otp",
  PASSWORD_RESET: "password_reset",
  WELCOME: "welcome",
  PROMOTIONAL: "promotional",
};

export const LOYALTY_TIER = {
  BRONZE: "bronze",   // 0–499 pts
  SILVER: "silver",  // 500–1999 pts
  GOLD: "gold",      // 2000–4999 pts
  PLATINUM: "platinum", // 5000+ pts
};

export const GST_RATE = 0.18; // 18% default
export const POINTS_PER_RUPEE = 1; // 1 point per ₹1 spent
export const RUPEES_PER_POINT = 0.25; // ₹0.25 per point redeemed

export const JWT_ACCESS_EXPIRY = "15m";
export const JWT_REFRESH_EXPIRY = "7d";
export const OTP_EXPIRY_MINUTES = 10;
