import mongoose from "mongoose";
import { NOTIFICATION_CHANNEL, NOTIFICATION_TYPE } from "../config/constants.js";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
    channel: { type: String, enum: Object.values(NOTIFICATION_CHANNEL), required: true },
    subject: { type: String, default: "" },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "read"],
      default: "pending",
    },
    errorMessage: { type: String, default: "" },
    sentAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} }, // orderId, etc.
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
