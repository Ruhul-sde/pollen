import React, { useState, useEffect } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Heart,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Truck,
  User,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  AdminCustomerDetails,
  AdminUser,
  getAdminCustomerDetails,
  toggleAdminUserStatus,
} from "@/app/api";
import { formatDate, formatPrice } from "@/shared/utils/formatters";

interface CustomerDetailModalProps {
  customer: AdminUser | null;
  onClose: () => void;
  onCustomerUpdated?: () => void;
}

export function CustomerDetailModal({
  customer,
  onClose,
  onCustomerUpdated,
}: CustomerDetailModalProps) {
  const [data, setData] = useState<AdminCustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "orders" | "cart" | "wishlist" | "logins" | "addresses"
  >("orders");
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) return;
    let cancelled = false;

    async function fetchDetails() {
      setLoading(true);
      setError(null);
      try {
        const details = await getAdminCustomerDetails(customer._id);
        if (!cancelled) setData(details);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load customer profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetails();
    return () => {
      cancelled = true;
    };
  }, [customer]);

  if (!customer) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleToggleStatus = async () => {
    if (!data) return;
    const currentStatus = data.user.isActive !== false;
    try {
      setTogglingStatus(true);
      await toggleAdminUserStatus(data.user._id, !currentStatus);
      setData((prev) =>
        prev
          ? {
              ...prev,
              user: { ...prev.user, isActive: !currentStatus },
            }
          : null
      );
      if (onCustomerUpdated) onCustomerUpdated();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to change customer status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const userObj = data?.user || customer;
  const metrics = data?.metrics;
  const isActive = (userObj as any).isActive !== false;

  const initials = (userObj.name || "Customer")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="w-full max-w-4xl rounded-3xl border border-neutral-800 bg-neutral-950 p-5 sm:p-7 shadow-2xl my-auto text-neutral-200 max-h-[92vh] flex flex-col"
      >
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-4">
            {/* Avatar with luxury golden gradient ring */}
            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-black font-black text-xl shadow-lg shadow-amber-500/20 tracking-wider">
                {initials}
              </div>
              <span
                className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-neutral-950 ${
                  isActive ? "bg-emerald-500" : "bg-rose-500"
                }`}
                title={isActive ? "Account Active" : "Account Suspended"}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {userObj.name || "Anonymous Customer"}
                </h3>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {isActive ? "Active" : "Suspended"}
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <Crown className="h-3 w-3 text-amber-400" />
                  <span>{(userObj as any).loyaltyTier || "Bronze Tier"}</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-neutral-400">
                <div className="flex items-center gap-1 text-neutral-300">
                  <Mail className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{userObj.email}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(userObj.email, "email")}
                    className="text-neutral-500 hover:text-white p-0.5"
                    title="Copy Email"
                  >
                    {copiedText === "email" ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>

                {userObj.phone && (
                  <div className="flex items-center gap-1 font-mono text-neutral-300">
                    <Phone className="h-3.5 w-3.5 text-neutral-400" />
                    <span>{userObj.phone}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(userObj.phone || "", "phone")}
                      className="text-neutral-500 hover:text-white p-0.5"
                      title="Copy Phone"
                    >
                      {copiedText === "phone" ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                )}

                <span className="text-[11px] text-neutral-500">
                  Member since {formatDate(userObj.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons top */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {userObj.role !== "admin" && (
              <button
                type="button"
                onClick={handleToggleStatus}
                disabled={togglingStatus}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
              >
                {isActive ? (
                  <>
                    <UserX className="h-3.5 w-3.5" />
                    <span>Suspend</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Activate</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            <p className="text-xs">Loading complete customer records & activity...</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-rose-400 text-xs">{error}</div>
        ) : data ? (
          <div className="flex-1 overflow-y-auto pt-6 space-y-6 pr-1">
            {/* KPI Metrics Cards with Graphic Glow */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* LTV */}
              <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/60 to-neutral-900/20 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Lifetime Spend
                  </span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CreditCard className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-white">
                  ₹{metrics?.totalSpent?.toLocaleString("en-IN") || 0}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  Avg: ₹{metrics?.avgOrderValue?.toLocaleString("en-IN") || 0} / order
                </p>
              </div>

              {/* Total Orders */}
              <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/60 to-neutral-900/20 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Total Orders
                  </span>
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-white">
                  {metrics?.totalOrders || 0}
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {metrics?.totalOrders && metrics.totalOrders > 0
                    ? `${metrics.totalOrders} total purchase${metrics.totalOrders > 1 ? "s" : ""}`
                    : "No orders placed"}
                </p>
              </div>

              {/* Current Active Cart */}
              <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/60 to-neutral-900/20 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    In Cart Right Now
                  </span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-amber-300">
                  {data.cart.itemCount} Bottles
                </p>
                <p className="text-[10px] text-neutral-400 mt-1">
                  {data.cart.itemCount > 0
                    ? `Cart Value: ₹${data.cart.subtotal}`
                    : "Cart currently empty"}
                </p>
              </div>

              {/* Wishlist & Points */}
              <div className="rounded-2xl border border-neutral-800/80 bg-gradient-to-b from-neutral-900/60 to-neutral-900/20 p-4 relative overflow-hidden">
                <div className="flex items-center justify-between text-neutral-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Wishlist & Points
                  </span>
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <Heart className="h-3.5 w-3.5" />
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-white">
                  {data.wishlist.length} Items
                </p>
                <p className="text-[10px] text-amber-400/90 mt-1">
                  ★ {(userObj as any).loyaltyPoints || 0} Reward Points
                </p>
              </div>
            </div>

            {/* Interactive Tab Strip */}
            <div className="flex items-center gap-1 border-b border-neutral-800 overflow-x-auto no-scrollbar pt-2">
              {[
                {
                  id: "orders",
                  label: "Order History",
                  badge: data.orders.length,
                  icon: Package,
                },
                {
                  id: "cart",
                  label: "In Cart",
                  badge: data.cart.itemCount,
                  icon: ShoppingCart,
                },
                {
                  id: "wishlist",
                  label: "Wishlist",
                  badge: data.wishlist.length,
                  icon: Heart,
                },
                {
                  id: "logins",
                  label: "Login Times & Activity",
                  badge: data.loginHistory.length,
                  icon: Clock,
                },
                {
                  id: "addresses",
                  label: "Saved Addresses",
                  badge: data.addresses.length,
                  icon: MapPin,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? "border-amber-400 text-amber-400"
                        : "border-transparent text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                          isSelected
                            ? "bg-amber-400 text-black font-bold"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab 1: Orders History */}
            {activeTab === "orders" && (
              <div className="space-y-3">
                {data.orders.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 p-8 text-center text-neutral-400 text-xs">
                    <Package className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                    <p className="font-semibold text-neutral-300">No orders placed yet</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      This customer has not completed any purchases.
                    </p>
                  </div>
                ) : (
                  data.orders.map((ord: any) => {
                    const statusStr = (ord.status || "pending").toLowerCase();
                    return (
                      <div
                        key={ord._id}
                        className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 hover:border-neutral-700 transition-all text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800/80">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-sm">
                                {(ord.orderId || ord.order_id || ord.displayId || ord._id?.slice(-8) || "").startsWith("PN")
                                  ? (ord.orderId || ord.order_id)
                                  : `#${ord.orderId || ord.order_id || ord.displayId || ord._id?.slice(-8)}`}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                  statusStr === "delivered"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : statusStr === "shipped"
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                }`}
                              >
                                {ord.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                              Placed on {formatDate(ord.createdAt)}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-bold text-amber-300 font-mono">
                              ₹{ord.total || ord.totalAmount}
                            </span>
                            <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                              Payment: {ord.paymentMethod || "Razorpay"} ({ord.paymentStatus || "pending"})
                            </p>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="pt-3 space-y-2">
                          {(ord.items || []).map((item: any, iIdx: number) => (
                            <div
                              key={iIdx}
                              className="flex items-center justify-between text-neutral-300 text-[11px]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                                <span className="font-semibold text-white">{item.name}</span>
                                {item.volume && (
                                  <span className="text-[10px] text-neutral-400">
                                    ({item.volume})
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-neutral-400">
                                Qty: {item.quantity || item.qty} × ₹{item.price || item.unitPrice}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Shipping Speed Post Tracker */}
                        {ord.trackingId && (
                          <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 text-neutral-400">
                              <Truck className="h-3.5 w-3.5 text-red-500" />
                              <span>{ord.carrier || "India Post Speed Post"}:</span>
                              <span className="font-mono text-white font-semibold">
                                {ord.consignmentNumber || ord.trackingId}
                              </span>
                            </div>
                            {ord.trackingUrl && (
                              <a
                                href={ord.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-red-400 hover:underline text-[10px] font-semibold"
                              >
                                <span>Track on Portal</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Active Cart */}
            {activeTab === "cart" && (
              <div className="space-y-3">
                {data.cart.items.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 p-8 text-center text-neutral-400 text-xs">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                    <p className="font-semibold text-neutral-300">Customer Cart is Empty</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      No fragrances currently placed in their bag.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span className="text-neutral-200">
                          <strong>Active Cart Detected:</strong> Customer has items pending checkout.
                        </span>
                      </div>
                      <span className="font-mono text-sm font-bold text-amber-300">
                        Subtotal: ₹{data.cart.subtotal}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {data.cart.items.map((cItem: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            {cItem.imageUrl ? (
                              <img
                                src={cItem.imageUrl}
                                alt={cItem.name}
                                className="h-10 w-10 rounded-lg object-contain bg-neutral-950 p-1 border border-neutral-800"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 font-bold text-xs">
                                50ML
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-white">{cItem.name}</p>
                              <p className="text-[11px] text-neutral-400">
                                Volume: {cItem.volume || "50 ML"} · ₹{cItem.unitPrice} each
                              </p>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-xs font-bold text-white">
                              Qty {cItem.qty}
                            </span>
                            <p className="text-xs font-bold text-amber-300">
                              ₹{(cItem.unitPrice || 0) * (cItem.qty || 1)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tab 3: Wishlist */}
            {activeTab === "wishlist" && (
              <div className="space-y-3">
                {data.wishlist.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 p-8 text-center text-neutral-400 text-xs">
                    <Heart className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                    <p className="font-semibold text-neutral-300">No Wishlist Items</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      This customer hasn't saved any fragrances to their favorites yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.wishlist.map((wItem: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3"
                      >
                        <img
                          src={wItem.imageUrl || "/Images/2e.jpg"}
                          alt={wItem.name}
                          className="h-12 w-12 rounded-lg object-contain bg-neutral-950 p-1 border border-neutral-800 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs truncate">{wItem.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">
                            {wItem.tagline || wItem.volume || "Artisanal Parfum"}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-amber-300">
                              ₹{wItem.price}
                            </span>
                            <span
                              className={`text-[9px] font-bold uppercase ${
                                wItem.inStock !== false ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {wItem.inStock !== false ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Login Times & Sessions */}
            {activeTab === "logins" && (
              <div className="space-y-4">
                {/* Last active banner */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Latest Activity</h4>
                      <p className="text-[11px] text-neutral-400">
                        {userObj.lastLogin
                          ? `Last authenticated: ${new Date(userObj.lastLogin).toLocaleString("en-IN")}`
                          : "Active session recorded"}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Online / Active
                  </span>
                </div>

                {/* Session Timeline */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                    Authentication & Session History
                  </h4>
                  {data.loginHistory.map((sess, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/30 px-4 py-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <div>
                          <p className="font-semibold text-white text-xs">
                            {sess.method || "Password Authentication"}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                            Device: {sess.device || "Chrome Web Browser"} · IP: {sess.ip || "127.0.0.1"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        {sess.timestamp ? new Date(sess.timestamp).toLocaleString("en-IN") : "Recent"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 5: Saved Addresses */}
            {activeTab === "addresses" && (
              <div className="space-y-3">
                {data.addresses.length === 0 ? (
                  <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/20 p-8 text-center text-neutral-400 text-xs">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                    <p className="font-semibold text-neutral-300">No Saved Delivery Addresses</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      This customer enters their address during checkout.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.addresses.map((addr: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                            {addr.label || "Address"}
                          </span>
                          {addr.isDefault && (
                            <span className="rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-neutral-200">
                          {addr.fullName || addr.name} · {addr.phone}
                        </p>
                        <p className="text-neutral-400 leading-relaxed text-[11px]">
                          {addr.line1 || addr.addressLine1}
                          {addr.postOffice ? `, ${addr.postOffice}` : ""}
                          {addr.city ? `, ${addr.city}` : ""}
                          {addr.state ? `, ${addr.state}` : ""}
                          {addr.pincode || addr.postalCode ? ` - ${addr.pincode || addr.postalCode}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
