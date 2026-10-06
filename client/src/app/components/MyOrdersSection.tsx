import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  HelpCircle,
  MapPin,
  Package,
  Phone,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { trackOrderLive } from "@/app/api";

export type OrderItem = {
  name: string;
  price: number;
  quantity: number;
};

export type OrderRecord = {
  id: string;
  tracking_id: string;
  carrier?: string;
  consignment_number?: string;
  status: string;
  payment_status?: string | null;
  paymentStatus?: string | null;
  total_amount: number | null;
  created_at: string;
  title?: string;
  customer_name?: string | null;
  delivery_phone?: string | null;
  delivery_address?: string | null;
  items?: OrderItem[];
  payment_id?: string | null;
};

export type MyOrdersSectionProps = {
  orders: OrderRecord[];
  loading?: boolean;
  onBack: () => void;
  onPayNow: (order: OrderRecord) => void;
  onDeleteOrder?: (orderId: string) => Promise<void>;
  onBuyAgain?: (order: OrderRecord) => void;
  onExploreFragrances?: () => void;
  user?: { name?: string; email?: string } | null;
};

export function MyOrdersSection({
  orders,
  loading = false,
  onBack,
  onPayNow,
  onDeleteOrder,
  onBuyAgain,
  onExploreFragrances,
  user,
}: MyOrdersSectionProps) {
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "delivered" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<OrderRecord | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<OrderRecord | null>(null);
  const [liveTrackingData, setLiveTrackingData] = useState<any | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  useEffect(() => {
    if (!activeTrackingOrder) {
      setLiveTrackingData(null);
      return;
    }
    let cancelled = false;
    async function loadTracking() {
      setLoadingTracking(true);
      try {
        const data = await trackOrderLive(activeTrackingOrder.tracking_id);
        if (!cancelled) setLiveTrackingData(data);
      } catch (err) {
        console.warn("Live tracking fetch failed, using order fallback:", err);
      } finally {
        if (!cancelled) setLoadingTracking(false);
      }
    }
    loadTracking();
    return () => {
      cancelled = true;
    };
  }, [activeTrackingOrder]);

  // Copy tracking ID
  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const statusLower = (order.status || "").toLowerCase();

      // Status filter
      if (filterStatus === "pending" && statusLower !== "pending") return false;
      if (filterStatus === "delivered" && statusLower !== "delivered") return false;
      if (
        filterStatus === "active" &&
        !["confirmed", "paid", "processing", "shipped", "out_for_delivery"].includes(statusLower)
      ) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesOrderId = ((order.order_id || (order as any).orderId || order.id || "")).toLowerCase().includes(q);
        const matchesTracking = order.tracking_id.toLowerCase().includes(q);
        const matchesTitle = (order.title || "").toLowerCase().includes(q);
        const matchesAddress = (order.delivery_address || "").toLowerCase().includes(q);
        const matchesName = (order.customer_name || "").toLowerCase().includes(q);
        return matchesOrderId || matchesTracking || matchesTitle || matchesAddress || matchesName;
      }

      return true;
    });
  }, [orders, filterStatus, searchQuery]);

  // Status badge config
  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "delivered":
        return {
          label: "Delivered",
          bg: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
          dot: "bg-emerald-500",
        };
      case "shipped":
        return {
          label: "In Transit",
          bg: "bg-indigo-500/10 text-indigo-700 border-indigo-500/30",
          dot: "bg-indigo-500",
        };
      case "confirmed":
        return {
          label: "Confirmed",
          bg: "bg-blue-500/10 text-blue-700 border-blue-500/30",
          dot: "bg-blue-500",
        };
      case "paid":
      case "processing":
        return {
          label: "Processing",
          bg: "bg-sky-500/10 text-sky-700 border-sky-500/30",
          dot: "bg-sky-500",
        };
      case "pending":
        return {
          label: "Pending Payment",
          bg: "bg-amber-500/10 text-amber-700 border-amber-500/30",
          dot: "bg-amber-500",
        };
      case "cancelled":
        return {
          label: "Cancelled",
          bg: "bg-rose-500/10 text-rose-700 border-rose-500/30",
          dot: "bg-rose-500",
        };
      default:
        return {
          label: status,
          bg: "bg-neutral-100 text-neutral-700 border-neutral-300",
          dot: "bg-neutral-400",
        };
    }
  };

  return (
    <section className="min-h-screen bg-[#faf9f6] dark:bg-[#0a0a0a] px-4 py-24 sm:px-6 md:px-12 lg:px-16 text-neutral-900 dark:text-neutral-100 transition-colors">
      <div className="mx-auto max-w-5xl">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 -ml-2.5 text-xs font-bold uppercase tracking-[0.18em] text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft
              size={15}
              className="transition-transform group-hover:-translate-x-1 duration-200"
            />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-black/45 dark:text-white/45">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>
              Signed in as{" "}
              <strong className="text-black dark:text-white">
                {user?.name || user?.email || "Pollen Customer"}
              </strong>
            </span>
          </div>
        </div>

        {/* Page Hero Header */}
        <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 dark:text-neutral-400">
              <Package size={13} className="text-amber-600 dark:text-amber-400" />
              <span>Personal Acquisition History</span>
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white">
              My Orders
            </h1>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
              Track live shipments, review order receipts, download official invoices, and manage
              delivery destinations for your Pollen artisanal fragrances.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="rounded-2xl border border-black/10 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 shadow-2xs text-center min-w-[90px]">
              <p className="text-[9px] uppercase tracking-wider text-black/40 dark:text-white/40 font-bold">Total</p>
              <p className="text-xl font-black text-black dark:text-white">{orders.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 py-3 shadow-2xs text-center min-w-[90px]">
              <p className="text-[9px] uppercase tracking-wider text-black/40 dark:text-white/40 font-bold">Delivered</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {orders.filter((o) => o.status.toLowerCase() === "delivered").length}
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Search and Filter Tabs */}
        <div className="mt-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Status Filter Tabs */}
          <div className="flex overflow-x-auto rounded-2xl border border-black/10 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-1.5 shadow-2xs gap-1">
            {[
              { id: "all", label: "All Orders", count: orders.length },
              {
                id: "active",
                label: "In Progress",
                count: orders.filter((o) =>
                  ["confirmed", "paid", "processing", "shipped", "out_for_delivery"].includes(
                    o.status.toLowerCase()
                  ),
                ).length,
              },
              {
                id: "delivered",
                label: "Delivered",
                count: orders.filter((o) => o.status.toLowerCase() === "delivered").length,
              },
              {
                id: "pending",
                label: "Pending Payment",
                count: orders.filter((o) => o.status.toLowerCase() === "pending").length,
              },
            ].map((tab) => {
              const active = filterStatus === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterStatus(tab.id as any)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-xs"
                      : "text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[9px] ${
                      active
                        ? "bg-white/20 text-white dark:bg-black/20 dark:text-black"
                        : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 md:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracking ID, item..."
              className="w-full rounded-2xl border border-black/10 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-2.5 pl-10 pr-9 text-xs outline-none focus:border-black dark:focus:border-white text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        <div className="mt-8 space-y-6">
          {loading ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-3xl border border-black/5 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70"
                />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            /* Empty State */
            <div className="rounded-3xl border border-dashed border-black/15 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center shadow-2xs">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500">
                <Package size={28} />
              </div>
              <h3 className="mt-4 text-lg font-bold text-neutral-900 dark:text-white">
                {orders.length === 0
                  ? "No Orders Found Yet"
                  : "No orders match your current filter"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                {orders.length === 0
                  ? "When you order our signature fragrances, your shipment tracking, delivery details, and official invoices will appear here."
                  : "Try clearing your search query or switching to another filter tab to view other orders."}
              </p>

              {orders.length === 0 ? (
                <button
                  type="button"
                  onClick={onExploreFragrances || onBack}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-black dark:bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Explore Fragrance Catalog</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus("all");
                    setSearchQuery("");
                  }}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl border border-black/20 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusBadge = getStatusBadge(order.status);
              const statusLower = (order.status || "").toLowerCase();
              const isDelivered = statusLower === "delivered";
              const isShipped = ["shipped", "out_for_delivery", "delivered"].includes(statusLower);
              const isConfirmed = ["confirmed", "processing", "paid", "shipped", "out_for_delivery", "delivered"].includes(statusLower);
              const isPending = statusLower === "pending";
              const isCancelled = statusLower === "cancelled";
              const isPaid = statusLower === "paid" || isConfirmed;
              const hasTracking = Boolean(order.tracking_id && order.tracking_id.trim() && isShipped);

              return (
                <article
                  key={order.id}
                  className="rounded-3xl border border-black/10 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 p-6 sm:p-7 shadow-xs hover:border-black/20 dark:hover:border-neutral-700 transition-all space-y-5"
                >
                  {/* Top Bar: Order ID, Tracking (if shipped), Date & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/5 dark:border-neutral-800/80 pb-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Order ID */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 font-bold">
                          Order ID:
                        </span>
                        <span className="font-mono text-sm font-extrabold text-black dark:text-white tracking-wider">
                          {(order.order_id || (order as any).orderId || order.id?.slice(-8) || "PENDING").startsWith("PN")
                            ? (order.order_id || (order as any).orderId)
                            : `#${order.order_id || (order as any).orderId || (order.id ? order.id.slice(-8).toUpperCase() : "PENDING")}`}
                        </span>
                      </div>

                      {/* If shipped, show AWB and copy button */}
                      {hasTracking && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/50 px-2 py-0.5">
                          <span className="text-[10px] uppercase tracking-wider text-purple-700 dark:text-purple-300 font-bold">
                            AWB:
                          </span>
                          <span className="font-mono text-xs font-bold text-purple-900 dark:text-purple-200">
                            {order.tracking_id}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(order.tracking_id)}
                            className="ml-1 text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-white transition-colors cursor-pointer"
                            title="Copy tracking code"
                          >
                            {copiedId === order.tracking_id ? (
                              <Check size={11} className="text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(order.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadge.bg}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
                        <span>{statusBadge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* 4-Stage Visual Delivery Progression Bar */}
                  <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 p-4 border border-black/5 dark:border-neutral-800/70">
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      {/* Step 1: Order Placed / Payment Pending */}
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`h-1.5 w-full rounded-full ${
                            isPending
                              ? "bg-amber-400 animate-pulse"
                              : isCancelled
                              ? "bg-rose-400"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span
                          className={
                            isPending
                              ? "text-amber-700 dark:text-amber-400 font-semibold"
                              : isCancelled
                              ? "text-rose-700 dark:text-rose-400 font-semibold"
                              : "text-emerald-700 dark:text-emerald-400"
                          }
                        >
                          {isPending ? "1. Payment Pending" : isCancelled ? "1. Cancelled" : "1. Order Placed"}
                        </span>
                      </div>

                      {/* Step 2: Confirmed */}
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`h-1.5 w-full rounded-full ${
                            isConfirmed && !isPending && !isCancelled
                              ? "bg-emerald-500"
                              : "bg-neutral-200 dark:bg-neutral-700"
                          }`}
                        />
                        <span
                          className={
                            isConfirmed && !isPending && !isCancelled
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-neutral-400 dark:text-neutral-500"
                          }
                        >
                          2. Confirmed
                        </span>
                      </div>

                      {/* Step 3: Dispatched */}
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`h-1.5 w-full rounded-full ${
                            isShipped && !isPending && !isCancelled
                              ? "bg-emerald-500"
                              : "bg-neutral-200 dark:bg-neutral-700"
                          }`}
                        />
                        <span
                          className={
                            isShipped && !isPending && !isCancelled
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-neutral-400 dark:text-neutral-500"
                          }
                        >
                          3. Dispatched
                        </span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center gap-1.5">
                        <span
                          className={`h-1.5 w-full rounded-full ${
                            isDelivered && !isPending && !isCancelled
                              ? "bg-emerald-500"
                              : "bg-neutral-200 dark:bg-neutral-700"
                          }`}
                        />
                        <span
                          className={
                            isDelivered && !isPending && !isCancelled
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-neutral-400 dark:text-neutral-500"
                          }
                        >
                          4. Delivered
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mid Content: Details Grid */}
                  <div className="grid gap-6 md:grid-cols-3 pt-2">
                    {/* Items Summary */}
                    <div className="space-y-1 md:col-span-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Item Summary
                      </p>
                      <h4 className="text-base font-bold text-neutral-900 dark:text-white leading-snug">
                        {order.title || "Pollen Fragrance Order"}
                      </h4>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Artisanal Extrait de Parfum Collection
                      </p>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-1 md:col-span-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Shipping Address
                      </p>
                      {order.delivery_address ? (
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed flex items-start gap-1.5">
                          <MapPin size={13} className="shrink-0 text-neutral-400 dark:text-neutral-500 mt-0.5" />
                          <span>{order.delivery_address}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">Standard Delivery Destination</p>
                      )}
                      {order.delivery_phone && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-1 font-mono">
                          <Phone size={12} className="shrink-0 text-neutral-400 dark:text-neutral-500" />
                          <span>{order.delivery_phone}</span>
                        </p>
                      )}
                    </div>

                    {/* Amount & Pricing */}
                    <div className="space-y-1 text-left md:text-right md:col-span-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                        Total Amount
                      </p>
                      <p className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                        ₹{Number(order.total_amount ?? 0).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        Free Express Air Delivery
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 dark:border-neutral-800/80 pt-4">
                    {/* Left Actions: Support, Invoice */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Track Shipment Modal Button */}
                      {hasTracking ? (
                        <button
                          type="button"
                          onClick={() => setActiveTrackingOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors cursor-pointer"
                        >
                          <Truck size={13} />
                          <span>Live Tracking</span>
                        </button>
                      ) : isPending ? (
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                          <Clock size={12} className="text-amber-500" />
                          <span>Awaiting Payment</span>
                        </div>
                      ) : isCancelled ? (
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-rose-300 dark:border-rose-800/60 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-400">
                          <X size={12} className="text-rose-500" />
                          <span>Order Cancelled</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 px-3 py-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                          <Clock size={12} className="text-amber-500" />
                          <span>Dispatch Pending</span>
                        </div>
                      )}

                      {/* View / Print Invoice Button - Only available once payment is complete */}
                      {!isPending && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => setActiveInvoiceOrder(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-black/15 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        >
                          <FileText size={13} />
                          <span>View Invoice</span>
                        </button>
                      )}

                      {/* Need Help Email Link */}
                      <a
                        href={`mailto:contactpollen@gmail.com?subject=Inquiry regarding Order ${order.order_id || (order as any).orderId || order.id}&body=Hello Pollen Atelier,%0D%0A%0D%0AI need help with my order ${order.order_id || (order as any).orderId || order.id}.%0D%0AThank you!`}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                      >
                        <HelpCircle size={13} />
                        <span>Need Help?</span>
                      </a>
                    </div>

                    {/* Right Actions: Pay Now / Buy Again */}
                    <div className="flex items-center gap-2">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => onPayNow(order)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-xs"
                        >
                          <CreditCard size={13} />
                          <span>Complete Payment</span>
                        </button>
                      ) : (
                        onBuyAgain && (
                          <button
                            type="button"
                            onClick={() => onBuyAgain(order)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-black/20 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors cursor-pointer"
                          >
                            <RotateCcw size={13} />
                            <span>Buy Again</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* 1. Interactive Live Shipment Tracking Modal */}
      <AnimatePresence>
        {activeTrackingOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
            onClick={() => setActiveTrackingOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-black/10 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-8 shadow-2xl text-neutral-900 dark:text-neutral-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-black/10 dark:border-neutral-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white font-black text-[11px] shadow-sm tracking-tight">
                    IP
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-black dark:text-white tracking-tight">
                        India Post Speed Post
                      </h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 px-2 py-0.5 rounded">
                        EMS Express
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      भारतीय डाक · Live Consignment Tracking
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTrackingOrder(null)}
                  className="rounded-lg p-1 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Consignment Details Box */}
              {(() => {
                const consignment =
                  liveTrackingData?.consignmentNumber ||
                  activeTrackingOrder.consignment_number ||
                  activeTrackingOrder.tracking_id;
                const portalUrl =
                  liveTrackingData?.trackingUrl ||
                  `https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consNo=${consignment}`;

                return (
                  <>
                    <div className="mt-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-black/5 dark:border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
                            Speed Post Consignment ID (Article)
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-base font-extrabold text-black dark:text-white tracking-wider">
                              {consignment}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(consignment)}
                              className="text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors p-1"
                              title="Copy Consignment Number"
                            >
                              {copiedId === consignment ? (
                                <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500">
                            Service Type
                          </p>
                          <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Domestic Speed Post</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-black/5 dark:border-neutral-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {loadingTracking ? "Syncing live postal hubs..." : "Live Postal Network Status"}
                        </span>
                        <a
                          href={portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline text-[11px]"
                        >
                          <span>Official India Post Portal</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>

                    {/* Checkpoints Timeline */}
                    <div className="mt-6 space-y-4">
                      {liveTrackingData?.trackingEvents && liveTrackingData.trackingEvents.length > 0 ? (
                        liveTrackingData.trackingEvents.map((evt: any, idx: number) => {
                          const isLast = idx === liveTrackingData.trackingEvents.length - 1;
                          const evtDate = evt.timestamp ? new Date(evt.timestamp) : null;
                          const timeStr = evtDate
                            ? evtDate.toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "";

                          return (
                            <div key={idx} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                                    isLast
                                      ? "bg-red-600 text-white shadow-sm ring-2 ring-red-100 dark:ring-red-950"
                                      : "bg-black dark:bg-white text-white dark:text-black"
                                  }`}
                                >
                                  <Check size={12} />
                                </div>
                                {!isLast && <div className="h-10 w-0.5 my-1 bg-neutral-200 dark:bg-neutral-800" />}
                              </div>
                              <div className="flex-1 pb-1">
                                <div className="flex items-baseline justify-between gap-2">
                                  <p className="text-xs font-bold text-neutral-900 dark:text-white">
                                    {evt.office || evt.location || "Postal Hub"}
                                  </p>
                                  {timeStr && (
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono shrink-0">
                                      {timeStr}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                                  {evt.description}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        [
                          {
                            title: "Item Booked at Origin GPO",
                            desc: `Consignment #${consignment} registered under EMS Speed Post at New Delhi GPO.`,
                            done: true,
                          },
                          {
                            title: "Dispatched to National Sorting Hub",
                            desc: "Transferred to Delhi Air Mail NSH for inter-state sorting.",
                            done: activeTrackingOrder.status.toLowerCase() !== "pending",
                          },
                          {
                            title: "Destination Hub & Sub-Office",
                            desc: "Arrived at destination district sorting center.",
                            done:
                              activeTrackingOrder.status.toLowerCase() === "shipped" ||
                              activeTrackingOrder.status.toLowerCase() === "delivered",
                          },
                          {
                            title: "Delivered to Addressee",
                            desc: activeTrackingOrder.delivery_address || "Package signed and delivered by Beat Postman.",
                            done: activeTrackingOrder.status.toLowerCase() === "delivered",
                          },
                        ].map((step, idx) => (
                          <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                                  step.done
                                    ? "bg-black dark:bg-white text-white dark:text-black"
                                    : "border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500"
                                }`}
                              >
                                {step.done ? <Check size={12} /> : idx + 1}
                              </div>
                              {idx < 3 && (
                                <div
                                  className={`h-9 w-0.5 my-1 ${
                                    step.done ? "bg-black dark:bg-white" : "bg-neutral-200 dark:bg-neutral-800"
                                  }`}
                                />
                              )}
                            </div>
                            <div>
                              <p
                                className={`text-xs font-bold ${
                                  step.done ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-500"
                                }`}
                              >
                                {step.title}
                              </p>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="mt-6 border-t border-black/10 dark:border-neutral-800 pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTrackingOrder(null)}
                  className="rounded-xl bg-black dark:bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Official Printable Invoice / Receipt Modal */}
      <AnimatePresence>
        {activeInvoiceOrder &&
          !["pending", "cancelled"].includes((activeInvoiceOrder.status || "").toLowerCase()) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
            onClick={() => setActiveInvoiceOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-black/10 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 sm:p-8 md:p-10 shadow-2xl text-black dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Invoice Actions Top */}
              <div className="flex items-center justify-between border-b border-black/10 dark:border-neutral-800 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-neutral-400 dark:text-neutral-500">
                  Official Atelier Receipt
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 rounded-xl border border-black/20 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3.5 py-1.5 text-xs font-bold text-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInvoiceOrder(null)}
                    className="rounded-lg p-1 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Invoice Content */}
              <div className="mt-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-widest text-black dark:text-white">
                      POLLEN
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Artisanal Fragrance House</p>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">contactpollen@gmail.com</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-wider text-black dark:text-white">
                      TAX INVOICE
                    </p>
                    <p className="font-mono text-xs text-neutral-600 dark:text-neutral-400 mt-0.5">
                      INV-{activeInvoiceOrder.order_id || (activeInvoiceOrder as any).orderId || activeInvoiceOrder.id.slice(-8).toUpperCase()}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Date: {new Date(activeInvoiceOrder.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 p-4 border border-black/5 dark:border-neutral-800 text-xs">
                  <div>
                    <p className="font-bold text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                      Billed To
                    </p>
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {activeInvoiceOrder.customer_name || user?.name || "Customer"}
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-400">{user?.email}</p>
                    {activeInvoiceOrder.delivery_phone && (
                      <p className="text-neutral-500 dark:text-neutral-400 font-mono">
                        Phone: {activeInvoiceOrder.delivery_phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                      Shipping Address
                    </p>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      {activeInvoiceOrder.delivery_address || "Registered Delivery Address"}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-black/10 dark:border-neutral-800 rounded-2xl overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-neutral-800">
                      <tr>
                        <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">
                          {activeInvoiceOrder.title || "Pollen Artisanal Extrait de Parfum"}
                        </td>
                        <td className="p-3 text-center text-neutral-700 dark:text-neutral-300">1</td>
                        <td className="p-3 text-right font-mono text-neutral-700 dark:text-neutral-300">
                          ₹{Number(activeInvoiceOrder.total_amount ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                          ₹{Number(activeInvoiceOrder.total_amount ?? 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary Table */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Subtotal</span>
                      <span className="font-mono">
                        ₹{Number(activeInvoiceOrder.total_amount ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                      <span>Express Shipping</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold uppercase text-[10px]">
                        FREE
                      </span>
                    </div>
                    <div className="border-t border-black/10 dark:border-neutral-800 pt-2 flex justify-between font-black text-sm text-black dark:text-white">
                      <span>Total Paid</span>
                      <span className="font-mono">
                        ₹{Number(activeInvoiceOrder.total_amount ?? 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Sign-off */}
                <div className="border-t border-black/10 dark:border-neutral-800 pt-4 text-center text-[10px] text-neutral-400 dark:text-neutral-500">
                  Thank you for experiencing Pollen. For inquiries contact contactpollen@gmail.com
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
