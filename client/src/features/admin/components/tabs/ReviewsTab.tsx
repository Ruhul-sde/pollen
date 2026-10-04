import React from "react";
import { Check, Star } from "lucide-react";
import { formatDate } from "../../../../shared/utils/formatters";

interface ReviewsTabProps {
  reviews: any[];
  onApproveReview: (reviewId: string) => void;
}

export function ReviewsTab({ reviews, onApproveReview }: ReviewsTabProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Customer Reviews</h2>
        <p className="text-xs text-neutral-400">Moderate product testimonials, ratings, and feedback</p>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800/80 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Customer & Rating</th>
                <th className="px-6 py-4">Review Content</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-neutral-400">
                    No customer reviews submitted yet.
                  </td>
                </tr>
              ) : (
                reviews.map((rev) => {
                  const revId = rev._id || rev.id;
                  const isApproved = rev.isApproved || rev.status === "approved";
                  return (
                    <tr key={revId} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4 font-semibold text-white">
                        {rev.productName || rev.product?.name || "Fragrance"}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{rev.userName || rev.user?.name || "Customer"}</p>
                        <div className="flex items-center gap-1 mt-1 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={i < (rev.rating || 5) ? "fill-amber-400" : "text-neutral-700"}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {rev.title && <p className="font-semibold text-white mb-0.5">{rev.title}</p>}
                        <p className="text-neutral-400 line-clamp-2">{rev.comment || rev.text}</p>
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-400">
                        {formatDate(rev.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase">
                            <Check size={12} /> Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => onApproveReview(revId)}
                            className="rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-300 transition-colors"
                          >
                            Approve
                          </button>
                        )}
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
