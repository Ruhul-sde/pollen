import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  Key,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { AdminAccount, createAdminAccount, updateAdminAccount } from "../../../../app/api";

interface CreateAdminModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (admin: AdminAccount, isEdit: boolean) => void;
  adminToEdit?: AdminAccount | null;
  currentAdminEmail?: string;
}

const AVAILABLE_MODULES = [
  { id: "orders", label: "Orders & Shipments", desc: "View and update customer orders, fulfillment & tracking" },
  { id: "products", label: "Products & Fragrances", desc: "Manage fragrance catalog, stock counts and volume variants" },
  { id: "customers", label: "Customer Insights", desc: "Access customer profiles, active carts & order histories" },
  { id: "coupons", label: "Coupons & Discounts", desc: "Create, edit and publish promotional discount coupons" },
  { id: "shipping", label: "Shipping & India Post", desc: "Configure Speed Post rates, waivers and free thresholds" },
  { id: "reviews", label: "Customer Reviews", desc: "Approve, moderate and respond to verified fragrance reviews" },
  { id: "returns", label: "Returns & Refunds", desc: "Process return requests and initiate Razorpay refunds" },
  { id: "settings", label: "Storefront Settings", desc: "Manage store branding, theme banners and policies" },
  { id: "newsletter", label: "Newsletter Subscribers", desc: "View subscriber emails and marketing reach" },
  { id: "audit", label: "Security & Audit Trails", desc: "Inspect administrative actions and timestamp logs" },
  { id: "admins", label: "Admin Team Management", desc: "Create and control other administrator accounts" },
];

export function CreateAdminModal({
  open,
  onClose,
  onSuccess,
  adminToEdit,
  currentAdminEmail,
}: CreateAdminModalProps) {
  const isEdit = Boolean(adminToEdit);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [allPermissions, setAllPermissions] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (adminToEdit) {
      setName(adminToEdit.name || "");
      setEmail(adminToEdit.email || "");
      setPassword("");
      setPhone(adminToEdit.phone || "");
      setRole((adminToEdit.role === "superadmin" ? "superadmin" : "admin") as any);
      setIsActive(adminToEdit.isActive !== false);

      const perms = adminToEdit.permissions || ["all"];
      if (perms.includes("all")) {
        setAllPermissions(true);
        setSelectedPermissions([]);
      } else {
        setAllPermissions(false);
        setSelectedPermissions(perms);
      }
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setRole("admin");
      setAllPermissions(true);
      setSelectedPermissions([]);
      setIsActive(true);
    }
    setError(null);
    setShowPassword(false);
    setCopiedCredentials(false);
  }, [adminToEdit, open]);

  if (!open) return null;

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    const special = "@#$!%*";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pwd += special.charAt(Math.floor(Math.random() * special.length));
    for (let i = 0; i < 3; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
    setShowPassword(true);
  };

  const handleCopyCredentials = () => {
    const text = `Pollen Admin Credentials:\nEmail: ${email.trim()}\nPassword: ${password}\nRole: ${role.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  const togglePermission = (id: string) => {
    if (selectedPermissions.includes(id)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== id));
    } else {
      setSelectedPermissions([...selectedPermissions, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter the administrator's full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid official email address.");
      return;
    }
    if (!isEdit && (!password || password.length < 6)) {
      setError("Password is required and must be at least 6 characters.");
      return;
    }
    if (isEdit && password && password.length < 6) {
      setError("If changing password, it must be at least 6 characters.");
      return;
    }

    const permissions = allPermissions ? ["all"] : selectedPermissions;

    setLoading(true);
    try {
      if (isEdit && adminToEdit) {
        const payload: any = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          role,
          permissions,
          isActive,
        };
        if (password.trim()) {
          payload.password = password.trim();
        }
        const updated = await updateAdminAccount(adminToEdit._id || (adminToEdit as any).id, payload);
        onSuccess(updated, true);
        onClose();
      } else {
        const payload = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          phone: phone.trim() || undefined,
          role,
          permissions,
          isActive,
        };
        const created = await createAdminAccount(payload);
        onSuccess(created, false);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save administrator account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 text-white shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 px-6 py-4 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEdit ? "Edit Administrator Details" : "Create New Administrator"}
              </h2>
              <p className="text-xs text-neutral-400">
                {isEdit
                  ? "Update login credentials, roles and module permissions"
                  : "Provision an authorized staff or management account with custom access"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Section 1: Basic Identity */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Identity & Contact Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Hammam Bin Asraful"
                    required
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Official Email Address <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. manager@pollen.com"
                    required
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Phone Number <span className="text-neutral-500">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-2.5 pl-9 pr-3 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Account Status
                </label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActive ? "bg-emerald-500" : "bg-neutral-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        isActive ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-semibold ${isActive ? "text-emerald-400" : "text-neutral-400"}`}>
                    {isActive ? "Active (Can log in)" : "Suspended (Login blocked)"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Password & Authentication */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Authentication & Login Password</span>
              </h3>
              <button
                type="button"
                onClick={generateStrongPassword}
                className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
              >
                <Sparkles className="h-3 w-3" />
                <span>Auto-Generate Secure Password</span>
              </button>
            </div>

            <div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    isEdit
                      ? "Leave blank to keep existing password unchanged"
                      : "Enter at least 6 characters"
                  }
                  required={!isEdit}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-2.5 pl-9 pr-20 text-xs text-white placeholder-neutral-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {password && (
                <div className="mt-2 flex items-center justify-between text-[11px] bg-neutral-900/90 rounded-lg p-2 border border-neutral-800">
                  <span className="text-neutral-400 font-mono">
                    Password ready: <span className="text-white font-bold">{showPassword ? password : "••••••••••••"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    {copiedCredentials ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCredentials ? "Copied!" : "Copy Details"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Role & Authority */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>Administrative Role & Authority</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setRole("admin")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  role === "admin"
                    ? "border-amber-400/80 bg-amber-400/10 shadow-[0_0_15px_rgba(251,191,36,0.1)]"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="text-xs font-bold text-white">Store Admin (Manager)</span>
                  </div>
                  {role === "admin" && <CheckCircle2 className="h-4 w-4 text-amber-400" />}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Operational access to manage orders, catalog, coupons, and fulfillment. Cannot delete the store or primary admin.
                </p>
              </div>

              <div
                onClick={() => setRole("superadmin")}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  role === "superadmin"
                    ? "border-purple-400/80 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]"
                    : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-purple-400" />
                    <span className="text-xs font-bold text-white">Super Administrator</span>
                  </div>
                  {role === "superadmin" && <CheckCircle2 className="h-4 w-4 text-purple-400" />}
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Full master access including creating and removing other admins, audit log analysis, and system settings.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Granular Permissions */}
          <div className="space-y-3 pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90">
                Module Access Permissions
              </h3>
              <label className="flex items-center gap-2 text-xs font-semibold text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={allPermissions}
                  onChange={(e) => setAllPermissions(e.target.checked)}
                  className="rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-amber-400"
                />
                <span className={allPermissions ? "text-amber-400" : "text-neutral-400"}>
                  Full Store Access (All Modules)
                </span>
              </label>
            </div>

            {!allPermissions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {AVAILABLE_MODULES.map((mod) => {
                  const isChecked = selectedPermissions.includes(mod.id);
                  return (
                    <label
                      key={mod.id}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                        isChecked
                          ? "border-amber-400/40 bg-amber-400/5"
                          : "border-neutral-800/80 bg-neutral-900/30 hover:border-neutral-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePermission(mod.id)}
                        className="mt-0.5 rounded border-neutral-700 bg-neutral-900 text-amber-400 focus:ring-amber-400"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block">{mod.label}</span>
                        <span className="text-[10px] text-neutral-400 block truncate">{mod.desc}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-amber-300 shadow-[0_4px_16px_rgba(212,175,55,0.25)] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isEdit ? "Update Administrator" : "Create Administrator"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
