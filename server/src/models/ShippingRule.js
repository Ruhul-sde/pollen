import mongoose from "mongoose";

const shippingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    // Conditions
    minOrderAmount: { type: Number, default: 0 },
    maxOrderAmount: { type: Number, default: null }, // null = no upper limit
    freeShippingAbove: { type: Number, default: null }, // free if order >= this amount

    // Charges
    shippingType: { type: String, enum: ["tiered", "flat"], default: "tiered" },
    flatCharge: { type: Number, default: 65 },
    standardCharge: { type: Number, default: 65 },
    localCharge: { type: Number, default: 35 },
    circleCharge: { type: Number, default: 47 },
    nationalCharge: { type: Number, default: 65 },
    specialCharge: { type: Number, default: 85 },
    perKgCharge: { type: Number, default: 0 },
    codCharge: { type: Number, default: 30 }, // extra for COD
    codAvailable: { type: Boolean, default: true },
    codMinOrder: { type: Number, default: 0 },
    codMaxOrder: { type: Number, default: null },

    // Automatic Delivery Fee Waiver (Show standard charge but waive off completely)
    waiveShipping: { type: Boolean, default: false },
    waiveLabel: { type: String, default: "100% Delivery Fee Waived" },

    // Estimated delivery
    minDays: { type: Number, default: 3 },
    maxDays: { type: Number, default: 7 },

    // Pincode restrictions
    serviceablePincodes: [{ type: String }], // empty = all pincodes
    blockedPincodes: [{ type: String }],

    isActive: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ShippingRule = mongoose.model("ShippingRule", shippingRuleSchema);
export default ShippingRule;
