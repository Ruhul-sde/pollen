import React from "react";
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
} from "lucide-react";
import { AdminStats } from "@/app/api";
import { useTenantConfig } from "@/config/tenantContext";

interface OverviewTabProps {
  stats: AdminStats | null;
  orders: any[];
  onSelectTab: (tab: any) => void;
}

export function OverviewTab({ stats, orders, onSelectTab }: OverviewTabProps) {
  const { adminTheme } = useTenantConfig();
  const isLight = adminTheme?.mode === "light";
  const accent = adminTheme?.accentColor || "#f59e0b";

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`,
      subtitle: "Gross settled sales",
      icon: DollarSign,
      color: isLight
        ? "text-amber-600 bg-amber-50 border-amber-200"
        : "text-amber-400 bg-amber-400/10 border-amber-400/20",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || orders.length,
      subtitle: `${stats?.pendingOrders || 0} pending processing`,
      icon: ShoppingBag,
      color: isLight
        ? "text-blue-600 bg-blue-50 border-blue-200"
        : "text-blue-400 bg-blue-400/10 border-blue-400/20",
      action: () => onSelectTab("orders"),
    },
    {
      title: "Active Fragrances",
      value: stats?.totalProducts || 0,
      subtitle: `${stats?.lowStockProducts || 0} out of stock`,
      icon: Package,
      color: isLight
        ? "text-emerald-600 bg-emerald-50 border-emerald-200"
        : "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
      action: () => onSelectTab("products"),
    },
    {
      title: "Customers",
      value: stats?.totalUsers || 0,
      subtitle: "Registered profiles",
      icon: Users,
      color: isLight
        ? "text-purple-600 bg-purple-50 border-purple-200"
        : "text-purple-400 bg-purple-400/10 border-purple-400/20",
      action: () => onSelectTab("customers"),
    },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            onClick={card.action}
            className={`p-5 rounded-2xl border transition-all ${
              isLight
                ? "border-slate-200/90 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm"
                : "border-neutral-800/80 bg-neutral-900/40 backdrop-blur-sm hover:border-neutral-700"
            } ${
              card.action
                ? isLight
                  ? "cursor-pointer hover:bg-slate-50/80"
                  : "cursor-pointer hover:bg-neutral-900/60"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isLight ? "text-slate-500" : "text-neutral-400"
                }`}
              >
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <h3
                className={`text-2xl font-extrabold tracking-tight font-mono ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                {card.value}
              </h3>
              <p className={`mt-1 text-xs ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                {card.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div
          className={`lg:col-span-2 rounded-2xl border p-5 transition-all ${
            isLight
              ? "border-slate-200/90 bg-white shadow-xs"
              : "border-neutral-800/80 bg-neutral-900/30 backdrop-blur-sm"
          }`}
        >
          <div
            className={`flex items-center justify-between pb-4 border-b ${
              isLight ? "border-slate-100" : "border-neutral-800/80"
            }`}
          >
            <div>
              <h3 className={`text-sm font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                Recent Orders
              </h3>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                Latest customer purchases
              </p>
            </div>
            <button
              onClick={() => onSelectTab("orders")}
              style={{ color: accent }}
              className="text-xs font-semibold hover:underline transition-colors cursor-pointer"
            >
              View All Orders →
            </button>
          </div>

          <div className={`mt-4 divide-y ${isLight ? "divide-slate-100" : "divide-neutral-800/60"}`}>
            {recentOrders.length === 0 ? (
              <p className={`text-xs py-8 text-center ${isLight ? "text-slate-400" : "text-neutral-400"}`}>
                No orders recorded yet.
              </p>
            ) : (
              recentOrders.map((ord) => (
                <div key={ord._id || ord.orderId} className="py-3 flex items-center justify-between">
                  <div>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isLight ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {(ord.orderId || ord.order_id || ord.displayId || ord._id?.slice(-8) || "").startsWith("PN")
                        ? (ord.orderId || ord.order_id)
                        : `#${ord.orderId || ord.order_id || ord.displayId || ord._id?.slice(-8)}`}
                    </span>
                    <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                      {ord.shippingAddress?.name || ord.user?.name || "Customer"} ·{" "}
                      {ord.items?.length || 1} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono text-xs font-bold ${
                        isLight ? "text-slate-900 font-extrabold" : "text-amber-300"
                      }`}
                    >
                      ₹{Number(ord.totalAmount || ord.amount || 0).toLocaleString()}
                    </span>
                    <div className="mt-0.5">
                      <span
                        className={`text-[10px] font-semibold uppercase ${
                          isLight ? "text-slate-500 font-bold" : "text-neutral-400"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Status / Health */}
        <div
          className={`rounded-2xl border p-5 space-y-4 transition-all ${
            isLight
              ? "border-slate-200/90 bg-white shadow-xs"
              : "border-neutral-800/80 bg-neutral-900/30 backdrop-blur-sm"
          }`}
        >
          <div>
            <h3 className={`text-sm font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              Store Operations
            </h3>
            <p className={`text-xs ${isLight ? "text-slate-500" : "text-neutral-400"}`}>Real-time status</p>
          </div>

          <div className="space-y-3 pt-2">
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isLight ? "border-slate-200 bg-slate-50/80" : "border-neutral-800 bg-neutral-900/60"
              }`}
            >
              <span className={`text-xs ${isLight ? "text-slate-700 font-medium" : "text-neutral-300"}`}>
                Database Connection
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live & Synced
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isLight ? "border-slate-200 bg-slate-50/80" : "border-neutral-800 bg-neutral-900/60"
              }`}
            >
              <span className={`text-xs ${isLight ? "text-slate-700 font-medium" : "text-neutral-300"}`}>
                Payment Gateway
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Razorpay Active
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isLight ? "border-slate-200 bg-slate-50/80" : "border-neutral-800 bg-neutral-900/60"
              }`}
            >
              <span className={`text-xs ${isLight ? "text-slate-700 font-medium" : "text-neutral-300"}`}>
                Dynamic Pricing
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
