import React, { useState, useEffect } from "react";
import { Tag, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BackendProduct, updateAdminProduct, ensureAdminToken } from "@/app/api";

interface EditPriceModalProps {
  product: BackendProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditPriceModal({ product, onClose, onSaved }: EditPriceModalProps) {
  const [pricingForm, setPricingForm] = useState({
    price: 399,
    originalPrice: 799,
    discountPercent: 50,
  });
  const [savingPrice, setSavingPrice] = useState(false);

  useEffect(() => {
    if (!product) return;
    const pr = Number(product.price || 399);
    const orig = Number(product.originalPrice || pr);
    const disc = orig > pr && orig > 0 ? Math.round(((orig - pr) / orig) * 100) : 0;
    setPricingForm({
      price: pr,
      originalPrice: orig,
      discountPercent: disc,
    });
  }, [product]);

  if (!product) return null;

  const handleMRPChange = (newMRP: number) => {
    const validMRP = Math.max(0, newMRP);
    let newPrice = pricingForm.price;
    if (pricingForm.discountPercent > 0) {
      newPrice = Math.max(0, Math.round(validMRP * (1 - pricingForm.discountPercent / 100)));
    }
    setPricingForm((prev) => ({
      ...prev,
      originalPrice: validMRP,
      price: newPrice,
    }));
  };

  const handlePriceChange = (newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    const orig = pricingForm.originalPrice;
    let disc = 0;
    if (orig > validPrice && orig > 0) {
      disc = Math.round(((orig - validPrice) / orig) * 100);
    }
    setPricingForm((prev) => ({
      ...prev,
      price: validPrice,
      discountPercent: disc,
    }));
  };

  const handleDiscountChange = (newDisc: number) => {
    const validDisc = Math.min(99, Math.max(0, newDisc));
    const orig = pricingForm.originalPrice;
    const newPrice = orig > 0 ? Math.max(0, Math.round(orig * (1 - validDisc / 100))) : 0;
    setPricingForm((prev) => ({
      ...prev,
      discountPercent: validDisc,
      price: newPrice,
    }));
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPrice(true);
      await ensureAdminToken();
      const targetId = product._id || (product as any).productId || product.slug;

      await updateAdminProduct(targetId, {
        price: Number(pricingForm.price),
        originalPrice: Number(pricingForm.originalPrice),
      });

      onSaved();
      onClose();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update pricing");
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Edit Price & Discount</h3>
              <p className="text-xs text-neutral-400">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSavePrice} className="space-y-4 pt-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              MRP / Original Price (₹) - Strikethrough Cut Price
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={pricingForm.originalPrice}
              onChange={(e) => handleMRPChange(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-sm text-white font-mono outline-none focus:border-amber-400"
            />
            <p className="mt-1 text-[11px] text-neutral-400">
              Shown as crossed out (e.g. <span className="line-through text-neutral-400">₹{pricingForm.originalPrice}</span>)
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Discount Percentage (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                max="99"
                step="1"
                value={pricingForm.discountPercent}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                className="w-24 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-sm text-white font-mono outline-none focus:border-amber-400"
              />
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={pricingForm.discountPercent}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                className="flex-1 accent-amber-400 cursor-pointer"
              />
              <span className="text-xs font-bold text-amber-400 w-10 text-right font-mono">
                {pricingForm.discountPercent}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Final Selling Price (₹)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={pricingForm.price}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2.5 text-sm font-bold text-amber-300 font-mono outline-none focus:border-amber-400"
            />
            <p className="mt-1 text-[11px] text-neutral-400">
              The final discounted price customers will pay at checkout.
            </p>
          </div>

          {/* Customer View Preview */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-3.5 flex items-center justify-between">
            <span className="text-xs text-neutral-400 font-medium">Customer View:</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-base font-bold text-white">₹{pricingForm.price}</span>
              {pricingForm.originalPrice > pricingForm.price && (
                <>
                  <span className="text-xs text-neutral-400 line-through">
                    ₹{pricingForm.originalPrice}
                  </span>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 font-sans">
                    {Math.round(((pricingForm.originalPrice - pricingForm.price) / pricingForm.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingPrice}
              className="rounded-xl bg-amber-400 px-6 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-300 disabled:opacity-50 transition-colors"
            >
              {savingPrice ? "Saving..." : "Save Pricing"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
