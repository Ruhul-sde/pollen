import React, { useEffect, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Edit2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
  User as UserIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  deleteSavedAddress,
  getUserProfile,
  updateUserProfile,
  lookupPincode,
} from "@/app/api";
import {
  createSavedAddress,
  getOrdersByUser,
  getSavedAddresses,
  updateSavedAddress,
  Order,
  SavedAddress,
} from "@/app/supabase";
import { useTenantConfig } from "@/config/tenantContext";
import { ProfileSettingsProps } from "../types";
import { AddressForm, type AddressFormData } from "@/features/checkout/components/AddressForm";

export function ProfileSettings({
  open,
  user,
  provider,
  onClose,
  onPasswordChange,
  onSignOut,
  onOpenAdmin,
  onProfileUpdated,
  onTrackOrder,
  onShopNow,
  onPayNow,
}: ProfileSettingsProps) {
  const { config } = useTenantConfig();
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "details" | "security">("orders");

  // Personal Info State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [infoMessage, setInfoMessage] = useState("");
  const [infoSuccess, setInfoSuccess] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  // Orders State
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  // Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  // Password Change State
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Load User details, orders, and addresses
  const loadUserData = async () => {
    if (!user) return;
    try {
      setName(user.name || "");
      setPhone(user.phone || "");

      // Load remote profile info if available
      if (user.id || user.email) {
        getUserProfile(user.id, user.email)
          .then((p) => {
            if (p.phone) setPhone(p.phone);
            if (p.name) setName(p.name);
          })
          .catch(() => {});
      }

      // Load Orders
      if (user.id) {
        setLoadingOrders(true);
        const o = await getOrdersByUser(user.id);
        setUserOrders(o);
        setLoadingOrders(false);

        // Load Addresses
        setLoadingAddresses(true);
        const a = await getSavedAddresses(user.id);
        setAddresses(a);
        setLoadingAddresses(false);
      }
    } catch {
      setLoadingOrders(false);
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (open && user) {
      loadUserData();
      setPassword("");
      setConfirmation("");
      setPasswordMessage("");
      setPasswordError("");
      setInfoMessage("");
      setShowAddAddress(false);
      setEditingAddress(null);
    }
  }, [open, user]);

  if (!open || !user) return null;

  const handleCopyTrackingId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedTrackingId(id);
      setTimeout(() => setCopiedTrackingId(null), 2200);
    });
  };

  const handleUpdatePersonalInfo = async (e: FormEvent) => {
    e.preventDefault();
    setInfoMessage("");
    setInfoSuccess(false);
    setSavingInfo(true);
    try {
      const updated = await updateUserProfile({
        userId: user.id,
        email: user.email,
        name,
        phone,
      });
      setInfoSuccess(true);
      setInfoMessage("Your profile information has been saved successfully.");
      if (onProfileUpdated) {
        onProfileUpdated({
          ...user,
          name: updated.name,
          phone: updated.phone,
        });
      }
    } catch (err) {
      setInfoSuccess(false);
      setInfoMessage(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleAddressSubmit = async (data: AddressFormData) => {
    if (!user.id) return;
    setSavingAddress(true);
    try {
      if (editingAddress) {
        await updateSavedAddress(user.id, editingAddress.id, {
          label: data.label,
          full_name: data.full_name,
          phone: data.phone,
          address_line1: data.address_line1,
          post_office: data.post_office || null,
          landmark: data.landmark || null,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country || "India",
        });
      } else {
        await createSavedAddress(user.id, {
          label: data.label,
          full_name: data.full_name,
          phone: data.phone,
          address_line1: data.address_line1,
          post_office: data.post_office || null,
          landmark: data.landmark || null,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country || "India",
        });
      }
      setEditingAddress(null);
      setShowAddAddress(false);
      const a = await getSavedAddresses(user.id);
      setAddresses(a);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Unable to save address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    setDeletingAddressId(addrId);
    try {
      await deleteSavedAddress(addrId, user.id);
      if (user.id) {
        const a = await getSavedAddresses(user.id);
        setAddresses(a);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to remove address.");
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (password.length < 6)
      return setPasswordError("Password must contain at least 6 characters.");
    if (password !== confirmation)
      return setPasswordError("Password confirmation does not match.");
    setSubmittingPassword(true);
    try {
      await onPasswordChange(password);
      setPassword("");
      setConfirmation("");
      setPasswordMessage("Your password has been updated securely.");
    } catch (passwordErr) {
      setPasswordError(
        passwordErr instanceof Error
          ? passwordErr.message
          : "Unable to update your password."
      );
    } finally {
      setSubmittingPassword(false);
    }
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email
    ? user.email[0].toUpperCase()
    : "P";

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    if (pwd.length < 6) return { score: 1, label: "Weak", color: "bg-rose-500 text-rose-500" };
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    if (pwd.length >= 8 && hasNum && hasSpecial)
      return { score: 3, label: "Very Strong", color: "bg-emerald-500 text-emerald-500" };
    if (pwd.length >= 6 && hasNum)
      return { score: 2, label: "Good", color: "bg-amber-500 text-amber-500" };
    return { score: 1, label: "Fair", color: "bg-orange-500 text-orange-500" };
  };

  const strength = getPasswordStrength(password);
  const isGoogleUser = provider === "google" || (user as any)?.provider === "google";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm p-3 sm:p-5"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex h-[92vh] sm:h-[88vh] max-h-[780px] w-full max-w-2xl flex-col overflow-hidden rounded-2xl sm:rounded-[28px] border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 shadow-[0_25px_70px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_80px_rgba(0,0,0,0.85)]"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <div className="relative border-b border-neutral-200/80 dark:border-neutral-800/80 bg-gradient-to-b from-amber-500/[0.08] via-neutral-50/60 to-white dark:from-neutral-900/90 dark:via-[#161616] dark:to-[#121212] p-5 sm:p-7 shrink-0">
            {/* Subtle luxury ambient glows */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-400/15 dark:bg-amber-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-neutral-200/40 dark:bg-white/5 blur-2xl" />

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-600 dark:text-neutral-400">
                  {config?.branding?.brandName || "Pollen"} · My Profile
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  title="Sign out"
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 transition-all cursor-pointer"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Log out</span>
                </button>

                <button
                  onClick={onClose}
                  aria-label="Close Profile"
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-neutral-200 dark:border-white/10 bg-white/80 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 hover:text-black dark:hover:bg-white/15 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Profile Avatar & Details */}
            <div className="relative mt-4 sm:mt-5 flex items-center gap-3.5 sm:gap-4">
              <div className="flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 dark:border-amber-400/30 bg-gradient-to-br from-amber-100 via-amber-50 to-white dark:from-amber-400/20 dark:via-neutral-900 dark:to-black font-mono text-base sm:text-lg font-extrabold text-amber-800 dark:text-amber-300 shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base sm:text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                    {user.name || "Fragrance Enthusiast"}
                  </h3>
                  {user.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-400/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-400/40">
                      <ShieldCheck size={10} /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-white/10">
                      Member
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5">
                  <Mail size={11} className="shrink-0 text-neutral-400" />
                  <span className="truncate">{user.email}</span>
                </p>
              </div>
            </div>

            {/* Admin Portal Banner */}
            {user.role === "admin" && onOpenAdmin && (
              <div className="relative mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300/80 dark:border-amber-500/30 bg-gradient-to-r from-amber-100/90 via-amber-50/70 to-transparent dark:from-amber-500/15 dark:via-amber-500/5 dark:to-transparent px-3.5 py-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                  <Sparkles size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Administrative privileges active</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="rounded-lg bg-amber-500 dark:bg-amber-400 px-3 py-1 font-bold text-[10px] uppercase tracking-wider text-black hover:bg-amber-400 dark:hover:bg-amber-300 transition-colors shadow-xs cursor-pointer"
                >
                  Admin Portal
                </button>
              </div>
            )}

            {/* Responsive Tab Navigation */}
            <div className="mt-4 sm:mt-5 flex overflow-x-auto no-scrollbar rounded-xl sm:rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-100/90 dark:bg-neutral-900/90 p-1 gap-1">
              {[
                { id: "orders", label: "My Orders", count: userOrders.length, icon: Package },
                { id: "addresses", label: "Addresses", count: addresses.length, icon: MapPin },
                { id: "details", label: "Personal Info", icon: UserIcon },
                { id: "security", label: "Security", icon: KeyRound },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex shrink-0 sm:flex-1 items-center justify-center gap-1.5 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? "bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-xs font-extrabold"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                    }`}
                  >
                    <Icon size={13} className="shrink-0" />
                    <span>{tab.label}</span>
                    {typeof tab.count === "number" && tab.count > 0 && (
                      <span
                        className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                          active
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                            : "bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-7 text-sm space-y-6">
            {/* TAB 1: ORDERS */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    Purchase History ({userOrders.length})
                  </h4>
                </div>

                {loadingOrders ? (
                  <div className="space-y-3 py-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-28 animate-pulse rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/40"
                      />
                    ))}
                  </div>
                ) : userOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/20 p-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Package size={24} />
                    </div>
                    <p className="font-semibold text-neutral-900 dark:text-white">No orders placed yet</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      Explore our handcrafted fragrance collection and discover your signature scent.
                    </p>
                    {onShopNow && (
                      <button
                        type="button"
                        onClick={onShopNow}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs cursor-pointer"
                      >
                        <span>Explore Fragrances</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userOrders.map((order) => {
                      const isShipped = ["shipped", "out_for_delivery", "delivered"].includes(
                        (order.status || "").toLowerCase()
                      );
                      const hasTracking = Boolean(order.tracking_id && order.tracking_id.trim() && isShipped);

                      return (
                        <div
                          key={order.id}
                          className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-4 sm:p-5 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 dark:border-neutral-800/80 pb-3">
                            <div>
                              <span className="font-mono text-xs font-bold text-neutral-900 dark:text-white tracking-wide">
                                {(order.order_id || order.orderId || order.id?.slice(-8) || "").startsWith("PN")
                                  ? (order.order_id || order.orderId)
                                  : `#${order.order_id || order.orderId || order.id?.slice(-8)}`}
                              </span>
                              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
                                <Calendar size={11} className="shrink-0" />
                                {new Date(order.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                                ₹{Number(order.total_amount || 0).toLocaleString()}
                              </span>
                              <div className="mt-0.5">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                    order.status === "delivered"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                                      : order.status === "shipped"
                                      ? "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30"
                                      : order.status === "confirmed"
                                      ? "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30"
                                      : order.status === "cancelled"
                                      ? "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30"
                                      : "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
                                  }`}
                                >
                                  {order.status || "pending"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {hasTracking ? (
                            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/70 dark:border-purple-800/40 px-3.5 py-2.5 text-xs">
                              <div className="flex items-center gap-2">
                                <Truck size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
                                <span className="text-neutral-700 dark:text-neutral-300">
                                  AWB:{" "}
                                  <strong className="font-mono text-neutral-900 dark:text-white font-semibold">
                                    {order.tracking_id}
                                  </strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyTrackingId(order.tracking_id)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-white transition-colors cursor-pointer"
                                >
                                  {copiedTrackingId === order.tracking_id ? (
                                    <>
                                      <Check size={12} className="text-emerald-600" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy size={12} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                {onTrackOrder && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onClose();
                                      onTrackOrder(order.tracking_id);
                                    }}
                                    className="rounded-lg bg-amber-500 dark:bg-amber-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-amber-400 dark:hover:bg-amber-300 transition-colors shadow-xs cursor-pointer"
                                  >
                                    Track Live
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : order.status === "pending" ? (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/40 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200">
                              <div className="flex items-center gap-2">
                                <Clock size={13} className="shrink-0 text-amber-600 dark:text-amber-400" />
                                <span className="text-[11px] font-medium">
                                  Payment Pending · Complete payment to confirm order
                                </span>
                              </div>
                              {onPayNow && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onClose();
                                    onPayNow(order);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-black dark:bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs cursor-pointer"
                                >
                                  <CreditCard size={12} />
                                  <span>Pay Now</span>
                                </button>
                              )}
                            </div>
                          ) : order.status === "confirmed" ? (
                            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40 px-3.5 py-2 text-xs text-blue-700 dark:text-blue-300">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={13} className="shrink-0 text-blue-600 dark:text-blue-400" />
                                <span className="text-[11px]">
                                  Order Confirmed · Preparing for dispatch. Tracking ID will appear once shipped by admin.
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 font-mono">
                                Confirmed
                              </span>
                            </div>
                          ) : (
                            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60 px-3.5 py-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <div className="flex items-center gap-2">
                                <Clock size={13} className="shrink-0 text-amber-500" />
                                <span className="text-[11px]">
                                  {order.status === "cancelled"
                                    ? "Order has been cancelled."
                                    : "Preparing for dispatch · Tracking ID will appear once shipped by admin."}
                                </span>
                              </div>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 font-mono">
                                {order.status || "Pending"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    Saved Addresses ({addresses.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (showAddAddress) {
                        setShowAddAddress(false);
                        setEditingAddress(null);
                      } else {
                        setEditingAddress(null);
                        setShowAddAddress(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 dark:bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>{showAddAddress ? "Cancel" : "Add Address"}</span>
                  </button>
                </div>

                {showAddAddress && (
                  <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-neutral-200/80 dark:border-neutral-800 pb-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                        {editingAddress ? "Edit Delivery Address" : "New Delivery Address"}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddress(null);
                          setShowAddAddress(false);
                        }}
                        className="text-xs font-medium text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <AddressForm
                      initialData={
                        editingAddress
                          ? {
                              label: editingAddress.label === "Work" ? "Work" : "Home",
                              full_name: editingAddress.full_name || (editingAddress as any).name || "",
                              phone: editingAddress.phone || "",
                              address_line1: editingAddress.address_line1 || (editingAddress as any).address || "",
                              post_office: editingAddress.post_office || "",
                              landmark: editingAddress.landmark || "",
                              city: editingAddress.city || "",
                              state: editingAddress.state || "",
                              postal_code: editingAddress.postal_code || (editingAddress as any).pincode || "",
                              country: editingAddress.country || "India",
                            }
                          : { full_name: user?.name || "" }
                      }
                      submitLabel={editingAddress ? "Update Delivery Address" : "Save Delivery Address"}
                      loading={savingAddress}
                      onCancel={() => {
                        setEditingAddress(null);
                        setShowAddAddress(false);
                      }}
                      onSubmit={handleAddressSubmit}
                    />
                  </div>
                )}

                {loadingAddresses ? (
                  <div className="space-y-3 py-2">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-28 animate-pulse rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-900/40"
                      />
                    ))}
                  </div>
                ) : addresses.length === 0 && !showAddAddress ? (
                  <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/20 p-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <MapPin size={24} />
                    </div>
                    <p className="font-semibold text-neutral-900 dark:text-white">No delivery addresses saved</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-4">
                      Save your shipping address for fast, 1-click checkout and Speed Post delivery.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddress(null);
                        setShowAddAddress(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add Delivery Address</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => {
                      const recipientName = addr.full_name || (addr as any).name || "Customer";
                      const recipientPhone = addr.phone || "";
                      const fullAddr = [
                        addr.address_line1 || (addr as any).address,
                        addr.post_office,
                        addr.landmark ? `(Landmark: ${addr.landmark})` : null,
                        addr.city,
                        addr.state,
                        addr.postal_code || (addr as any).pincode,
                      ]
                        .filter(Boolean)
                        .join(", ");

                      return (
                        <div
                          key={addr.id}
                          className="relative rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-4 sm:p-5 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                {addr.label === "Work" ? "🏢 Work" : "🏠 Home"}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAddress(addr);
                                    setShowAddAddress(true);
                                  }}
                                  className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors p-1.5 cursor-pointer rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                  title="Edit address"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAddress(addr.id)}
                                  disabled={deletingAddressId === addr.id}
                                  className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 cursor-pointer rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                  title="Delete address"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <p className="font-bold text-neutral-900 dark:text-white text-xs mt-3">
                              {recipientName}
                            </p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                              {fullAddr}
                            </p>
                            {recipientPhone && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-2 flex items-center gap-1.5">
                                <Phone size={11} className="shrink-0" />
                                <span>Mobile: {recipientPhone}</span>
                              </p>
                            )}
                          </div>

                          <div className="mt-3.5 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                            <span className="flex items-center gap-1.5">
                              <Truck size={13} className="text-amber-500 shrink-0" />
                              <span>Speed Post Express available</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddress(addr);
                                setShowAddAddress(true);
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-neutral-700 dark:text-neutral-300 hover:underline cursor-pointer"
                            >
                              <Edit2 size={11} />
                              <span>Edit</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PERSONAL INFO */}
            {activeTab === "details" && (
              <form onSubmit={handleUpdatePersonalInfo} className="space-y-4 max-w-lg">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    Profile Details
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Update your account details and contact preferences.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400">
                      Email Address
                    </label>
                    <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                      <Lock size={10} /> Verified
                    </span>
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-100/80 dark:bg-neutral-900/50 px-3.5 py-2.5 text-xs text-neutral-500 dark:text-neutral-400 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1">
                    Account email is linked to your login provider.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-amber-500/20 font-mono"
                  />
                </div>

                {infoMessage && (
                  <div
                    className={`flex items-center gap-2 rounded-xl p-3 text-xs ${
                      infoSuccess
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300"
                        : "bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300"
                    }`}
                  >
                    {infoSuccess ? (
                      <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
                    )}
                    <span>{infoMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingInfo}
                  className="rounded-xl bg-amber-500 dark:bg-amber-400 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-400 dark:hover:bg-amber-300 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {savingInfo ? "Saving..." : "Save Profile"}
                </button>
              </form>
            )}

            {/* TAB 4: SECURITY */}
            {activeTab === "security" && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">
                    Password & Security
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isGoogleUser
                      ? "You are signed in with Google. You can set a password here to enable direct email & password sign-in as well."
                      : "Manage your account password and security credentials."}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3.5 py-2.5 pr-10 text-xs text-neutral-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-amber-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            strength.score >= 1 ? strength.color.split(" ")[0] : "bg-transparent"
                          } ${strength.score === 1 ? "w-1/3" : strength.score === 2 ? "w-2/3" : "w-full"}`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-neutral-500 dark:text-neutral-400">Password strength:</span>
                        <span className={`font-bold ${strength.color.split(" ")[1]}`}>
                          {strength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmation ? "text" : "password"}
                      required
                      value={confirmation}
                      onChange={(e) => setConfirmation(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3.5 py-2.5 pr-10 text-xs text-neutral-900 dark:text-white outline-none focus:border-amber-500 dark:focus:border-amber-400 focus:ring-1 focus:ring-amber-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmation(!showConfirmation)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white cursor-pointer"
                    >
                      {showConfirmation ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {confirmation && password && (
                    <p
                      className={`text-[10px] mt-1 flex items-center gap-1 ${
                        password === confirmation
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-500"
                      }`}
                    >
                      {password === confirmation ? (
                        <>
                          <Check size={10} /> Passwords match
                        </>
                      ) : (
                        "Passwords do not match yet"
                      )}
                    </p>
                  )}
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 p-3 text-xs text-rose-800 dark:text-rose-300">
                    <AlertCircle size={15} className="shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}
                {passwordMessage && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{passwordMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="rounded-xl bg-amber-500 dark:bg-amber-400 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-400 dark:hover:bg-amber-300 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {submittingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
