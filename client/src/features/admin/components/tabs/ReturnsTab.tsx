import React from "react";
import { Check, X } from "lucide-react";
import { formatDate } from "../../../../shared/utils/formatters";

interface ReturnsTabProps {
  returns: any[];
  onProcessReturn: (returnId: string, status: string, refundAmount?: number) => void;
}

export function ReturnsTab({ returns, onProcessReturn }: ReturnsTabProps) {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Return Requests</h2>
        <p className="text-xs text-neutral-400">Review customer return requests, inspect damage reports, and trigger refunds</p>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800/80 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Order / ID</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-neutral-400">
                    No return requests registered.
                  </td>
                </tr>
              ) : (
                returns.map((ret) => {
                  const retId = ret._id || ret.id;
                  return (
                    <tr key={retId} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {(ret.orderId || ret.order_id || retId?.slice(-8) || "").startsWith("PN")
                          ? (ret.orderId || ret.order_id)
                          : `#${ret.orderId || ret.order_id || retId?.slice(-8)}`}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{ret.reason || "Defective product"}</p>
                        {ret.comments && <p className="text-[11px] text-neutral-400 mt-0.5">{ret.comments}</p>}
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-400">
                        {formatDate(ret.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            ret.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : ret.status === "rejected"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {ret.status || "pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(!ret.status || ret.status === "pending") && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onProcessReturn(retId, "approved", ret.refundAmount)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Approve Return"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onProcessReturn(retId, "rejected")}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                              title="Reject Return"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
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
