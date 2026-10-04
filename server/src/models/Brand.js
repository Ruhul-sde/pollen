import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String, default: null },
    description: { type: String, trim: true, default: "" },
    website: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    country: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

brandSchema.index({ slug: 1 });

const Brand = mongoose.model("Brand", brandSchema);
export default Brand;
