import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "" },
    image: { type: String, required: true },
    mobileImage: { type: String, default: "" },
    link: { type: String, default: "" },
    position: {
      type: String,
      enum: ["hero", "mid", "footer", "popup", "sidebar"],
      default: "hero",
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    ctaText: { type: String, default: "" },
    backgroundColor: { type: String, default: "" },
  },
  { timestamps: true }
);

bannerSchema.index({ position: 1, isActive: 1, sortOrder: 1 });

const Banner = mongoose.model("Banner", bannerSchema);
export default Banner;
