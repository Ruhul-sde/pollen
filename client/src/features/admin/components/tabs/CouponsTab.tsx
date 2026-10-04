import React from "react";
import { Edit3, Globe, Lock, Plus, Trash2 } from "lucide-react";
import { formatDate } from "../../../../shared/utils/formatters";

interface CouponsTabProps {
  coupons: any[];
  onAddCoupon: () => void;
  onEditCoupon: (coupon: any) => void;
  onDeleteCoupon: (couponId: string) => void;
}

export function CouponsTab({ coupons, onAddCoupon, onEditCoupon, onDeleteCoupon }: CouponsTabProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Active Coupons & Discounts</h2>
          <p className="text-xs text-neutral-400">
            Manage promotional codes, edit discounts, and control public vs. private visibility
          </p>
        </div>

        <button
          onClick={onAddCoupon}
          className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-300 shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Coupon</span>
        </button>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800/80 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Visibility</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Min Order</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Expires</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-neutral-400">
                    No discount coupons found. Create your first promotional coupon!
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const cId = c._id || c.id;
                  const isPrivate = Boolean(c.isPrivate || c.visibility === "private");
                  const isActive = c.isActive !== false;

                  return (
                    <tr key={cId} className="hover:bg-neutral-800/30 transition-colors">
                      {/* Code */}
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-amber-400 text-sm tracking-wider">
                          {c.code}
                        </span>
                        {c.description && (
                          <p className="text-[11px] text-neutral-400 mt-0.5 max-w-xs truncate">{c.description}</p>
                        )}
                      </td>

                      {/* Visibility: Open to All vs Private */}
                      <td className="px-6 py-4">
                        {isPrivate ? (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 px-2.5 py-1 text-[10px] font-bold text-purple-300"
                            title="Hidden from checkout offers drawer. Only customers with the code can use it."
                          >
                            <Lock className="h-3 w-3 text-purple-400" />
                            <span>Private (Hidden)</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-bold text-emerald-300"
                            title="Visible to all customers in the checkout 'Offers Available' drawer."
                          >
                            <Globe className="h-3 w-3 text-emerald-400" />
                            <span>Open to All</span>
                          </span>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="px-6 py-4 font-mono font-semibold text-white">
                        {c.discountType === "percentage" || c.type === "percentage" ? (
                          <div>
                            <span>{c.discountValue !== undefined ? c.discountValue : c.value}% OFF</span>
                            {c.maxDiscount && (
                              <span className="text-[10px] text-neutral-400 block font-normal">
                                Cap: ₹{c.maxDiscount}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>₹{c.discountValue !== undefined ? c.discountValue : c.value} OFF</span>
                        )}
                      </td>

                      {/* Min Order */}
                      <td className="px-6 py-4 font-mono text-neutral-300">
                        ₹{c.minOrderAmount || 0}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                            isActive ? "text-emerald-400" : "text-neutral-500"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-neutral-500"}`}
                          />
                          {isActive ? "Active" : "Paused"}
                        </span>
                      </td>

                      {/* Expiry */}
                      <td className="px-6 py-4 font-mono text-neutral-400">
                        {formatDate(c.expiresAt)}
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditCoupon(c)}
                            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-amber-400 hover:bg-neutral-700 transition-colors cursor-pointer"
                            title="Edit Coupon (Code, Discount, Visibility, Expiry)"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteCoupon(cId)}
                            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
