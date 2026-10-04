import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.Mixed, required: true },
    label: { type: String, default: "Home", maxlength: 30 }, // Home, Work, Other
    name: { type: String, trim: true },
    fullName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, trim: true },
    addressLine1: { type: String, trim: true },
    line2: { type: String, trim: true, default: "" },
    postOffice: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, default: "India", trim: true },
    isDefault: { type: Boolean, default: false },
    landmark: { type: String, trim: true, default: "" },
    addressType: { type: String, enum: ["home", "work", "other"], default: "home" },
  },
  { timestamps: true }
);

addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, isDefault: 1 });

export const Address = mongoose.model("Address", addressSchema);
export default Address;
