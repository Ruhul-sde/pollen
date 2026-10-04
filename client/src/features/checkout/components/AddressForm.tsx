import React, { useState, FormEvent, useEffect } from "react";
import { AlertCircle, CheckCircle2, Loader2, MapPin, Building, Navigation } from "lucide-react";
import { lookupPincode } from "@/app/api";

export interface AddressFormData {
  label: "Home" | "Work";
  full_name: string;
  phone: string;
  address_line1: string;
  post_office: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface AddressFormProps {
  initialData?: Partial<AddressFormData>;
  onSubmit: (data: AddressFormData) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
  className?: string;
}

const fieldClass =
  "w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3.5 py-2.5 text-xs text-neutral-900 dark:text-white outline-hidden focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black/10 dark:focus:ring-white/10 transition-colors placeholder:text-neutral-400";

export function AddressForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save Address",
  loading = false,
  className = "",
}: AddressFormProps) {
  const [addressType, setAddressType] = useState<"Home" | "Work">(
    initialData?.label === "Work" ? "Work" : "Home"
  );
  const [form, setForm] = useState<AddressFormData>({
    label: initialData?.label === "Work" ? "Work" : "Home",
    full_name: initialData?.full_name || "",
    phone: initialData?.phone || "",
    address_line1: initialData?.address_line1 || "",
    post_office: initialData?.post_office || "",
    landmark: initialData?.landmark || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    postal_code: initialData?.postal_code || "",
    country: initialData?.country || "India",
  });

  const [pinLoading, setPinLoading] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [availablePostOffices, setAvailablePostOffices] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const updateField = (field: keyof AddressFormData, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    if (error) setError("");
  };

  const handlePincodeChange = async (pinRaw: string) => {
    const cleanPin = pinRaw.replace(/\D/g, "").slice(0, 6);
    updateField("postal_code", cleanPin);

    if (cleanPin.length === 6) {
      setPinLoading(true);
      setError("");
      try {
        const res = await lookupPincode(cleanPin);
        if (res) {
          const autoCity = res.district || res.city || "";
          const autoState = res.state || "";
          const poList = res.postOffices || [];

          setAvailablePostOffices(poList);

          setForm((prev) => ({
            ...prev,
            postal_code: cleanPin,
            city: autoCity || prev.city,
            state: autoState || prev.state,
            post_office: prev.post_office || poList[0] || "",
          }));

          setDetectedLocation(`${autoCity}, ${autoState}`);
        } else {
          setDetectedLocation(null);
          setAvailablePostOffices([]);
        }
      } catch {
        setDetectedLocation(null);
        setAvailablePostOffices([]);
      } finally {
        setPinLoading(false);
      }
    } else {
      setDetectedLocation(null);
      setAvailablePostOffices([]);
    }
  };

  // Synchronize form when initialData changes (e.g. when editing a specific address)
  useEffect(() => {
    const nextType = initialData?.label === "Work" ? "Work" : "Home";
    setAddressType(nextType);
    setForm({
      label: nextType,
      full_name: initialData?.full_name || "",
      phone: initialData?.phone || "",
      address_line1: initialData?.address_line1 || "",
      post_office: initialData?.post_office || "",
      landmark: initialData?.landmark || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      postal_code: initialData?.postal_code || "",
      country: initialData?.country || "India",
    });

    const pin = (initialData?.postal_code || "").replace(/\D/g, "").slice(0, 6);
    if (pin.length === 6) {
      lookupPincode(pin)
        .then((res) => {
          if (res) {
            setAvailablePostOffices(res.postOffices || []);
            const autoCity = res.district || res.city || "";
            const autoState = res.state || "";
            setDetectedLocation(`${autoCity}, ${autoState}`);
          }
        })
        .catch(() => {});
    } else {
      setDetectedLocation(null);
      setAvailablePostOffices([]);
    }
    setError("");
  }, [
    initialData?.full_name,
    initialData?.phone,
    initialData?.address_line1,
    initialData?.post_office,
    initialData?.landmark,
    initialData?.city,
    initialData?.state,
    initialData?.postal_code,
    initialData?.label,
  ]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!form.full_name.trim()) {
      setError("Please enter the full recipient name.");
      return;
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const pinDigits = form.postal_code.replace(/\D/g, "");
    if (pinDigits.length !== 6) {
      setError("Please enter a valid 6-digit postal PIN code.");
      return;
    }

    if (!form.address_line1.trim()) {
      setError("Please enter your flat, house number, or building address.");
      return;
    }

    if (!form.city.trim() || !form.state.trim()) {
      setError("Please specify the delivery city and state.");
      return;
    }

    await onSubmit({
      ...form,
      label: addressType,
      phone: phoneDigits,
      postal_code: pinDigits,
      landmark: form.landmark?.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {/* Address Type Selector */}
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-1.5">
          Address Type
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(["Home", "Work"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setAddressType(type);
                updateField("label", type);
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide border transition-all cursor-pointer flex items-center justify-center text-center ${
                addressType === type
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-2xs"
                  : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/60"
              }`}
            >
              {type === "Home" ? "🏠 Home (All Day Delivery)" : "🏢 Work (10 AM - 6 PM)"}
            </button>
          ))}
        </div>
      </div>

      {/* Recipient Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
            Full Name *
          </label>
          <input
            required
            type="text"
            value={form.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            className={fieldClass}
            placeholder="Receiver's full name"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
            10-Digit Mobile Number *
          </label>
          <input
            required
            type="tel"
            maxLength={10}
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, ""))}
            className={fieldClass}
            placeholder="10-digit mobile number"
          />
        </div>
      </div>

      {/* Postal PIN Code with Immediate Data Fetch */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
            Postal PIN Code *
          </label>
          <span className="text-[10px] text-neutral-400">
            Auto-fetches City, State & Post Offices
          </span>
        </div>
        <div className="relative">
          <input
            required
            type="text"
            maxLength={6}
            value={form.postal_code}
            onChange={(e) => handlePincodeChange(e.target.value)}
            className={`${fieldClass} font-mono`}
            placeholder="Enter 6-Digit PIN Code (e.g. 110001, 700001, 560001)"
          />
          {pinLoading && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
              <Loader2 size={12} className="animate-spin" />
              <span>Fetching postal data...</span>
            </div>
          )}
        </div>

        {/* Auto-detected Confirmation Banner */}
        {detectedLocation && (
          <div className="mt-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="text-[11px] leading-tight">
              <span>
                Verified Postal Area: <strong>{detectedLocation}</strong>
              </span>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                India Post Speed Post EMS delivery is active for this PIN code.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Street Address Line 1 */}
      <div>
        <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
          Flat, House no., Building, Company, Apartment *
        </label>
        <input
          required
          type="text"
          value={form.address_line1}
          onChange={(e) => updateField("address_line1", e.target.value)}
          className={fieldClass}
          placeholder="e.g. Flat 402, Royale Palms, 14th Cross"
        />
      </div>

      {/* Area / Locality / Post Office (with auto-suggest selector if available) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
            Area, Street, Sector, Locality / Post Office
          </label>
          {availablePostOffices.length > 0 && (
            <span className="text-[10px] text-neutral-500">
              {availablePostOffices.length} areas found
            </span>
          )}
        </div>

        <input
          type="text"
          value={form.post_office}
          onChange={(e) => updateField("post_office", e.target.value)}
          className={fieldClass}
          placeholder="e.g. Indiranagar / Sector 4 / Local Post Office"
        />

        {/* Quick-Pick Chips for Local Post Offices from PIN Lookup */}
        {availablePostOffices.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-semibold text-neutral-400">Quick Select:</span>
            {availablePostOffices.slice(0, 5).map((po) => (
              <button
                key={po}
                type="button"
                onClick={() => updateField("post_office", po)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  form.post_office === po
                    ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white font-bold"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {po}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Landmark (Optional) - User Explicit Request */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
            <Navigation size={11} className="text-amber-500 shrink-0" />
            <span>Landmark (Optional)</span>
          </label>
          <span className="text-[10px] text-neutral-400 font-normal">
            Helps delivery executive locate you
          </span>
        </div>
        <input
          type="text"
          value={form.landmark || ""}
          onChange={(e) => updateField("landmark", e.target.value)}
          className={fieldClass}
          placeholder="e.g. Near Metro Station Pillar 42, Opposite Apollo Pharmacy, Beside State Bank"
        />
      </div>

      {/* City & State (Auto-filled from PIN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
            City / District *
          </label>
          <input
            required
            type="text"
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            className={fieldClass}
            placeholder="City"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
            State *
          </label>
          <input
            required
            type="text"
            value={form.state}
            onChange={(e) => updateField("state", e.target.value)}
            className={fieldClass}
            placeholder="State"
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-50 dark:bg-red-950/20 p-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Action Buttons */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto rounded-xl border border-neutral-300 dark:border-neutral-700 px-4 py-2.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-sm disabled:opacity-50 text-center"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Saving Address...</span>
            </>
          ) : (
            <span>{submitLabel}</span>
          )}
        </button>
      </div>
    </form>
  );
}
