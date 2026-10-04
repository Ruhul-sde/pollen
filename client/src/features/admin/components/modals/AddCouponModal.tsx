import React, { useState } from "react";
import { Gift, Globe, Lock, X } from "lucide-react";
import { motion } from "motion/react";
import { createAdminCoupon } from "@/app/api";

interface AddCouponModalProps {
  open: boolean;
  onClose: () => void;
  onCouponCreated: () => void;
}

export function AddCouponModal({ open, onClose, onCouponCreated }: AddCouponModalProps) {
  const [form, setForm] = useState({
    code: "",
    type: "percentage",
    value: 15,
    minOrderAmount: 0,
    maxDiscount: "",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    description: "Exclusive fragrance discount",
    isPrivate: false,
  });
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const couponType = form.type === "fixed" ? "flat" : form.type;
      const numVal = Number(form.value);
      await createAdminCoupon({
        code: form.code.trim().toUpperCase(),
        type: couponType,
        value: numVal,
        discountType: couponType,
        discountValue: numVal,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: couponType === "percentage" && form.maxDiscount !== "" ? Number(form.maxDiscount) : null,
        expiresAt: form.expiresAt,
        description: form.description,
        isPrivate: form.isPrivate,
        visibility: form.isPrivate ? "private" : "public",
        isActive: true,
      });
      onCouponCreated();
      onClose();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setLoading(false);
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
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create Promo Coupon</h3>
              <p className="text-xs text-neutral-400">Configure promotional discount codes</p>
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
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Coupon Code *
            </label>
            <input
              type="text"
              required
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="e.g. LUXURY20"
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 font-mono font-bold text-amber-400 outline-none focus:border-amber-400 tracking-wider"
            />
          </div>

          {/* Visibility Option: Open to All vs Private */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Visibility & Discoverability *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, isPrivate: false })}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  !form.isPrivate
                    ? "border-emerald-500/60 bg-emerald-950/30 text-white ring-1 ring-emerald-500/40"
                    : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                    !form.isPrivate ? "bg-emerald-500 text-black" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">Open to All</span>
                    <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded">
                      PUBLIC
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-neutral-400 leading-relaxed">
                    Visible to all visitors in the checkout offers drawer.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setForm({ ...form, isPrivate: true })}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  form.isPrivate
                    ? "border-purple-500/60 bg-purple-950/30 text-white ring-1 ring-purple-500/40"
                    : "border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                    form.isPrivate ? "bg-purple-500 text-white" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">Private / Secret</span>
                    <span className="text-[9px] font-bold bg-purple-500/20 text-purple-400 px-1.5 py-0.2 rounded">
                      HIDDEN
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-neutral-400 leading-relaxed">
                    Hidden from checkout list. Only users with the code can use it.
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Discount Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-white outline-none focus:border-amber-400"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Fixed / Flat Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Value {form.type === "percentage" ? "(%)" : "(₹)"} *
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 font-mono text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Min Order Amount (₹)
              </label>
              <input
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 font-mono text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                Max Discount Cap (₹) {form.type !== "percentage" && "(N/A)"}
              </label>
              <input
                type="number"
                disabled={form.type !== "percentage"}
                placeholder={form.type === "percentage" ? "e.g. 500 (optional)" : "Flat discount"}
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 font-mono text-white outline-none focus:border-amber-400 disabled:opacity-40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Expiry Date *
            </label>
            <input
              type="date"
              required
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Description / Terms
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-white outline-none focus:border-amber-400"
            />
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
              {loading ? "Creating..." : "Save Coupon"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
