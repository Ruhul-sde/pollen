import React from "react";
import { UserCheck, UserX, Eye, Sparkles } from "lucide-react";
import { AdminUser } from "@/app/api";
import { formatDate } from "@/shared/utils/formatters";

interface CustomersTabProps {
  users: AdminUser[];
  searchQuery: string;
  onToggleUserStatus: (user: AdminUser) => void;
  onSelectCustomer?: (user: AdminUser) => void;
}

export function CustomersTab({
  users,
  searchQuery,
  onToggleUserStatus,
  onSelectCustomer,
}: CustomersTabProps) {
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            Registered Customers
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {filteredUsers.length} total
            </span>
          </h2>
          <p className="text-xs text-neutral-400">
            Click any customer row to view their 360° activity (Orders, In-Cart items, Wishlist, Login times, Addresses)
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/30 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800/80 bg-neutral-950/80 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Registered Date</th>
                <th className="px-6 py-4">Account Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-neutral-400">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActive = (u as any).isActive !== false;
                  return (
                    <tr
                      key={u._id}
                      onClick={() => onSelectCustomer && onSelectCustomer(u)}
                      className={`transition-colors group ${
                        onSelectCustomer
                          ? "cursor-pointer hover:bg-neutral-800/50"
                          : "hover:bg-neutral-800/30"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700/80 flex items-center justify-center font-bold text-amber-400 text-xs shadow-inner group-hover:border-amber-500/50 group-hover:bg-amber-500/10 transition-colors">
                            {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                              {u.name || "Anonymous User"}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono">ID: {u._id?.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-neutral-200">{u.email}</p>
                        <p className="text-neutral-400 font-mono text-[11px]">{u.phone || "No phone"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            u.role === "admin"
                              ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                              : "bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          {u.role || "customer"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-neutral-400">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {onSelectCustomer && (
                            <button
                              type="button"
                              onClick={() => onSelectCustomer(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700 transition-colors"
                              title="View Customer 360° Profile"
                            >
                              <Eye className="h-3.5 w-3.5 text-amber-400" />
                              <span className="hidden sm:inline">360° View</span>
                            </button>
                          )}
                          {u.role !== "admin" && (
                            <button
                              type="button"
                              onClick={() => onToggleUserStatus(u)}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                isActive
                                  ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                  : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                              }`}
                              title={isActive ? "Suspend Customer" : "Activate Customer"}
                            >
                              {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                          )}
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
