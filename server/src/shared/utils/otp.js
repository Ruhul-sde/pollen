import crypto from "crypto";
import { OTP_EXPIRY_MINUTES } from "../../config/constants.js";

export function generateOTP(length = 6) {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  return otp;
}

export function getOTPExpiry(minutes = OTP_EXPIRY_MINUTES) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function isOTPExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}
