import React, { useRef, useState } from "react";
import { Check, Image as ImageIcon, Loader2, Package, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { createAdminProduct, uploadImage } from "@/app/api";

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  onProductCreated: () => void;
}

export function AddProductModal({ open, onClose, onProductCreated }: AddProductModalProps) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    tagline: "",
    description: "",
    storyTitle: "",
    storyDescription: "",
    notesTop: "",
    notesHeart: "",
    notesBase: "",
    price: 399,
    originalPrice: 799,
    volume: "50 ML",
    gender: "Unisex",
    imageUrl: "",
    isPublished: true,
    inStock: true,
  });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image file size exceeds 10MB limit.");
      return;
    }

    setUploadError("");
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const notesArray: any[] = [];
      if (form.notesTop) {
        form.notesTop.split(",").forEach((n) => notesArray.push({ type: "top", name: n.trim() }));
      }
      if (form.notesHeart) {
        form.notesHeart.split(",").forEach((n) => notesArray.push({ type: "heart", name: n.trim() }));
      }
      if (form.notesBase) {
        form.notesBase.split(",").forEach((n) => notesArray.push({ type: "base", name: n.trim() }));
      }

      const slug =
        form.slug.trim() ||
        form.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      await createAdminProduct({
        name: form.name,
        slug,
        tagline: form.tagline,
        description: form.description,
        storyTitle: form.storyTitle || `${form.name} Story`,
        storyDescription: form.storyDescription,
        notes: notesArray.length > 0 ? notesArray : ["Bergamot", "Jasmine", "Amber"],
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
        volume: form.volume,
        gender: form.gender,
        imageUrl: form.imageUrl || "/Images/2e.jpg",
        isPublished: form.isPublished,
        inStock: form.inStock,
      });

      onProductCreated();
      onClose();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to create fragrance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl my-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Fragrance</h3>
              <p className="text-xs text-neutral-400">Add an artisanal scent to the database</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Fragrance Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Velvet Cedar"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Custom URL Slug (Optional)
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="e.g. velvet-cedar"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Tagline *
            </label>
            <input
              type="text"
              required
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              placeholder="e.g. Warm amber and smoked birch"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Sensual olfactory narrative..."
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Top Notes
              </label>
              <input
                type="text"
                value={form.notesTop}
                onChange={(e) => setForm({ ...form, notesTop: e.target.value })}
                placeholder="Bergamot, Pepper"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Heart Notes
              </label>
              <input
                type="text"
                value={form.notesHeart}
                onChange={(e) => setForm({ ...form, notesHeart: e.target.value })}
                placeholder="Orris, Turkish Rose"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Base Notes
              </label>
              <input
                type="text"
                value={form.notesBase}
                onChange={(e) => setForm({ ...form, notesBase: e.target.value })}
                placeholder="Dark Musk, Cedarwood"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white font-mono outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                MRP / Cut Price (₹)
              </label>
              <input
                type="number"
                min={1}
                value={form.originalPrice}
                onChange={(e) => setForm({ ...form, originalPrice: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white font-mono outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Volume
              </label>
              <input
                type="text"
                value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Gender
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
              >
                <option value="Unisex">Unisex</option>
                <option value="For Him">For Him</option>
                <option value="For Her">For Her</option>
              </select>
            </div>
          </div>

          {/* Fragrance Bottle Image Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Fragrance Bottle Image *
              </label>
              <button
                type="button"
                onClick={() => setShowManualUrl(!showManualUrl)}
                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
              >
                {showManualUrl ? "Upload File Instead" : "Enter URL / Path Manually"}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/png,image/jpeg,image/webp,image/jpg,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {showManualUrl ? (
              <input
                type="text"
                placeholder="/Images/2e.jpg or https://..."
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono"
              />
            ) : form.imageUrl ? (
              <div className="relative flex items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/80 p-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950 flex items-center justify-center">
                  <img
                    src={form.imageUrl}
                    alt="Uploaded Fragrance"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Image Ready</span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-neutral-400">
                    {form.imageUrl}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-200 hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      Change Photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, imageUrl: "" })}
                      className="rounded-lg border border-rose-900/50 bg-rose-950/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-900/50 transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                  isDragging
                    ? "border-amber-400 bg-amber-400/10 scale-[1.01]"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/70"
                }`}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 text-amber-400 py-3">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-xs font-bold tracking-wider uppercase">
                      Uploading Fragrance Image...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800/80 text-amber-400 mb-2 border border-neutral-700/60">
                      <Upload className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-bold text-white tracking-wide">
                      Click to upload bottle image or drag and drop
                    </p>
                    <p className="mt-1 text-[10px] text-neutral-400">
                      PNG, JPG, WEBP, or SVG · Recommended transparent flacon photo (Max 10MB)
                    </p>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-rose-400 font-medium">{uploadError}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-amber-400 px-6 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {loading ? "Publishing..." : "Publish Fragrance"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
