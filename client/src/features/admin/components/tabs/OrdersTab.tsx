import React from "react";
import { Eye, Search, Trash2, Truck } from "lucide-react";
import { StatusBadge } from "../../../../shared/components/StatusBadge";
import { formatDate } from "../../../../shared/utils/formatters";

interface OrdersTabProps {
  orders: any[];
  searchQuery: string;
  orderFilter: string;
  onFilterChange: (filter: string) => void;
  onSelectOrder: (order: any) => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  onOpenTracking: (order: any) => void;
  onDeleteOrder: (orderId: string) => void;
}

export function OrdersTab({
  orders,
  searchQuery,
  orderFilter,
  onFilterChange,
  onSelectOrder,
  onUpdateStatus,
  onOpenTracking,
  onDeleteOrder,
}: OrdersTabProps) {
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== "all" && (o.status || "").toLowerCase() !== orderFilter.toLowerCase()) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const id = (o.orderId || o.displayId || o._id || "").toLowerCase();
    const name = (o.shippingAddress?.name || o.user?.name || "").toLowerCase();
    const phone = (o.shippingAddress?.phone || "").toLowerCase();
    return id.includes(q) || name.includes(q) || phone.includes(q);
  });

  const filterTabs = [
    { id: "all", label: "All Orders" },
    { id: "pending", label: "Pending" },
    { id: "confirmed", label: "Confirmed" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Order Management</h2>
          <p className="text-xs text-neutral-400">Track, fulfill and manage customer purchases</p>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl border border-neutral-800 bg-neutral-900/60">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                orderFilter === tab.id
                  ? "bg-amber-400 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800/80 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                    No orders match your filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const ordId = ord._id || ord.orderId;
                  return (
                    <tr key={ordId} className="hover:bg-neutral-800/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-white">
                        {(ord.orderId || ord.order_id || ord.displayId || ord._id?.slice(-8) || "").startsWith("PN")
                          ? (ord.orderId || ord.order_id)
                          : `#${ord.orderId || ord.order_id || ord.displayId || ord._id?.slice(-8)}`}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">
                          {ord.shippingAddress?.name || ord.user?.name || "Customer"}
                        </p>
                        <p className="text-[11px] text-neutral-400 font-mono">
                          {ord.shippingAddress?.phone || ord.user?.email || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-400">
                        {formatDate(ord.createdAt || ord.created_at)}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-amber-300">
                        ₹{Number(ord.totalAmount || ord.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={ord.status || "pending"}
                          onChange={(e) => onUpdateStatus(ordId, e.target.value)}
                          className="rounded-lg border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-white outline-none focus:border-amber-400"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectOrder(ord)}
                            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors"
                            title="View Order Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onOpenTracking(ord)}
                            className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                            title="Update Tracking Info"
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeleteOrder(ordId)}
                            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title="Delete Order"
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
