import React, { useRef, useState, useEffect } from "react";
import { Check, Edit3, Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { motion } from "motion/react";
import { BackendProduct, updateAdminProduct, uploadImage, ensureAdminToken } from "@/app/api";

interface EditProductModalProps {
  product: BackendProduct | null;
  onClose: () => void;
  onProductUpdated: () => void;
}

export function EditProductModal({ product, onClose, onProductUpdated }: EditProductModalProps) {
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
    inStock: true,
  });

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showManualUrl, setShowManualUrl] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!product) return;

    let top = "";
    let heart = "";
    let base = "";

    if (Array.isArray(product.notes)) {
      const topArr: string[] = [];
      const heartArr: string[] = [];
      const baseArr: string[] = [];
      const generalArr: string[] = [];

      product.notes.forEach((n: any) => {
        if (typeof n === "string") {
          generalArr.push(n);
        } else if (n && typeof n === "object") {
          if (n.type === "top") topArr.push(n.name);
          else if (n.type === "heart") heartArr.push(n.name);
          else if (n.type === "base") baseArr.push(n.name);
          else if (n.name) generalArr.push(n.name);
        }
      });

      if (topArr.length || heartArr.length || baseArr.length) {
        top = topArr.join(", ");
        heart = heartArr.join(", ");
        base = baseArr.join(", ");
      } else {
        top = generalArr.slice(0, 2).join(", ");
        heart = generalArr.slice(2, 4).join(", ");
        base = generalArr.slice(4).join(", ");
      }
    }

    setForm({
      name: product.name || "",
      slug: product.slug || "",
      tagline: product.tagline || "",
      description: product.description || "",
      storyTitle: product.storyTitle || "",
      storyDescription: product.storyDescription || "",
      notesTop: top,
      notesHeart: heart,
      notesBase: base,
      price: Number(product.price) || 399,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : 799,
      volume: product.volume || "50 ML",
      gender: product.gender || "Unisex",
      imageUrl: product.imageUrl || "",
      inStock: product.inStock !== false,
    });
    setUploadError("");
  }, [product]);

  if (!product) return null;

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

      const targetId = product._id || (product as any).productId || product.slug;

      await ensureAdminToken();
      await updateAdminProduct(targetId, {
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        storyTitle: form.storyTitle,
        storyDescription: form.storyDescription,
        notes: notesArray.length > 0 ? notesArray : (product.notes as any),
        price: Number(form.price),
        originalPrice: Number(form.originalPrice),
        volume: form.volume,
        gender: form.gender,
        imageUrl: form.imageUrl,
        inStock: form.inStock,
      });

      onProductUpdated();
      onClose();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update fragrance");
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
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Fragrance & Image</h3>
              <p className="text-xs text-neutral-400">Update details and replace fragrance bottle image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
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
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
              />
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
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
              />
            </div>
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
                Fragrance Bottle Image
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
                    alt="Fragrance"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <Check className="h-3.5 w-3.5" />
                    <span>Bottle Image Attached</span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[11px] text-neutral-400">
                    {form.imageUrl}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-800 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{uploadingImage ? "Uploading..." : "Replace Bottle Image"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, imageUrl: "" }))}
                      className="rounded-lg px-2.5 py-1 text-xs text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
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
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-amber-400 bg-amber-400/10"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/80"
                }`}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                    <span className="text-xs">Uploading bottle image...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800/80 text-amber-400 mb-2">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-semibold text-white">
                      Drop new fragrance bottle image here, or{" "}
                      <span className="text-amber-400 underline underline-offset-2">browse</span>
                    </p>
                    <p className="mt-1 text-[11px] text-neutral-400">
                      Supports PNG, JPG, WEBP up to 10MB
                    </p>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <p className="text-[11px] text-rose-400 font-medium">{uploadError}</p>
            )}
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.inStock}
                onChange={(e) => setForm({ ...form, inStock: e.target.checked })}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-xs text-neutral-300">In Stock</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-300 disabled:opacity-50 shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
