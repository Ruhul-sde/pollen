import React, { useState, useEffect, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  ExternalLink,
  Gift,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  MapPin,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Truck,
  X,
  Zap,
} from "lucide-react";
import type { SavedAddress } from "@/core/types";
import {
  calculateDynamicShipping,
  DynamicShippingInfo,
  lookupPincode,
  validateCoupon,
  getAvailableCoupons,
  ValidatedCoupon,
} from "@/app/api";
import { formatPrice } from "@/shared/utils/formatters";
import { useTenantConfig } from "@/config/tenantContext";
import { AddressForm, type AddressFormData } from "./AddressForm";

export interface CheckoutItem {
  id: number;
  name: string;
  img: string;
  price: number;
  quantity: number;
}

export interface CheckoutSectionProps {
  items: CheckoutItem[];
  onBack: () => void;
  onPlaceOrder: (
    address: SavedAddress,
    finalTotal?: number,
    couponDetails?: {
      couponCode?: string;
      couponDiscount?: number;
      subtotal?: number;
      shippingCharge?: number;
    }
  ) => void;
  addresses?: SavedAddress[];
  selectedAddressId?: string | null;
  onSelectAddress: (addressId: string) => void;
  onSaveAddress: (address: Omit<SavedAddress, "id" | "created_at">) => Promise<SavedAddress>;
  onUpdateAddress?: (addressId: string, address: Partial<SavedAddress>) => Promise<SavedAddress>;
  onChangeQuantity?: (id: number, change: number) => void;
  onRemoveItem?: (id: number) => void;
  onOpenPrivacy?: () => void;
  onOpenTerms?: () => void;
  onOpenRefund?: () => void;
  onOpenOrdersShipping?: () => void;
  onOpenCookies?: () => void;
}

export function CheckoutSection({
  items = [],
  onBack,
  onPlaceOrder,
  addresses = [],
  selectedAddressId,
  onSelectAddress,
  onSaveAddress,
  onUpdateAddress,
  onChangeQuantity,
  onRemoveItem,
  onOpenPrivacy,
  onOpenTerms,
  onOpenRefund,
  onOpenOrdersShipping,
  onOpenCookies,
}: CheckoutSectionProps) {
  const { branding, isFeatureEnabled, config } = useTenantConfig();
  const isDark = config.theme?.mode === "dark";
  const companyName = branding?.brandName || "Know Pollen";

  const safeItems = Array.isArray(items) ? items : [];
  const itemsCount = safeItems.reduce((acc, item) => acc + (Number(item?.quantity) || 1), 0);
  const total = safeItems.reduce(
    (sum, item) => sum + (Number(item?.price) || 0) * (Number(item?.quantity) || 1),
    0
  );

  // Address state
  const [showNewAddress, setShowNewAddress] = useState(addresses.length === 0);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressType, setAddressType] = useState<"Home" | "Work">("Home");
  const [form, setForm] = useState({
    label: "Home",
    full_name: "",
    phone: "",
    address_line1: "",
    post_office: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  });
  const [pinLoading, setPinLoading] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);

  // Policy Accordion State (Amazon / Flipkart style policy tabs)
  const [openPolicySection, setOpenPolicySection] = useState<string | null>("returns");

  // Sync showNewAddress with available saved addresses
  useEffect(() => {
    if (addresses.length > 0) {
      setShowNewAddress(false);
    } else {
      setShowNewAddress(true);
    }
  }, [addresses.length]);

  // Auto-select first address if none selected
  useEffect(() => {
    if (addresses.length > 0) {
      if (!selectedAddressId || !addresses.some((a) => a.id === selectedAddressId)) {
        onSelectAddress(addresses[0].id);
      }
    }
  }, [addresses, selectedAddressId, onSelectAddress]);

  const updateField = (field: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handlePincodeChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 6);
    updateField("postal_code", digits);
    if (digits.length < 6) {
      setDetectedLocation(null);
    }
  };

  // Debounced pincode lookup
  useEffect(() => {
    const cleanPin = form.postal_code.replace(/\D/g, "");
    if (cleanPin.length !== 6) return;

    const timer = setTimeout(async () => {
      setPinLoading(true);
      try {
        const res = await lookupPincode(cleanPin);
        if (res) {
          setForm((prev) => ({
            ...prev,
            city: prev.city || res.district || res.city || "",
            state: prev.state || res.state || "",
            post_office: prev.post_office || res.postOffices?.[0] || "",
          }));
          setDetectedLocation(`${res.district || res.city}, ${res.state}`);
        } else {
          setDetectedLocation(null);
        }
      } catch {
        setDetectedLocation(null);
      } finally {
        setPinLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [form.postal_code]);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showOffers, setShowOffers] = useState(false);

  // Load available active coupons on mount
  useEffect(() => {
    let mounted = true;
    getAvailableCoupons()
      .then((data) => {
        if (mounted && Array.isArray(data)) {
          setAvailableCoupons(data);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code");
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);
    try {
      const res = await validateCoupon(code, total);
      setAppliedCoupon(res);
      setCouponCodeInput(res.code);
      setCouponSuccess(
        res.freeShipping && (!res.discount || res.discount === 0)
          ? `Coupon "${res.code}" applied! Free express delivery unlocked.`
          : `Coupon "${res.code}" applied! Saved ${formatPrice(res.discount)}.`
      );
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err instanceof Error ? err.message : "Invalid or expired coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError(null);
    setCouponSuccess(null);
  };

  const couponDiscount = appliedCoupon ? Math.min(appliedCoupon.discount, total) : 0;
  const discountedSubtotal = Math.max(0, total - couponDiscount);

  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) || addresses[0];
  const [shippingInfo, setShippingInfo] = useState<DynamicShippingInfo | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);

  const activePincode =
    (showNewAddress ? form.postal_code : (selectedAddress?.postal_code || (selectedAddress as any)?.pincode)) || "";

  useEffect(() => {
    let active = true;
    async function updateShipping() {
      setShippingLoading(true);
      try {
        const pin = activePincode.replace(/\D/g, "").slice(0, 6) || "110001";
        const res = await calculateDynamicShipping(pin, total);
        if (active) setShippingInfo(res);
      } catch (err) {
        console.warn("Shipping calc error:", err);
      } finally {
        if (active) setShippingLoading(false);
      }
    }
    updateShipping();
    return () => {
      active = false;
    };
  }, [activePincode, total]);

  const isWaivedShipping = Boolean(shippingInfo?.isWaived);
  const isFreeShipping = Boolean(appliedCoupon?.freeShipping || shippingInfo?.isFreeShipping || isWaivedShipping);
  const shippingCharge = isFreeShipping ? 0 : (shippingInfo?.charge ?? (discountedSubtotal >= 499 ? 0 : 65));
  const grandTotal = Math.max(0, discountedSubtotal + shippingCharge);
  const totalSavings = couponDiscount + (isFreeShipping ? (shippingInfo?.standardCharge || 65) : 0);

  const couponPayload = appliedCoupon
    ? {
        couponCode: appliedCoupon.code,
        couponDiscount,
        subtotal: total,
        shippingCharge,
      }
    : {
        subtotal: total,
        shippingCharge,
      };

  const REQUIRED_ADDRESS_FIELDS: Array<keyof typeof form> = [
    "full_name", "phone", "address_line1", "city", "state", "postal_code", "country"
  ];

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddressError("");

    const missingFields = REQUIRED_ADDRESS_FIELDS.filter(field => !form[field]?.trim());
    if (missingFields.length > 0) {
      setAddressError(`Please fill in the required fields: ${missingFields.join(", ").replace(/_/g, " ")}.`);
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setAddressError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const pinDigits = form.postal_code.replace(/\D/g, "");
    if (pinDigits.length !== 6) {
      setAddressError("Please enter a valid 6-digit postal PIN code.");
      return;
    }

    setSavingAddress(true);
    try {
      const saved = await onSaveAddress({ ...form, label: addressType, postal_code: pinDigits });
      onSelectAddress(saved.id);
      setShowNewAddress(false);
      setForm({
        label: "Home",
        full_name: "",
        phone: "",
        address_line1: "",
        post_office: "",
        city: "",
        state: "",
        postal_code: "",
        country: "India",
      });
      setDetectedLocation(null);
      onPlaceOrder(saved, grandTotal, couponPayload);
    } catch (error) {
      setAddressError(error instanceof Error ? error.message : "Unable to save this address.");
    } finally {
      setSavingAddress(false);
    }
  };

  const openPolicy = (policy: "privacy" | "terms" | "refund" | "orders" | "cookies") => {
    if (policy === "privacy" && onOpenPrivacy) onOpenPrivacy();
    else if (policy === "terms" && onOpenTerms) onOpenTerms();
    else if (policy === "refund" && onOpenRefund) onOpenRefund();
    else if (policy === "orders" && onOpenOrdersShipping) onOpenOrdersShipping();
    else if (policy === "cookies" && onOpenCookies) onOpenCookies();
    window.dispatchEvent(new CustomEvent("open-policy", { detail: policy }));
  };

  const fieldClass =
    "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white px-3.5 py-2.5 text-xs outline-none focus:border-black dark:focus:border-white transition-colors placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-2xs";

  if (safeItems.length === 0) {
    return (
      <section className="min-h-screen bg-[#faf9f6] dark:bg-[#0a0a0a] text-neutral-900 dark:text-white px-4 pb-16 pt-24 sm:px-6 md:px-16 md:pt-32 flex items-center justify-center transition-colors">
        <div className="mx-auto max-w-md text-center py-16">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <ShoppingBag size={28} />
          </div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.45em] text-neutral-500">
            {companyName}
          </p>
          <h1 className="text-2xl font-bold uppercase tracking-wide">Your Cart is Empty</h1>
          <p className="mt-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
            You don't have any fragrances in your cart to check out. Explore our luxury collection and discover your signature scent.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-8 inline-flex items-center gap-2.5 rounded-xl bg-black dark:bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft size={14} /> Back to Fragrances
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-[#faf9f6] dark:bg-[#0a0a0a] text-neutral-900 dark:text-white px-4 pb-20 pt-20 sm:px-6 md:px-12 lg:px-16 transition-colors">
      <div className="mx-auto max-w-7xl">
        {/* Amazon/Flipkart Professional Top Header */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/80 dark:border-neutral-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="group inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1 duration-200" />
              <span>Back</span>
            </button>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 block">
                {companyName} Atelier
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span>Secure Checkout</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                  {itemsCount} {itemsCount === 1 ? "item" : "items"}
                </span>
              </h1>
            </div>
          </div>

          {/* Flipkart / Amazon Trust Badges in Header */}
          <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-600/20 dark:border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/20 px-3 py-1.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
              <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
              <span>100% Safe & Verified</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
              <Lock size={13} className="text-amber-600 shrink-0" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {/* E-Commerce Stepper (Amazon / Flipkart Progress Bar) */}
        <div className="mb-8 hidden sm:flex items-center justify-between rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-3 shadow-2xs">
          {[
            { step: 1, label: "Bag & Cart", status: "completed" },
            { step: 2, label: "Delivery Address", status: "active" },
            { step: 3, label: "Order Review", status: "active" },
            { step: 4, label: "Secure Payment", status: "upcoming" },
          ].map((s, idx) => (
            <React.Fragment key={s.step}>
              <div className="flex items-center gap-2.5 px-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    s.status === "completed"
                      ? "bg-emerald-600 text-white"
                      : s.status === "active"
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-xs"
                      : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                  }`}
                >
                  {s.status === "completed" ? <Check size={13} /> : s.step}
                </div>
                <span
                  className={`text-xs font-bold tracking-wide ${
                    s.status === "active"
                      ? "text-neutral-900 dark:text-white"
                      : s.status === "completed"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-neutral-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div className="h-0.5 flex-1 bg-neutral-200 dark:bg-neutral-800 mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          {/* LEFT COLUMN: Address Selection, Items Review, Flipkart/Amazon Policies */}
          <div className="space-y-6">
            {/* 1. DELIVERY ADDRESS SECTION */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-4 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold text-xs">
                    1
                  </span>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      Delivery Address
                    </h2>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Where should we deliver your fragrance order?
                    </p>
                  </div>
                </div>

                {addresses.length > 0 && !showNewAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddress(null);
                      setShowNewAddress(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Add New</span>
                  </button>
                )}
              </div>

              {showNewAddress ? (
                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setAddressError("");
                          setEditingAddress(null);
                          setShowNewAddress(false);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                      >
                        <ArrowLeft size={13} />
                        <span>Back to saved addresses</span>
                      </button>
                    )}
                    {editingAddress && (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Editing Delivery Address
                      </span>
                    )}
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
                        : undefined
                    }
                    submitLabel={
                      editingAddress ? "Update Address & Deliver Here" : "Save Address & Deliver Here"
                    }
                    loading={savingAddress}
                    onCancel={
                      addresses.length > 0
                        ? () => {
                            setEditingAddress(null);
                            setShowNewAddress(false);
                          }
                        : undefined
                    }
                    onSubmit={async (data) => {
                      setSavingAddress(true);
                      setAddressError("");
                      try {
                        if (editingAddress) {
                          if (onUpdateAddress) {
                            const updated = await onUpdateAddress(editingAddress.id, data);
                            onSelectAddress(updated.id);
                          } else {
                            const saved = await onSaveAddress(data);
                            onSelectAddress(saved.id);
                          }
                        } else {
                          const saved = await onSaveAddress(data);
                          onSelectAddress(saved.id);
                        }
                        setEditingAddress(null);
                        setShowNewAddress(false);
                      } catch (err) {
                        setAddressError(err instanceof Error ? err.message : "Failed to save address");
                      } finally {
                        setSavingAddress(false);
                      }
                    }}
                  />

                  {addressError && (
                    <div className="rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{addressError}</span>
                    </div>
                  )}
                </div>
              ) : !showAllAddresses ? (
                /* Compact Short Address View (Minimal Height & Clean) */
                <div className="mt-3.5">
                  {selectedAddress ? (() => {
                    const recipientName = selectedAddress.full_name || (selectedAddress as any).name || "Customer";
                    const recipientPhone = selectedAddress.phone || "";
                    const fullAddr = [
                      selectedAddress.address_line1 || (selectedAddress as any).address,
                      selectedAddress.post_office,
                      selectedAddress.landmark ? `(Landmark: ${selectedAddress.landmark})` : null,
                      selectedAddress.city,
                      selectedAddress.state,
                      selectedAddress.postal_code || (selectedAddress as any).pincode,
                    ].filter(Boolean).join(", ");

                    return (
                      <div className="rounded-xl border border-neutral-300/90 dark:border-neutral-700 bg-neutral-50/70 dark:bg-neutral-800/40 p-3 sm:p-3.5 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <MapPin size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">
                                  {recipientName}
                                </span>
                                <span className="rounded bg-neutral-200/80 dark:bg-neutral-700 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                                  {selectedAddress.label || "Home"}
                                </span>
                                {recipientPhone && (
                                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                    · {recipientPhone}
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300 leading-snug">
                                {fullAddr}
                              </p>
                            </div>
                          </div>

                          {/* Quick Compact Actions */}
                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddress(selectedAddress);
                                setShowNewAddress(true);
                              }}
                              className="text-[11px] font-semibold text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white px-2 py-1 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-700 transition cursor-pointer"
                              title="Edit address"
                            >
                              Edit
                            </button>
                            {addresses.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setShowAllAddresses(true)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold shadow-2xs hover:opacity-90 transition cursor-pointer"
                              >
                                <span>Change</span>
                                <ChevronDown size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-center">
                      <p className="text-xs text-neutral-500">No address selected.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAddress(null);
                          setShowNewAddress(true);
                        }}
                        className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black text-xs font-bold"
                      >
                        <Plus size={13} />
                        <span>Add Delivery Address</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* All Saved Address List (Drawer / Expanded View) */
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                        Choose Delivery Address ({addresses.length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAllAddresses(false)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white cursor-pointer px-2 py-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                    >
                      <span>Show Selected Only</span>
                      <ChevronUp size={13} />
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {addresses.map((address) => {
                      const isSelected = selectedAddressId === address.id || (!selectedAddressId && address.id === selectedAddress?.id);
                      const recipientName = address.full_name || (address as any).name || "Customer";
                      const recipientPhone = address.phone || "";
                      const fullAddr = [
                        address.address_line1 || (address as any).address,
                        address.post_office,
                        address.landmark ? `(Landmark: ${address.landmark})` : null,
                        address.city,
                        address.state,
                        address.postal_code || (address as any).pincode,
                      ].filter(Boolean).join(", ");

                      return (
                        <div
                          key={address.id}
                          onClick={() => {
                            onSelectAddress(address.id);
                            setShowAllAddresses(false);
                          }}
                          className={`group relative rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer ${
                            isSelected
                              ? "border-black dark:border-white bg-amber-500/5 dark:bg-amber-400/5 shadow-xs ring-1 ring-black dark:ring-white"
                              : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-700"
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <input
                              type="radio"
                              name="delivery_address"
                              checked={isSelected}
                              onChange={() => {
                                onSelectAddress(address.id);
                                setShowAllAddresses(false);
                              }}
                              className="mt-1 accent-black dark:accent-amber-400 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-neutral-900 dark:text-white">
                                    {recipientName}
                                  </span>
                                  <span className="rounded-md bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                                    {address.label || "Home"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isSelected && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                      <Check size={11} />
                                      <span>Selected</span>
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingAddress(address);
                                      setShowNewAddress(true);
                                    }}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white px-2 py-0.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                    title="Edit address"
                                  >
                                    <Edit2 size={11} />
                                    <span>Edit</span>
                                  </button>
                                </div>
                              </div>

                              <p className="mt-1.5 text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                {fullAddr}
                              </p>
                              {recipientPhone && (
                                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                  Mobile: {recipientPhone}
                                </p>
                              )}

                              <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <span className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                                  <Truck size={13} className="text-amber-500 shrink-0" />
                                  <span>Speed Post Express available</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectAddress(address.id);
                                    setShowAllAddresses(false);
                                  }}
                                  className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                                >
                                  {isSelected ? "Selected" : "Deliver Here →"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddress(null);
                        setShowNewAddress(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>+ Add Another Address</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAllAddresses(false)}
                      className="px-4 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold shadow-2xs hover:opacity-90 transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. ORDER ITEMS REVIEW SECTION */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-5 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-black dark:bg-white text-white dark:text-black font-bold text-xs">
                    2
                  </span>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                      Order Items ({itemsCount})
                    </h2>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Handcrafted artisanal perfumes sealed for dispatch
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>Complimentary Luxury Samples Included</span>
                </span>
              </div>

              <div className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
                {safeItems.map((item) => (
                  <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <img src={item.img} alt={item.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                          50ml Eau de Parfum · Artisanal Batch
                        </p>
                        <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 mt-1">
                          {formatPrice(item.price)} each
                        </p>
                      </div>
                    </div>

                    {/* Quantity controls and item subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-[76px] sm:pl-0">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity > 1) {
                                onChangeQuantity?.(item.id, -1);
                              } else {
                                onRemoveItem?.(item.id);
                              }
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white transition cursor-pointer"
                            title={item.quantity > 1 ? "Decrease quantity" : "Remove item"}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold font-mono text-neutral-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onChangeQuantity?.(item.id, 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white transition cursor-pointer"
                            title="Increase quantity"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        {onRemoveItem && (
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                            title="Remove from order"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Line Item Total */}
                      <div className="text-right min-w-[70px]">
                        <p className="text-sm font-mono font-bold text-neutral-900 dark:text-white">
                          {formatPrice((item.price || 0) * (item.quantity || 1))}
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                          In Stock · Ships in 24h
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. FLIPKART & AMAZON TRUST GUARANTEES BADGES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: RotateCcw,
                  title: "7-Day Easy Returns",
                  desc: "Replacement or full refund if damaged",
                },
                {
                  icon: ShieldCheck,
                  title: "100% Authentic",
                  desc: "Direct from Pollen Atelier",
                },
                {
                  icon: Truck,
                  title: "Speed Post EMS",
                  desc: "Official postal barcode tracking",
                },
                {
                  icon: Lock,
                  title: "Safe & Encrypted",
                  desc: "256-Bit Razorpay security",
                },
              ].map((badge) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={badge.title}
                    className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 p-3.5 text-center shadow-2xs"
                  >
                    <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Icon size={16} />
                    </div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight">
                      {badge.title}
                    </p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                      {badge.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* 4. FLIPKART / AMAZON POLICY ACCORDIONS */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-5 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-amber-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                    Buyer Protection & Store Policies (Amazon & Flipkart Standard)
                  </h3>
                </div>
                <span className="text-[10px] text-neutral-400">Pollen Assurance</span>
              </div>

              <div className="mt-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                {/* Policy 1: Returns & Replacements */}
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenPolicySection(openPolicySection === "returns" ? null : "returns")}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw size={13} className="text-emerald-600" />
                      <span>7-Day Replacement & Return Policy</span>
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        openPolicySection === "returns" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openPolicySection === "returns" && (
                    <div className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 pl-5 space-y-1.5 animate-fadeIn">
                      <p>
                        • <strong>Damaged or Defective Items:</strong> If your perfume arrives damaged in transit or broken, we offer an immediate, free replacement or full refund within 7 days of delivery.
                      </p>
                      <p>
                        • <strong>Unopened Returns:</strong> Unopened and sealed perfume bottles with original packaging and batch holograms intact can be returned for a 100% refund.
                      </p>
                      <button
                        type="button"
                        onClick={() => openPolicy("refund")}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline pt-1 cursor-pointer"
                      >
                        <span>View complete Return & Refund Policy</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Policy 2: Shipping & Speed Post */}
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenPolicySection(openPolicySection === "shipping" ? null : "shipping")}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Truck size={13} className="text-blue-600" />
                      <span>Shipping & Express Delivery Terms</span>
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        openPolicySection === "shipping" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openPolicySection === "shipping" && (
                    <div className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 pl-5 space-y-1.5 animate-fadeIn">
                      <p>
                        • <strong>Carrier:</strong> All parcels are dispatched via <strong>India Post Speed Post EMS</strong> with national air and surface express delivery.
                      </p>
                      <p>
                        • <strong>Free Delivery:</strong> Orders valued at ₹499 and above qualify for 100% complimentary Speed Post shipping across India.
                      </p>
                      <p>
                        • <strong>Live Tracking:</strong> You will receive an official Consignment AWB number to track package milestones live on India Post and our website.
                      </p>
                      <button
                        type="button"
                        onClick={() => openPolicy("orders")}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline pt-1 cursor-pointer"
                      >
                        <span>View complete Shipping & Delivery Policy</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Policy 3: Cancellation Terms */}
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenPolicySection(openPolicySection === "cancellation" ? null : "cancellation")}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Clock size={13} className="text-amber-600" />
                      <span>Order Fulfillment & Cancellation Terms</span>
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        openPolicySection === "cancellation" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openPolicySection === "cancellation" && (
                    <div className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 pl-5 space-y-1.5 animate-fadeIn">
                      <p>
                        • <strong>Rapid Fulfillment:</strong> Once confirmed, orders enter the automated packaging workflow. Customer self-cancellation is restricted to prevent duplicate dispatches.
                      </p>
                      <p>
                        • <strong>Support Assistance:</strong> In case of wrong address or accidental order, contact our concierge immediately at <strong>contactpollen@gmail.com</strong> or WhatsApp before the consignment is dispatched.
                      </p>
                    </div>
                  )}
                </div>

                {/* Policy 4: Security & Privacy */}
                <div className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenPolicySection(openPolicySection === "security" ? null : "security")}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Lock size={13} className="text-purple-600" />
                      <span>Payment Security & Privacy Guarantee</span>
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        openPolicySection === "security" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {openPolicySection === "security" && (
                    <div className="mt-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 pl-5 space-y-1.5 animate-fadeIn">
                      <p>
                        • <strong>Zero Card Storage:</strong> Your payment details are processed directly through Razorpay's PCI-DSS Level 1 certified gateway. We never store credit/debit card numbers or UPI PINs.
                      </p>
                      <p>
                        • <strong>Privacy:</strong> Your address, phone number, and contact info are strictly used for delivery notification and courier dispatch.
                      </p>
                      <button
                        type="button"
                        onClick={() => openPolicy("privacy")}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline pt-1 cursor-pointer"
                      >
                        <span>View complete Privacy Policy</span>
                        <ExternalLink size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary, Promo Codes, Policies & Checkout Button */}
          <div className="space-y-5 lg:sticky lg:top-24 h-fit">
            {/* PRICE BREAKDOWN CARD (Flipkart & Amazon Standard) */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-5 sm:p-7 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                Price Details ({itemsCount} {itemsCount === 1 ? "Item" : "Items"})
              </h2>

              <div className="space-y-3 text-xs">
                {/* Items Total */}
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Price ({itemsCount} items)</span>
                  <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(total)}</span>
                </div>

                {/* Coupon Discount */}
                {appliedCoupon && couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Tag size={12} />
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                    </span>
                    <span className="font-bold">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                {/* Delivery Charges */}
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span className="flex items-center gap-1">
                    <span>India Post Speed Post</span>
                    {isFreeShipping && (
                      <span className="rounded bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 dark:text-emerald-300">
                        FREE
                      </span>
                    )}
                  </span>
                  <div>
                    {shippingLoading ? (
                      <span className="text-[11px] text-neutral-400">Calculating...</span>
                    ) : isFreeShipping ? (
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className="text-neutral-400 dark:text-neutral-500 line-through text-xs font-mono">
                          ₹{shippingInfo?.standardCharge || 65}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                          FREE
                        </span>
                        <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          {isWaivedShipping ? (shippingInfo?.waiveLabel || "Waived Off") : "Waived Off"}
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-neutral-900 dark:text-white">{formatPrice(shippingCharge)}</span>
                    )}
                  </div>
                </div>

                {/* Delivery Fee Waiver Notification Banner */}
                {isWaivedShipping && !shippingLoading && (
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/80 dark:bg-emerald-950/30 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-medium text-[11px] truncate">
                        {shippingInfo?.waiveLabel || "Delivery Fee Waived"}: ₹{shippingInfo?.standardCharge || 65} Speed Post shipping is 100% complimentary
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs shrink-0">
                      -₹{shippingInfo?.standardCharge || 65}
                    </span>
                  </div>
                )}

                {/* Packaging & Safety */}
                <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Luxury Eco Packaging & Tamper Seal</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FREE</span>
                </div>

                {/* Grand Total */}
                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-baseline justify-between">
                  <div>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white block">
                      Total Payable
                    </span>
                    <span className="text-[10px] text-neutral-400">Inclusive of all taxes & GST</span>
                  </div>
                  <span className="text-2xl font-mono font-extrabold text-neutral-900 dark:text-white">
                    {formatPrice(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Flipkart / Amazon Green Savings Banner */}
              {totalSavings > 0 && (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-950/30 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span>You will save <strong>{formatPrice(totalSavings)}</strong> on this order!</span>
                </div>
              )}

              {/* Promo Code Input Box */}
              {isFeatureEnabled("coupons") && (
                <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mb-2">
                    Have a Promo Code?
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/30 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag size={13} className="text-emerald-600 shrink-0" />
                        <span className="font-mono text-xs font-bold text-emerald-950 dark:text-emerald-200">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 truncate">
                          (-{formatPrice(couponDiscount)})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                        title="Remove coupon"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleApplyCoupon();
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={couponCodeInput}
                          onChange={(e) => {
                            setCouponCodeInput(e.target.value.toUpperCase());
                            if (couponError) setCouponError(null);
                          }}
                          placeholder="PROMO CODE"
                          className="w-full uppercase font-mono tracking-wider rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white transition-colors placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400"
                        />
                        <button
                          type="submit"
                          disabled={couponLoading || !couponCodeInput.trim()}
                          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-40 transition-colors cursor-pointer shrink-0"
                        >
                          {couponLoading ? "Checking..." : "Apply"}
                        </button>
                      </form>

                      {couponError && (
                        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} />
                          <span>{couponError}</span>
                        </p>
                      )}
                      {couponSuccess && (
                        <p className="mt-1.5 text-xs text-emerald-700 flex items-center gap-1 font-medium">
                          <Check size={12} />
                          <span>{couponSuccess}</span>
                        </p>
                      )}

                      {/* Available Coupons Drawer */}
                      {availableCoupons.length > 0 && (
                        <div className="mt-2.5">
                          <button
                            type="button"
                            onClick={() => setShowOffers((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                          >
                            <Gift size={12} />
                            <span>{availableCoupons.length} Active Offers Available ({showOffers ? "Hide" : "View"})</span>
                          </button>

                          {showOffers && (
                            <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto pr-1">
                              {availableCoupons.map((coupon: any) => {
                                const code = coupon.code || coupon.couponCode;
                                return (
                                  <div
                                    key={code}
                                    className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 p-2 text-xs"
                                  >
                                    <div>
                                      <span className="font-mono font-bold">{code}</span>
                                      <p className="text-[10px] text-neutral-500 truncate">{coupon.description || "Special offer"}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleApplyCoupon(code)}
                                      className="text-[10px] font-bold uppercase bg-black dark:bg-white text-white dark:text-black px-2 py-1 rounded"
                                    >
                                      Apply
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* PROCEED TO PAYMENT BUTTON */}
              <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  disabled={!selectedAddress || showNewAddress}
                  onClick={() => selectedAddress && onPlaceOrder(selectedAddress, grandTotal, couponPayload)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-all shadow-md hover:shadow-lg"
                >
                  <Lock size={14} />
                  <span>Proceed to Payment · {formatPrice(grandTotal)}</span>
                </button>
                <p className="mt-2 text-center text-[10px] text-neutral-500 dark:text-neutral-400">
                  Select payment method (UPI / Cards / NetBanking) on the next screen
                </p>
              </div>

              {/* AMAZON / FLIPKART LEGAL AGREEMENT NOTICE */}
              <div className="mt-4 pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                <p className="text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  By clicking Proceed to Payment, you agree to Pollen's{" "}
                  <button
                    type="button"
                    onClick={() => openPolicy("terms")}
                    className="underline hover:text-black dark:hover:text-white"
                  >
                    Terms & Conditions
                  </button>
                  ,{" "}
                  <button
                    type="button"
                    onClick={() => openPolicy("privacy")}
                    className="underline hover:text-black dark:hover:text-white"
                  >
                    Privacy Policy
                  </button>
                  ,{" "}
                  <button
                    type="button"
                    onClick={() => openPolicy("orders")}
                    className="underline hover:text-black dark:hover:text-white"
                  >
                    Shipping Policy
                  </button>
                  , and{" "}
                  <button
                    type="button"
                    onClick={() => openPolicy("refund")}
                    className="underline hover:text-black dark:hover:text-white"
                  >
                    Return Policy
                  </button>
                  .
                </p>
              </div>
            </div>

            {/* PAYMENT ACCEPTANCE & SECURITY BADGE CARD */}
            <div className="rounded-2xl border border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 p-4 text-center space-y-2 shadow-2xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Guaranteed Safe & Secure Checkout
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                {["UPI Instant", "Google Pay", "PhonePe", "Paytm", "Visa", "Mastercard", "RuPay", "NetBanking"].map((method) => (
                  <span
                    key={method}
                    className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 text-[10px] font-semibold text-neutral-700 dark:text-neutral-300"
                  >
                    {method}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-center gap-1.5 pt-2 text-[10px] text-neutral-400">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span>Powered by Razorpay · 256-Bit SSL Secured</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
