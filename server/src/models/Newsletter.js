import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    isSubscribed: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
    source: { type: String, default: "website" }, // website, checkout, popup
    tags: [{ type: String }], // segment tags
    unsubscribeToken: { type: String, default: "" },
  },
  { timestamps: true }
);

newsletterSchema.index({ email: 1 });
newsletterSchema.index({ isSubscribed: 1 });

const Newsletter = mongoose.model("Newsletter", newsletterSchema);
export default Newsletter;
