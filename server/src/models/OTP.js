import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email: { type: String, required: true, lowercase: true },
  code: { type: String, required: true },
  type: {
    type: String,
    enum: ["email_verify", "password_reset", "phone_verify", "login_verify"],
    required: true,
  },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
});

otpSchema.index({ email: 1, type: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;
