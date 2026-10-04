import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["top", "heart", "base"], default: "top" },
    name: { type: String, required: true, trim: true },
    icon: { type: String, default: "" },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    // Identification
    productId: { type: Number, index: true }, // legacy numeric ID
    slug: { type: String, trim: true, lowercase: true, unique: true },
    name: { type: String, required: [true, "Product name is required"], trim: true },

    // Taxonomy
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null },
    tags: [{ type: String, trim: true, lowercase: true }],

    // Content
    tagline: { type: String, default: "" },
    description: { type: String, required: [true, "Product description is required"] },
    storyTitle: { type: String, default: "" },
    storyDescription: { type: String, default: "" },

    // Fragrance profile
    fragranceFamily: { type: String, default: "" }, // Floral, Woody, Oriental, Fresh
    concentration: { type: String, default: "Parfum" }, // EDP, EDT, Parfum
    gender: { type: String, enum: ["Unisex", "Male", "Female"], default: "Unisex" },
    longevity: { type: String, default: "" },
    notes: {
      type: [noteSchema],
      set: function (val) {
        if (!Array.isArray(val)) return val;
        const types = ["top", "heart", "base"];
        return val.map((n, idx) => {
          if (typeof n === "string") {
            return { type: types[idx % 3] || "top", name: n.trim(), icon: "" };
          }
          return n;
        });
      },
    },
    ingredients: { type: String, default: "" },
    country: { type: String, default: "" }, // Country of origin

    // Legacy pricing (kept for backward compat, variants are preferred)
    price: { type: Number, min: 0, default: 0 },
    originalPrice: { type: Number, default: null },
    volume: { type: String, default: "50 ML" },

    // Media
    imageUrl: { type: String, default: "" },
    gallery: [{ type: String }],
    video: { type: String, default: "" },

    // Product details (bullet points)
    details: [{ type: String }],

    // Tax & compliance
    HSN: { type: String, default: "" },
    GSTRate: { type: Number, default: 18 },

    // Flags
    isBundle: { type: Boolean, default: false },
    inStock: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },

    // SEO
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },

    // Aggregated stats (updated via review/order hooks)
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    soldCount: { type: Number, default: 0 },
    wishlistCount: { type: Number, default: 0 },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

// Normalize notes if passed as strings (e.g. from JSON seeds or simple inputs)
productSchema.pre("validate", function (next) {
  if (Array.isArray(this.notes)) {
    const types = ["top", "heart", "base"];
    this.notes = this.notes.map((n, idx) => {
      if (typeof n === "string") {
        return { type: types[idx % 3] || "top", name: n.trim(), icon: "" };
      }
      return n;
    });
  }
  next();
});

// Text search index
productSchema.index({ name: "text", tagline: "text", description: "text", tags: "text" });
productSchema.index({ isPublished: 1, category: 1 });
productSchema.index({ isPublished: 1, brand: 1 });

export const Product = mongoose.model("Product", productSchema);
export default Product;
