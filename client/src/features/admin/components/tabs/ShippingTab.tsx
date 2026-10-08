import React, { useState, useEffect } from "react";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  HelpCircle,
  MapPin,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import { ensureAdminToken, saveAdminShippingConfig } from "@/app/api";

interface ShippingTabProps {
  shippingRules: any[];
  onUpdated?: () => void;
}

export function ShippingTab({ shippingRules, onUpdated }: ShippingTabProps) {
  const activeRule =
    shippingRules?.find((r) => r.isDefault) ||
    shippingRules?.[0] ||
    {};

  // Pricing Model: "tiered" | "flat"
  const [shippingType, setShippingType] = useState<"tiered" | "flat">(
    activeRule?.shippingType || "tiered"
  );

  // Flat Rate
  const [flatCharge, setFlatCharge] = useState<number>(
    activeRule?.flatCharge !== undefined ? activeRule.flatCharge : 65
  );

  // Tiered Rates
  const [localCharge, setLocalCharge] = useState<number>(
    activeRule?.localCharge !== undefined ? activeRule.localCharge : 35
  );
  const [circleCharge, setCircleCharge] = useState<number>(
    activeRule?.circleCharge !== undefined ? activeRule.circleCharge : 47
  );
  const [nationalCharge, setNationalCharge] = useState<number>(
    activeRule?.nationalCharge !== undefined ? activeRule.nationalCharge : 65
  );
  const [specialCharge, setSpecialCharge] = useState<number>(
    activeRule?.specialCharge !== undefined ? activeRule.specialCharge : 85
  );

  // Free Shipping Threshold
  const [freeShippingEnabled, setFreeShippingEnabled] = useState<boolean>(
    activeRule?.freeShippingAbove !== null && activeRule?.freeShippingAbove !== 0
  );
  const [freeShippingAbove, setFreeShippingAbove] = useState<number>(
    activeRule?.freeShippingAbove !== undefined && activeRule?.freeShippingAbove !== null
      ? activeRule.freeShippingAbove
      : 499
  );

  // Delivery Fee Waiver (Show standard charge but waive off completely)
  const [waiveShipping, setWaiveShipping] = useState<boolean>(
    Boolean(activeRule?.waiveShipping)
  );
  const [waiveLabel, setWaiveLabel] = useState<string>(
    activeRule?.waiveLabel || "100% Delivery Fee Waived"
  );

  // COD Settings
  const [codAvailable, setCodAvailable] = useState<boolean>(
    activeRule?.codAvailable !== false
  );
  const [codCharge, setCodCharge] = useState<number>(
    activeRule?.codCharge !== undefined ? activeRule.codCharge : 30
  );

  // SLA Days
  const [minDays, setMinDays] = useState<number>(
    activeRule?.minDays !== undefined ? activeRule.minDays : 3
  );
  const [maxDays, setMaxDays] = useState<number>(
    activeRule?.maxDays !== undefined ? activeRule.maxDays : 5
  );

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Interactive Simulator
  const [testPin, setTestPin] = useState("110001");
  const [testCartTotal, setTestCartTotal] = useState(399);

  // Sync state when incoming prop changes
  useEffect(() => {
    if (activeRule && Object.keys(activeRule).length > 0) {
      if (activeRule.shippingType) setShippingType(activeRule.shippingType);
      if (activeRule.flatCharge !== undefined) setFlatCharge(activeRule.flatCharge);
      if (activeRule.localCharge !== undefined) setLocalCharge(activeRule.localCharge);
      if (activeRule.circleCharge !== undefined) setCircleCharge(activeRule.circleCharge);
      if (activeRule.nationalCharge !== undefined) setNationalCharge(activeRule.nationalCharge);
      if (activeRule.specialCharge !== undefined) setSpecialCharge(activeRule.specialCharge);
      if (activeRule.freeShippingAbove !== undefined) {
        setFreeShippingEnabled(activeRule.freeShippingAbove !== null && activeRule.freeShippingAbove > 0);
        if (activeRule.freeShippingAbove !== null) {
          setFreeShippingAbove(activeRule.freeShippingAbove);
        }
      }
      if (activeRule.waiveShipping !== undefined) {
        setWaiveShipping(Boolean(activeRule.waiveShipping));
      }
      if (activeRule.waiveLabel !== undefined) {
        setWaiveLabel(activeRule.waiveLabel);
      }
      if (activeRule.codAvailable !== undefined) setCodAvailable(activeRule.codAvailable);
      if (activeRule.codCharge !== undefined) setCodCharge(activeRule.codCharge);
      if (activeRule.minDays !== undefined) setMinDays(activeRule.minDays);
      if (activeRule.maxDays !== undefined) setMaxDays(activeRule.maxDays);
    }
  }, [shippingRules]);

  // Simulator calculation
  const cleanSimPin = testPin.replace(/\D/g, "").slice(0, 6);
  const isSimLocal = cleanSimPin.startsWith("11");
  const isSimCircle =
    cleanSimPin.startsWith("12") ||
    cleanSimPin.startsWith("13") ||
    cleanSimPin.startsWith("14") ||
    cleanSimPin.startsWith("20") ||
    cleanSimPin.startsWith("25");
  const isSimSpecial =
    cleanSimPin.startsWith("78") || cleanSimPin.startsWith("79") || cleanSimPin.startsWith("19");

  const simTier = isSimLocal
    ? "Local (Tier 1)"
    : isSimCircle
    ? "Same Circle (Tier 2)"
    : isSimSpecial
    ? "Special / Remote (Tier 4)"
    : "National (Tier 3)";

  let simStandardPrice =
    shippingType === "flat"
      ? flatCharge
      : isSimLocal
      ? localCharge
      : isSimCircle
      ? circleCharge
      : isSimSpecial
      ? specialCharge
      : nationalCharge;

  const simIsFree = waiveShipping || (freeShippingEnabled && testCartTotal >= freeShippingAbove);
  const simFinalCharge = simIsFree ? 0 : simStandardPrice;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await ensureAdminToken();

      const payload: any = {
        _id: activeRule?._id,
        name: "India Post Speed Post Standard",
        description: "Official domestic express air & surface tier pricing",
        isDefault: true,
        isActive: true,
        shippingType,
        flatCharge: Number(flatCharge) || 0,
        standardCharge: Number(nationalCharge) || Number(flatCharge) || 65,
        localCharge: Number(localCharge) || 0,
        circleCharge: Number(circleCharge) || 0,
        nationalCharge: Number(nationalCharge) || 0,
        specialCharge: Number(specialCharge) || 0,
        freeShippingAbove: freeShippingEnabled ? Number(freeShippingAbove) : null,
        waiveShipping: Boolean(waiveShipping),
        waiveLabel: waiveLabel.trim() || "100% Delivery Fee Waived",
        codAvailable,
        codCharge: Number(codCharge) || 0,
        minDays: Number(minDays) || 3,
        maxDays: Number(maxDays) || 5,
      };

      const saved = await saveAdminShippingConfig(payload);
      try {
        localStorage.setItem("pollen_shipping_config", JSON.stringify(saved || payload));
        window.dispatchEvent(new CustomEvent("shipping-config-updated", { detail: saved || payload }));
      } catch {}
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save shipping rates");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (!window.confirm("Reset all shipping charges back to India Post default standard tariffs?")) {
      return;
    }
    setShippingType("tiered");
    setFlatCharge(65);
    setLocalCharge(35);
    setCircleCharge(47);
    setNationalCharge(65);
    setSpecialCharge(85);
    setFreeShippingEnabled(true);
    setFreeShippingAbove(499);
    setWaiveShipping(false);
    setWaiveLabel("100% Delivery Fee Waived");
    setCodAvailable(true);
    setCodCharge(30);
    setMinDays(3);
    setMaxDays(5);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-r from-red-950/40 via-neutral-900/60 to-neutral-900/40 p-6 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white font-black text-sm shadow-[0_4px_20px_rgba(220,38,38,0.35)] shrink-0">
            IP
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white tracking-tight">
                India Post Speed Post Shipping Rates
              </h2>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Rates Active
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Customize dynamic shipping tariffs, flat rate rules, and free delivery thresholds across India.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <a
            href="https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-700 bg-neutral-800/80 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-700 transition-colors"
          >
            <span>Official Portal</span>
            <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
          </a>
        </div>
      </div>

      {/* Pricing Model Selector */}
      <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Pricing Structure
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">Select Delivery Pricing Model</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Choose whether charges depend on postal distance tiers or a single flat rate across India.
            </p>
          </div>

          <div className="flex items-center p-1 rounded-xl bg-neutral-950 border border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={() => setShippingType("tiered")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                shippingType === "tiered"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Dynamic Postal Tiers
            </button>
            <button
              type="button"
              onClick={() => setShippingType("flat")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                shippingType === "flat"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Fixed Flat Rate
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Inputs */}
      {shippingType === "tiered" ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Speed Post Domestic Distance Tiers
            </h3>
            <span className="text-xs text-neutral-400">Parcel weight up to 500g</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tier 1 */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Tier 1 · Local
                  </span>
                  <span className="text-[11px] font-bold text-neutral-400 font-mono">1-2 Days</span>
                </div>
                <h4 className="text-sm font-bold text-white">Intra-City / District</h4>
                <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                  Same city / postal district direct dispatch via local GPO.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Shipping Charge (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={localCharge}
                    onChange={(e) => setLocalCharge(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-8 pr-3 py-2 text-sm font-bold text-white font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                    Tier 2 · Same Circle
                  </span>
                  <span className="text-[11px] font-bold text-neutral-400 font-mono">2-3 Days</span>
                </div>
                <h4 className="text-sm font-bold text-white">State Postal Circle</h4>
                <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                  Neighboring districts and intra-state circle transit.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Shipping Charge (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={circleCharge}
                    onChange={(e) => setCircleCharge(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-8 pr-3 py-2 text-sm font-bold text-white font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Tier 3 · National
                  </span>
                  <span className="text-[11px] font-bold text-neutral-400 font-mono">3-5 Days</span>
                </div>
                <h4 className="text-sm font-bold text-white">Rest of India (Metro)</h4>
                <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                  Express Air transit via National Sorting Hubs (NSH).
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Shipping Charge (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={nationalCharge}
                    onChange={(e) => setNationalCharge(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-8 pr-3 py-2 text-sm font-bold text-white font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Tier 4 */}
            <div className="p-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm flex flex-col justify-between hover:border-neutral-700 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                    Tier 4 · Remote / NE
                  </span>
                  <span className="text-[11px] font-bold text-neutral-400 font-mono">5-7 Days</span>
                </div>
                <h4 className="text-sm font-bold text-white">North-East & Islands</h4>
                <p className="mt-1 text-xs text-neutral-400 leading-relaxed">
                  J&K, Ladakh, Assam, Meghalaya, Andaman & Nicobar.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800">
                <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                  Shipping Charge (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={specialCharge}
                    onChange={(e) => setSpecialCharge(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-8 pr-3 py-2 text-sm font-bold text-white font-mono focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Flat Rate Mode Card */
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Flat Pan-India Shipping Fee</h3>
              <p className="text-xs text-neutral-400">
                A single fixed shipping cost will be charged to all orders regardless of destination PIN code.
              </p>
            </div>
          </div>

          <div className="max-w-xs pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-300 block mb-2">
              Fixed Delivery Charge (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-base font-bold">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={flatCharge}
                onChange={(e) => setFlatCharge(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-9 pr-4 py-2.5 text-base font-bold text-white font-mono focus:border-amber-400 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5">
              Set to ₹0 for completely free shipping on every order.
            </p>
          </div>
        </div>
      )}

      {/* Free Shipping & COD Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free Shipping Threshold */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Free Delivery Threshold</h3>
                <p className="text-xs text-neutral-400">Complimentary Speed Post on qualifying orders</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={freeShippingEnabled}
                onChange={(e) => setFreeShippingEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            When enabled, domestic orders with a subtotal equal to or exceeding this threshold will automatically receive{" "}
            <span className="text-emerald-400 font-semibold">100% Free Shipping</span> during checkout.
          </p>

          {freeShippingEnabled && (
            <div className="pt-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Minimum Cart Total for Free Delivery (₹)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={freeShippingAbove}
                  onChange={(e) => setFreeShippingAbove(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-8 pr-3 py-2 text-sm font-bold text-white font-mono focus:border-emerald-400 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Cash on Delivery (COD) */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Cash on Delivery (COD)</h3>
                <p className="text-xs text-neutral-400">Postal verification and handling fee</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={codAvailable}
                onChange={(e) => setCodAvailable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          <p className="text-xs text-neutral-300 leading-relaxed">
            Allow customers to pay upon delivery at their doorstep. You can specify an optional convenience surcharge for COD orders.
          </p>

          {codAvailable && (
            <div className="pt-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Additional COD Handling Fee (₹)
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={codCharge}
                  onChange={(e) => setCodCharge(Math.max(0, Number(e.target.value)))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-8 pr-3 py-2 text-sm font-bold text-white font-mono focus:border-amber-400 focus:outline-hidden"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Automatic Delivery Fee Waiver (Show standard charge but waive off completely) */}
      <div
        className={`p-6 rounded-2xl border transition-all ${
          waiveShipping
            ? "border-emerald-500/50 bg-gradient-to-r from-emerald-950/30 via-neutral-900/60 to-neutral-900/40 shadow-[0_0_30px_rgba(16,185,129,0.12)]"
            : "border-neutral-800 bg-neutral-900/40 backdrop-blur-sm"
        } space-y-4`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                waiveShipping
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-neutral-800 text-neutral-400 border-neutral-700"
              }`}
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  Automatic Delivery Fee Waiver (100% Free Shipping Promotion)
                </h3>
                {waiveShipping ? (
                  <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Waiver Active on Storefront
                  </span>
                ) : (
                  <span className="rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Disabled
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                Show buyers their real calculated delivery charge (e.g. ₹65 or distance tiered rate), but{" "}
                <strong className="text-white font-semibold">strike it through as ~~₹65~~ FREE</strong> and waive it off automatically. Customers pay ₹0 for delivery while seeing the full value they save!
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={waiveShipping}
              onChange={(e) => setWaiveShipping(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-neutral-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {waiveShipping && (
          <div className="pt-3 border-t border-neutral-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
                Custom Waiver Tag / Badge Text
              </label>
              <input
                type="text"
                value={waiveLabel}
                onChange={(e) => setWaiveLabel(e.target.value)}
                placeholder="e.g. 100% Delivery Fee Waived"
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white focus:border-emerald-400 focus:outline-hidden"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                This tag appears directly beside the crossed-out fee at checkout.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-emerald-500/25 bg-emerald-950/20 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                Storefront Customer Checkout Preview
              </span>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Speed Post Express:</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span className="text-neutral-500 line-through text-xs font-mono">₹65</span>
                  <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">FREE</span>
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/30 uppercase">
                    {waiveLabel || "Waived Off"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Calculator / Simulator */}
      <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-xs">
              ⚡
            </span>
            <div>
              <h3 className="font-bold text-white text-sm">Live Checkout Rate Preview</h3>
              <p className="text-xs text-neutral-400">
                Simulate what buyers see at checkout with your currently configured rates.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* PIN Input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Test PIN Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={testPin}
              onChange={(e) => setTestPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm font-mono text-white focus:border-amber-400 focus:outline-hidden"
              placeholder="e.g. 110001"
            />
            {/* Quick PIN Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                { label: "Delhi (Local)", pin: "110001" },
                { label: "Noida (Circle)", pin: "201301" },
                { label: "Mumbai (National)", pin: "400001" },
                { label: "Guwahati (Remote)", pin: "781001" },
              ].map((p) => (
                <button
                  key={p.pin}
                  type="button"
                  onClick={() => setTestPin(p.pin)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cart Total Input */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1.5">
              Test Order Subtotal (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-sm">
                ₹
              </span>
              <input
                type="number"
                min="0"
                value={testCartTotal}
                onChange={(e) => setTestCartTotal(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-950 pl-8 pr-3 py-2 text-sm font-mono text-white focus:border-amber-400 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Output Card */}
          <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Postal Zone:</span>
              <span className="font-bold text-amber-400 font-mono">{simTier}</span>
            </div>
            <div className="flex items-baseline justify-between mt-2 pt-2 border-t border-neutral-800/80">
              <span className="text-xs text-neutral-400">Shipping Charged:</span>
              <div className="text-right">
                {simIsFree ? (
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <span className="text-xs text-neutral-500 line-through font-mono">
                      ₹{simStandardPrice}
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      FREE (₹0)
                    </span>
                    {waiveShipping && (
                      <span className="rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold uppercase">
                        {waiveLabel || "Waived"}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-base font-bold text-white font-mono">
                    ₹{simFinalCharge}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="sticky bottom-6 z-30 p-4 rounded-2xl border border-neutral-700 bg-neutral-900/90 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-white">Save Changes to Storefront</p>
          <p className="text-[11px] text-neutral-400">
            Updated shipping prices take effect immediately for customer checkout.
          </p>
          {saveError && <p className="text-xs text-red-400 mt-1">{saveError}</p>}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Saved successfully!
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-neutral-200 active:scale-95 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Shipping Rates</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
