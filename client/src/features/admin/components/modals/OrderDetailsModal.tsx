import React from "react";
import { CreditCard, MapPin, Package, ShoppingBag, X } from "lucide-react";
import { motion } from "motion/react";
import { StatusBadge } from "../../../../shared/components/StatusBadge";
import { formatDate } from "../../../../shared/utils/formatters";

interface OrderDetailsModalProps {
  order: any | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onOpenTracking: (order: any) => void;
}

export function OrderDetailsModal({
  order,
  onClose,
  onUpdateStatus,
  onOpenTracking,
}: OrderDetailsModalProps) {
  if (!order) return null;

  const addr = order.shippingAddress || order.shipping_address || {};
  const items: any[] = order.items || [];
  const status = order.status || "pending";
  const orderId = order._id || order.orderId;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl my-8 text-white"
      >
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-800 text-amber-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">
                  Order {(order.orderId || order.order_id || order.displayId || orderId || "").startsWith("PN")
                    ? (order.orderId || order.order_id)
                    : `#${order.orderId || order.order_id || order.displayId || orderId}`}
                </h3>
                <StatusBadge status={status} />
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 font-mono">
                Placed on {formatDate(order.createdAt || order.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 pt-5 text-xs">
          {/* Customer & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40">
              <div className="flex items-center gap-2 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] mb-2">
                <MapPin className="h-3.5 w-3.5 text-amber-400" />
                <span>Shipping Address</span>
              </div>
              <p className="font-bold text-white text-sm">{addr.name || order.user?.name || "Customer"}</p>
              <p className="text-neutral-400 mt-1">{addr.address || "Address not provided"}</p>
              <p className="text-neutral-400">
                {addr.city ? `${addr.city}, ` : ""}
                {addr.state ? `${addr.state} ` : ""}
                {addr.pincode ? `- ${addr.pincode}` : ""}
              </p>
              <p className="text-neutral-400 mt-1 font-mono">Phone: {addr.phone || "—"}</p>
            </div>

            <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-900/40">
              <div className="flex items-center gap-2 text-neutral-400 font-semibold uppercase tracking-wider text-[10px] mb-2">
                <CreditCard className="h-3.5 w-3.5 text-amber-400" />
                <span>Payment Details</span>
              </div>
              <p className="text-neutral-400">
                Method: <span className="text-white font-semibold">{order.paymentMethod || "Online (Razorpay)"}</span>
              </p>
              <p className="text-neutral-400 mt-1">
                Payment Status:{" "}
                <span className="text-emerald-400 font-semibold uppercase">{order.paymentStatus || "Paid"}</span>
              </p>
              {order.paymentId && (
                <p className="text-neutral-400 mt-1 font-mono">ID: {order.paymentId}</p>
              )}
              <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-neutral-400">Total Charged:</span>
                <span className="text-base font-bold text-amber-300 font-mono">
                  ₹{Number(order.totalAmount || order.amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
              Ordered Fragrances ({items.length})
            </h4>
            <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.img || item.imageUrl || "/Images/2e.jpg"}
                      alt={item.name}
                      className="h-10 w-10 rounded-lg object-cover bg-neutral-950 border border-neutral-800"
                    />
                    <div>
                      <p className="font-bold text-white text-xs">{item.name}</p>
                      <p className="text-[10px] text-neutral-400">
                        {item.volume || "50 ML"} · Qty: {item.quantity || 1}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-amber-300">
                    ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking info if any */}
          {order.trackingId && (
            <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase text-purple-400">AWB Tracking ID</p>
                <p className="text-sm font-mono text-white mt-0.5">{order.trackingId}</p>
              </div>
              <button
                onClick={() => onOpenTracking(order)}
                className="rounded-lg bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                Update Tracking
              </button>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 text-xs">Update Status:</span>
              <select
                value={status}
                onChange={(e) => onUpdateStatus(orderId, e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {!order.trackingId && status !== "delivered" && status !== "cancelled" && (
                <button
                  type="button"
                  onClick={() => onOpenTracking(order)}
                  className="rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 px-4 py-2 text-xs font-semibold hover:bg-purple-500/30 transition-colors"
                >
                  Add Tracking Info
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
