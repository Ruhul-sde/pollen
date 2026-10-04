import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    group: {
      type: String,
      default: "general",
    },
    label: { type: String, default: "" },
    description: { type: String, default: "" },
    isPublic: { type: Boolean, default: false }, // whether frontend can access
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

settingsSchema.index({ key: 1 });
settingsSchema.index({ group: 1 });

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
