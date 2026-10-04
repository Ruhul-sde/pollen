import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminEmail: { type: String },
    action: { type: String, required: true }, // CREATE, UPDATE, DELETE, LOGIN, etc.
    entity: { type: String, required: true }, // Product, Order, User, Coupon, etc.
    entityId: { type: String, default: "" },
    before: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
    after: { type: mongoose.Schema.Types.Mixed, default: null, select: false },
    description: { type: String, default: "" },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
