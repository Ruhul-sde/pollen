import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    volume: { type: String, required: true, trim: true }, // e.g. "50 ML", "100 ML"
    volumeValue: { type: Number }, // numeric ml for sorting
    SKU: { type: String, unique: true, sparse: true, trim: true },
    MRP: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, default: null }, // optional promotional price
    stock: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 }, // stock held for pending orders
    weight: { type: Number, default: 100 }, // grams, for shipping calculation
    isActive: { type: Boolean, default: true },
    images: [{ type: String }], // variant-specific images
    barcode: { type: String, default: "" },
    HSN: { type: String, default: "" },
    GSTRate: { type: Number, default: 18 }, // GST percentage
  },
  { timestamps: true }
);

variantSchema.index({ productId: 1 });

variantSchema.virtual("effectivePrice").get(function () {
  return this.discountPrice ?? this.sellingPrice;
});

variantSchema.virtual("availableStock").get(function () {
  return Math.max(0, this.stock - this.reserved);
});

variantSchema.virtual("discountPercent").get(function () {
  if (!this.MRP || this.MRP === 0) return 0;
  return Math.round(((this.MRP - this.effectivePrice) / this.MRP) * 100);
});

const Variant = mongoose.model("Variant", variantSchema);
export default Variant;
