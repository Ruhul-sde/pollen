import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Bell,
  Check,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Eye,
  Facebook,
  Gift,
  Globe,
  HelpCircle,
  Instagram,
  Laptop,
  Layers,
  Layout,
  Mail,
  MessageSquare,
  Moon,
  Palette,
  Phone,
  Power,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sliders,
  Sparkles,
  Sun,
  Tag,
  Truck,
  User,
  Zap,
  FileText,
  Scale,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  BookOpen,
} from "lucide-react";
import { useTenantConfig } from "@/config/tenantContext";
import {
  FeatureConfig,
  TenantConfig,
  UserThemeConfig,
  AdminThemeConfig,
  PoliciesConfig,
  PolicyDocument,
  PolicySectionItem,
  DEFAULT_POLICIES,
  DEFAULT_ABOUT_STORY,
} from "@/config/tenantConfig";

interface SettingsTabProps {
  onShowToast?: (msg: string) => void;
}

type SettingsSection = "features" | "theme" | "branding" | "navigation" | "policies";
type ThemeSubOption = "admin" | "user";

interface FeatureMeta {
  key: keyof FeatureConfig;
  name: string;
  description: string;
  category: "Storefront" | "Checkout & Orders" | "Customer Engagement" | "Logistics";
  icon: React.ElementType;
  impact: string;
}

const ALL_FEATURES: FeatureMeta[] = [
  {
    key: "giftSet",
    name: "Luxury Discovery Gift Set",
    description: "Showcase the curated 3-piece parfum gift set across homepage, navigation menu, and promotional drawers.",
    category: "Storefront",
    icon: Gift,
    impact: "Controls /gift-set route and bundle purchase promotions",
  },
  {
    key: "coupons",
    name: "Promotional Coupons & Discounts",
    description: "Allow customers to apply promo codes, view available discount offers, and claim percentage/flat savings at checkout.",
    category: "Checkout & Orders",
    icon: Tag,
    impact: "Enables coupon input and discount drawer during checkout",
  },
  {
    key: "orderTracking",
    name: "Speed Post Live Order Tracking",
    description: "Provide India Post Speed Post consignment tracking directly on the homepage and track order modal.",
    category: "Logistics",
    icon: Truck,
    impact: "Shows live EMS tracking banner & tracking lookups",
  },
  {
    key: "dynamicPricing",
    name: "Dynamic Speed Post Tariffs",
    description: "Automatically calculate exact PIN code delivery tariffs and estimated days based on postal distance across India.",
    category: "Logistics",
    icon: Zap,
    impact: "Calculates real-time delivery timelines & shipping charges",
  },
  {
    key: "savedAddresses",
    name: "Customer Address Book",
    description: "Enable customers to save multiple delivery addresses, auto-detect city/state from 6-digit PIN codes, and switch addresses.",
    category: "Checkout & Orders",
    icon: Globe,
    impact: "Powers saved address selection in checkout flow",
  },
  {
    key: "reviews",
    name: "Customer Reviews & Star Ratings",
    description: "Display verified buyer testimonials, star ratings, and review submission forms for each fragrance.",
    category: "Customer Engagement",
    icon: MessageSquare,
    impact: "Enables social proof ratings & customer reviews on catalog",
  },
  {
    key: "returns",
    name: "Returns & Exchanges Portal",
    description: "Allow customers to request replacements or refunds for eligible orders from their order history within the policy window.",
    category: "Customer Engagement",
    icon: RotateCcw,
    impact: "Activates return requests in Customer Orders tab",
  },
  {
    key: "newsletter",
    name: "Newsletter Email Capture",
    description: "Display newsletter subscription box in the footer offering exclusive private access and sample invitations.",
    category: "Customer Engagement",
    icon: Mail,
    impact: "Collects customer emails for marketing campaigns",
  },
  {
    key: "socialProof",
    name: "Luxury Trust Badges & Social Proof",
    description: "Highlight artisanal craftsmanship badges, India Post EMS express indicators, and secure Razorpay payment badges.",
    category: "Storefront",
    icon: ShieldCheck,
    impact: "Displays verified luxury trust indicators and banners",
  },
  {
    key: "adminDashboard",
    name: "Admin Dashboard Entry Points",
    description: "Display quick admin access links in the top navigation and footer when authorized administrative users log in.",
    category: "Storefront",
    icon: Shield,
    impact: "Controls admin navigation buttons across the interface",
  },
];

const ADMIN_PALETTES = [
  { name: "Signature Amber Gold", hex: "#f59e0b", preview: "bg-amber-500" },
  { name: "Emerald Luxe", hex: "#10b981", preview: "bg-emerald-500" },
  { name: "Sapphire Electric", hex: "#3b82f6", preview: "bg-blue-500" },
  { name: "Royal Violet", hex: "#8b5cf6", preview: "bg-violet-500" },
  { name: "Crimson Rose", hex: "#f43f5e", preview: "bg-rose-500" },
  { name: "Titanium Slate", hex: "#64748b", preview: "bg-slate-500" },
];

const USER_PALETTES = [
  { name: "Signature Amber Gold", hex: "#f59e0b", preview: "bg-amber-500" },
  { name: "Royal Rose Gold", hex: "#e0a96d", preview: "bg-[#e0a96d]" },
  { name: "Obsidian Noir", hex: "#0a0a0a", preview: "bg-neutral-950" },
  { name: "Emerald Parfumerie", hex: "#059669", preview: "bg-emerald-600" },
  { name: "Royal Amethyst", hex: "#7c3aed", preview: "bg-violet-600" },
  { name: "Sunset Crimson", hex: "#e11d48", preview: "bg-rose-600" },
  { name: "Champagne Silver", hex: "#71717a", preview: "bg-zinc-500" },
];

export function SettingsTab({ onShowToast }: SettingsTabProps) {
  const { config, updateConfig, resetConfigToDefaults, saveConfigToServer } = useTenantConfig();

  const [activeSection, setActiveSection] = useState<SettingsSection>("features");
  const [themeSubOption, setThemeSubOption] = useState<ThemeSubOption>("admin");
  const [featureSearch, setFeatureSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Local draft state for editing
  const [draftFeatures, setDraftFeatures] = useState<FeatureConfig>({ ...config.features });
  
  // 1. User Theme Draft
  const [draftUserTheme, setDraftUserTheme] = useState<UserThemeConfig>({
    accentColor: config.theme?.accentColor || "#f59e0b",
    primaryColor: config.theme?.primaryColor || "#000000",
    mode: config.theme?.mode || "light",
    bannerEnabled: config.theme?.bannerEnabled !== false,
    bannerText: config.theme?.bannerText || "Complimentary India Post Speed Post on orders above ₹499 · Pure Extrait de Parfum",
  });

  // 2. Admin Theme Draft
  const [draftAdminTheme, setDraftAdminTheme] = useState<AdminThemeConfig>({
    mode: config.adminTheme?.mode || "dark",
    accentColor: config.adminTheme?.accentColor || "#f59e0b",
    sidebarStyle: config.adminTheme?.sidebarStyle || "solid",
  });

  const [draftBranding, setDraftBranding] = useState({ ...config.branding });
  const [draftNavigation, setDraftNavigation] = useState({
    showCollectionLink: config.navigation?.showCollectionLink !== false,
    showGiftSetLink: config.navigation?.showGiftSetLink !== false,
    showAboutLink: config.navigation?.showAboutLink !== false,
  });

  // 3. Dynamic Policies Draft
  const [draftPolicies, setDraftPolicies] = useState<PoliciesConfig>(() => config.policies || DEFAULT_POLICIES);
  const [activePolicyKey, setActivePolicyKey] = useState<keyof PoliciesConfig>("terms");

  useEffect(() => {
    if (config.policies) {
      setDraftPolicies(config.policies);
    }
  }, [config.policies]);

  const handleUpdatePolicyMeta = (field: "title" | "lastUpdated" | "intro", value: string) => {
    setDraftPolicies((prev) => {
      const currentPolicy = prev[activePolicyKey] || DEFAULT_POLICIES[activePolicyKey];
      const updated = {
        ...prev,
        [activePolicyKey]: {
          ...currentPolicy,
          [field]: value,
        },
      };
      updateConfig({ policies: updated });
      return updated;
    });
  };

  const handleUpdateClause = (index: number, field: "heading" | "body", value: string) => {
    setDraftPolicies((prev) => {
      const currentPolicy = prev[activePolicyKey] || DEFAULT_POLICIES[activePolicyKey];
      const updatedSections = [...currentPolicy.sections];
      if (updatedSections[index]) {
        updatedSections[index] = {
          ...updatedSections[index],
          [field]: value,
        };
      }
      const updated = {
        ...prev,
        [activePolicyKey]: {
          ...currentPolicy,
          sections: updatedSections,
        },
      };
      updateConfig({ policies: updated });
      return updated;
    });
  };

  const handleAddClause = () => {
    setDraftPolicies((prev) => {
      const currentPolicy = prev[activePolicyKey] || DEFAULT_POLICIES[activePolicyKey];
      const newClause: PolicySectionItem = {
        id: `${activePolicyKey}-${Date.now()}`,
        heading: "New Policy Clause",
        body: "Enter policy terms, instructions, or conditions here...",
      };
      const updated = {
        ...prev,
        [activePolicyKey]: {
          ...currentPolicy,
          sections: [...currentPolicy.sections, newClause],
        },
      };
      updateConfig({ policies: updated });
      return updated;
    });
    onShowToast?.("New clause added. Remember to click 'Save Changes' to publish!");
  };

  const handleRemoveClause = (index: number) => {
    if (!window.confirm("Are you sure you want to delete this clause?")) return;
    setDraftPolicies((prev) => {
      const currentPolicy = prev[activePolicyKey] || DEFAULT_POLICIES[activePolicyKey];
      const updatedSections = currentPolicy.sections.filter((_, i) => i !== index);
      const updated = {
        ...prev,
        [activePolicyKey]: {
          ...currentPolicy,
          sections: updatedSections,
        },
      };
      updateConfig({ policies: updated });
      return updated;
    });
    onShowToast?.("Clause deleted");
  };

  const handleMoveClause = (index: number, direction: "up" | "down") => {
    setDraftPolicies((prev) => {
      const currentPolicy = prev[activePolicyKey] || DEFAULT_POLICIES[activePolicyKey];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= currentPolicy.sections.length) return prev;

      const newSections = [...currentPolicy.sections];
      const temp = newSections[index];
      newSections[index] = newSections[targetIndex];
      newSections[targetIndex] = temp;

      const updated = {
        ...prev,
        [activePolicyKey]: {
          ...currentPolicy,
          sections: newSections,
        },
      };
      updateConfig({ policies: updated });
      return updated;
    });
  };

  const handleResetPolicyToDefault = (key: keyof PoliciesConfig) => {
    if (window.confirm(`Reset "${DEFAULT_POLICIES[key].title}" to original defaults?`)) {
      setDraftPolicies((prev) => {
        const updated = {
          ...prev,
          [key]: DEFAULT_POLICIES[key],
        };
        updateConfig({ policies: updated });
        return updated;
      });
      onShowToast?.(`${DEFAULT_POLICIES[key].title} reset to defaults`);
    }
  };

  const handleResetAllPolicies = () => {
    if (window.confirm("Reset all 5 store legal policies to official document defaults?")) {
      setDraftPolicies(DEFAULT_POLICIES);
      updateConfig({ policies: DEFAULT_POLICIES });
      onShowToast?.("All policies reset to official document defaults!");
    }
  };

  const handleToggleFeature = (key: keyof FeatureConfig) => {
    setDraftFeatures((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      updateConfig({ features: next });
      return next;
    });
  };

  const handleToggleAllFeatures = (enable: boolean) => {
    const updated: FeatureConfig = {
      reviews: enable,
      returns: enable,
      coupons: enable,
      newsletter: enable,
      giftSet: enable,
      adminDashboard: true,
      savedAddresses: enable,
      dynamicPricing: enable,
      orderTracking: enable,
      socialProof: enable,
    };
    setDraftFeatures(updated);
    updateConfig({ features: updated });
    onShowToast?.(enable ? "All platform features enabled" : "Optional platform features disabled");
  };

  const handleUpdateUserTheme = (overrides: Partial<UserThemeConfig>) => {
    setDraftUserTheme((prev) => {
      const next = { ...prev, ...overrides };
      updateConfig({ theme: next });
      return next;
    });
  };

  const handleUpdateAdminTheme = (overrides: Partial<AdminThemeConfig>) => {
    setDraftAdminTheme((prev) => {
      const next = { ...prev, ...overrides };
      updateConfig({ adminTheme: next });
      return next;
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      const updatedConfig: Partial<TenantConfig> = {
        features: draftFeatures,
        theme: draftUserTheme,
        adminTheme: draftAdminTheme,
        branding: draftBranding,
        navigation: draftNavigation,
        policies: draftPolicies,
      };

      // Update in-memory & localStorage
      updateConfig(updatedConfig);

      // Persist to MongoDB backend
      await saveConfigToServer(updatedConfig);

      setSaveSuccess(true);
      onShowToast?.("Settings & policies saved successfully!");
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      onShowToast?.("Failed to save settings to server.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to defaults?")) {
      resetConfigToDefaults();
      setDraftFeatures({ ...config.features });
      setDraftUserTheme({ ...config.theme });
      setDraftAdminTheme({ ...config.adminTheme });
      setDraftPolicies(DEFAULT_POLICIES);
      onShowToast?.("Settings reset to defaults");
    }
  };

  const filteredFeatures = ALL_FEATURES.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(featureSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(featureSearch.toLowerCase()) ||
      f.key.toLowerCase().includes(featureSearch.toLowerCase());
    const matchesCat = selectedCategory === "all" || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const activeFeaturesCount = Object.values(draftFeatures).filter(Boolean).length;
  const isLight = (draftAdminTheme.mode || config.adminTheme?.mode) === "light";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Top Header & Master Action Bar */}
      <div className={`flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-6 ${
        isLight ? "border-slate-200" : "border-neutral-800/80"
      }`}>
        <div>
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: `${draftAdminTheme.accentColor}20`, borderColor: `${draftAdminTheme.accentColor}40`, color: draftAdminTheme.accentColor }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border"
            >
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h1 className={`text-xl font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
                Store Settings & Feature Controls
              </h1>
              <p className={`text-xs ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                Configure separate themes for Admin vs Users, brand identity, and dynamically toggle features
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isLight
                ? "text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs"
                : "text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 border border-neutral-800"
            }`}
            title="Reset all settings to original defaults"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            style={{
              backgroundColor: draftAdminTheme.accentColor || "#f59e0b",
              color: "#000000",
              boxShadow: `0 4px 16px ${draftAdminTheme.accentColor || "#f59e0b"}40`,
            }}
            className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className={`flex overflow-x-auto no-scrollbar gap-2 border-b pb-3 ${
        isLight ? "border-slate-200" : "border-neutral-800/80"
      }`}>
        <button
          type="button"
          onClick={() => setActiveSection("features")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeSection === "features"
              ? "shadow-sm"
              : isLight
              ? "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
              : "bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
          style={activeSection === "features" ? { backgroundColor: draftAdminTheme.accentColor, color: "#000" } : undefined}
        >
          <Power className="h-3.5 w-3.5" />
          <span>Feature Toggles</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
              activeSection === "features"
                ? "bg-black/20 text-black"
                : isLight
                ? "bg-slate-100 text-slate-600"
                : "bg-neutral-800 text-neutral-300"
            }`}
          >
            {activeFeaturesCount}/{ALL_FEATURES.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("theme")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeSection === "theme"
              ? "shadow-sm"
              : isLight
              ? "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
              : "bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
          style={activeSection === "theme" ? { backgroundColor: draftAdminTheme.accentColor, color: "#000" } : undefined}
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Themes (Admin & Users)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("branding")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeSection === "branding"
              ? "shadow-sm"
              : isLight
              ? "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
              : "bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
          style={activeSection === "branding" ? { backgroundColor: draftAdminTheme.accentColor, color: "#000" } : undefined}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Brand & Contact Info</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("navigation")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeSection === "navigation"
              ? "shadow-sm"
              : isLight
              ? "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
              : "bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
          style={activeSection === "navigation" ? { backgroundColor: draftAdminTheme.accentColor, color: "#000" } : undefined}
        >
          <Layout className="h-3.5 w-3.5" />
          <span>Navigation Links</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("policies")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeSection === "policies"
              ? "shadow-sm"
              : isLight
              ? "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
              : "bg-neutral-900/60 text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
          style={activeSection === "policies" ? { backgroundColor: draftAdminTheme.accentColor, color: "#000" } : undefined}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Legal & Policies</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: DYNAMIC FEATURE TOGGLES
      ───────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: DYNAMIC FEATURE TOGGLES
      ───────────────────────────────────────────────────────────── */}
      {activeSection === "features" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Controls Bar */}
          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-colors ${
            isLight
              ? "bg-white border-slate-200/90 shadow-xs"
              : "bg-neutral-900/40 border-neutral-800/80"
          }`}>
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isLight ? "text-slate-400" : "text-neutral-400"}`} />
              <input
                type="text"
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                placeholder="Search features (e.g. coupons, returns, tracking)..."
                className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs outline-none transition-colors border ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                    : "bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-amber-400"
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`rounded-xl px-3 py-2 text-xs outline-none cursor-pointer border ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-700 focus:border-slate-400"
                    : "bg-neutral-950 border-neutral-800 text-neutral-300 focus:border-amber-400"
                }`}
              >
                <option value="all">All Categories</option>
                <option value="Storefront">Storefront</option>
                <option value="Checkout & Orders">Checkout & Orders</option>
                <option value="Customer Engagement">Customer Engagement</option>
                <option value="Logistics">Logistics</option>
              </select>

              <button
                type="button"
                onClick={() => handleToggleAllFeatures(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-colors cursor-pointer"
              >
                Enable All
              </button>

              <button
                type="button"
                onClick={() => handleToggleAllFeatures(false)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                }`}
              >
                Disable All
              </button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFeatures.map((f) => {
              const Icon = f.icon;
              const isEnabled = Boolean(draftFeatures[f.key]);

              return (
                <div
                  key={f.key}
                  className={`group relative rounded-2xl border p-5 transition-all ${
                    isEnabled
                      ? isLight
                        ? "bg-white border-slate-200 shadow-xs hover:border-slate-300"
                        : "bg-neutral-900/40 border-neutral-800 hover:border-amber-400/40 shadow-sm"
                      : isLight
                      ? "bg-slate-50/60 border-slate-200/80 opacity-75 hover:opacity-100"
                      : "bg-neutral-950/40 border-neutral-900 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div
                        style={isEnabled ? { backgroundColor: `${draftAdminTheme.accentColor}18`, color: draftAdminTheme.accentColor, borderColor: `${draftAdminTheme.accentColor}35` } : undefined}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isEnabled
                            ? "border"
                            : isLight
                            ? "bg-slate-100 text-slate-400 border border-slate-200"
                            : "bg-neutral-800 text-neutral-500 border border-neutral-700"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-sm font-bold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>{f.name}</h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${
                              isEnabled
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : isLight
                                ? "bg-slate-100 text-slate-500 border border-slate-200"
                                : "bg-neutral-800 text-neutral-500"
                            }`}
                          >
                            {isEnabled ? "ACTIVE" : "OFF"}
                          </span>
                        </div>

                        <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-neutral-400"}`}>{f.description}</p>

                        <div className={`pt-1.5 flex items-center gap-2 text-[10px] ${isLight ? "text-slate-400" : "text-neutral-500"}`}>
                          <span className={`font-mono px-1.5 py-0.5 rounded border ${
                            isLight
                              ? "bg-slate-100 text-slate-600 border-slate-200"
                              : "bg-neutral-900 text-neutral-400 border-neutral-800"
                          }`}>
                            {f.category}
                          </span>
                          <span>•</span>
                          <span className={`italic ${isLight ? "text-slate-500" : "text-neutral-400"}`}>{f.impact}</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(f.key)}
                      role="switch"
                      aria-checked={isEnabled}
                      style={{ backgroundColor: isEnabled ? draftAdminTheme.accentColor : undefined }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled ? "" : isLight ? "bg-slate-200" : "bg-neutral-800"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md ring-0 transition duration-200 ease-in-out ${
                          isEnabled
                            ? "translate-x-5 bg-black"
                            : isLight
                            ? "translate-x-0 bg-white shadow-xs"
                            : "translate-x-0 bg-neutral-400"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: THEMES (TWO OPTIONS: ADMIN THEME & USER THEME)
      ───────────────────────────────────────────────────────────── */}
      {activeSection === "theme" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Two Distinct Theme Option Switchers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setThemeSubOption("admin")}
              className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                themeSubOption === "admin"
                  ? isLight
                    ? "border-amber-500 bg-white shadow-sm ring-2 ring-amber-500/20"
                    : "border-amber-400 bg-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.4)] ring-1 ring-amber-400/40"
                  : isLight
                  ? "border-slate-200 bg-white/70 hover:border-slate-300 opacity-80 hover:opacity-100"
                  : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 opacity-75 hover:opacity-100"
              }`}
            >
              <div
                style={{ backgroundColor: `${draftAdminTheme.accentColor}20`, color: draftAdminTheme.accentColor, borderColor: `${draftAdminTheme.accentColor}40` }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-black text-sm"
              >
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold tracking-tight flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
                    Option 1: Admin Dashboard Theme
                  </h3>
                  {themeSubOption === "admin" && (
                    <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Configuring
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                  Appearance, mode & accent tone for the administrative management panel
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setThemeSubOption("user")}
              className={`flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                themeSubOption === "user"
                  ? isLight
                    ? "border-amber-500 bg-white shadow-sm ring-2 ring-amber-500/20"
                    : "border-amber-400 bg-neutral-900 shadow-[0_4px_20px_rgba(0,0,0,0.4)] ring-1 ring-amber-400/40"
                  : isLight
                  ? "border-slate-200 bg-white/70 hover:border-slate-300 opacity-80 hover:opacity-100"
                  : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 opacity-75 hover:opacity-100"
              }`}
            >
              <div
                style={{ backgroundColor: `${draftUserTheme.accentColor}20`, color: draftUserTheme.accentColor, borderColor: `${draftUserTheme.accentColor}40` }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-black text-sm"
              >
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-bold tracking-tight flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
                    Option 2: User Storefront Theme
                  </h3>
                  {themeSubOption === "user" && (
                    <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Configuring
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                  Appearance, mode & highlights for regular customers browsing the store
                </p>
              </div>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SUB-OPTION A: ADMIN DASHBOARD THEME
          ══════════════════════════════════════════════════════════════ */}
          {themeSubOption === "admin" && (
            <div className={`space-y-6 rounded-2xl border p-6 transition-colors ${
              isLight
                ? "bg-white border-slate-200/90 shadow-xs"
                : "border-neutral-800/80 bg-neutral-900/30"
            }`}>
              <div className={`flex items-center justify-between border-b pb-4 ${isLight ? "border-slate-200" : "border-neutral-800/80"}`}>
                <div>
                  <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
                    <Shield className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <span>Admin Dashboard Theme Configuration</span>
                  </h2>
                  <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                    Control how the admin control center looks for yourself and administrative staff
                  </p>
                </div>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono ${
                  isLight
                    ? "bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400"
                }`}>
                  <span>Current Mode:</span>
                  <span className={`font-bold uppercase ${isLight ? "text-slate-900" : "text-white"}`}>{draftAdminTheme.mode}</span>
                </div>
              </div>

              {/* Admin Mode Selector */}
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                  Admin Interface Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "dark", label: "Obsidian Noir Dark", icon: Moon, desc: "Classic deep black executive finish" },
                    { id: "midnight", label: "Midnight Royal Navy", icon: Laptop, desc: "Modern deep indigo night palette" },
                    { id: "light", label: "Clean Slate Light", icon: Sun, desc: "Bright high-contrast executive daylight" },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = draftAdminTheme.mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleUpdateAdminTheme({ mode: m.id as any })}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/40"
                              : "border-amber-400 bg-amber-400/10 shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
                            : isLight
                            ? "border-slate-200 bg-slate-50/80 hover:bg-slate-100"
                            : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? "text-amber-500 dark:text-amber-400" : isLight ? "text-slate-400" : "text-neutral-400"}`} />
                        <div>
                          <p className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{m.label}</p>
                          <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Admin Accent Color Palettes */}
              <div className="space-y-3 pt-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                  Admin Accent & Button Color:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {ADMIN_PALETTES.map((pal) => {
                    const isSelected = draftAdminTheme.accentColor.toLowerCase() === pal.hex.toLowerCase();
                    return (
                      <button
                        key={pal.hex}
                        type="button"
                        onClick={() => handleUpdateAdminTheme({ accentColor: pal.hex })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? "border-slate-900 bg-slate-100 shadow-xs"
                              : "border-white bg-white/10 shadow-sm"
                            : isLight
                            ? "border-slate-200 bg-slate-50/80 hover:bg-slate-100"
                            : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-full border border-black/10 dark:border-white/20 shadow-inner ${pal.preview}`} />
                        <span className={`text-[11px] font-semibold leading-tight ${isLight ? "text-slate-700" : "text-neutral-200"}`}>{pal.name}</span>
                        <span className={`text-[9px] font-mono ${isLight ? "text-slate-400" : "text-neutral-500"}`}>{pal.hex}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Admin Color */}
                <div className="flex items-center gap-3 pt-3 max-w-sm">
                  <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-neutral-400"}`}>Custom Admin Accent:</label>
                  <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 flex-1 ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-neutral-950 border-neutral-800"
                  }`}>
                    <input
                      type="color"
                      value={draftAdminTheme.accentColor}
                      onChange={(e) => handleUpdateAdminTheme({ accentColor: e.target.value })}
                      className="h-6 w-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={draftAdminTheme.accentColor}
                      onChange={(e) => handleUpdateAdminTheme({ accentColor: e.target.value })}
                      className={`bg-transparent text-xs font-mono outline-none w-24 ${isLight ? "text-slate-900 font-semibold" : "text-white"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Admin Mini Preview Card */}
              <div className={`mt-4 p-4 rounded-xl border space-y-3 ${
                isLight ? "border-slate-200 bg-slate-50" : "border-neutral-800 bg-neutral-950/70"
              }`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                  Live Admin Dashboard Mock Preview:
                </p>
                <div className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
                  isLight ? "border-slate-200 bg-white shadow-xs" : "border-neutral-800 bg-neutral-900"
                }`}>
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: draftAdminTheme.accentColor, color: "#000" }}
                      className="h-6 w-6 rounded-md flex items-center justify-center font-bold text-[10px]"
                    >
                      P
                    </div>
                    <span className={`font-bold ${isLight ? "text-slate-900" : "text-white"}`}>POLLEN HQ</span>
                  </div>
                  <div className="flex gap-2">
                    <span
                      style={{ backgroundColor: draftAdminTheme.accentColor, color: "#000" }}
                      className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase"
                    >
                      Active Tab
                    </span>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${
                      isLight ? "bg-slate-100 text-slate-600" : "bg-neutral-800 text-neutral-400"
                    }`}>
                      Orders (3)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              SUB-OPTION B: USER STOREFRONT THEME
          ══════════════════════════════════════════════════════════════ */}
          {themeSubOption === "user" && (
            <div className={`space-y-6 rounded-2xl border p-6 transition-colors ${
              isLight
                ? "bg-white border-slate-200/90 shadow-xs"
                : "border-neutral-800/80 bg-neutral-900/30"
            }`}>
              <div className={`flex items-center justify-between border-b pb-4 ${isLight ? "border-slate-200" : "border-neutral-800/80"}`}>
                <div>
                  <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
                    <User className="h-4 w-4 text-amber-500 dark:text-amber-400" />
                    <span>Customer Storefront Theme Configuration</span>
                  </h2>
                  <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                    Control how the storefront catalog, checkout, and product details appear to customers
                  </p>
                </div>

                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono ${
                  isLight
                    ? "bg-slate-100 border-slate-200 text-slate-600"
                    : "bg-neutral-950 border-neutral-800 text-neutral-400"
                }`}>
                  <span>Current Store Mode:</span>
                  <span className={`font-bold uppercase ${isLight ? "text-slate-900" : "text-white"}`}>{draftUserTheme.mode}</span>
                </div>
              </div>

              {/* Customer Theme Mode Selector */}
              <div className="space-y-3">
                <label className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                  Customer Storefront Mode:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "light", label: "Minimalist Light", icon: Sun, desc: "Crisp white luxury catalog aesthetic (recommended)" },
                    { id: "dark", label: "Obsidian Noir Dark", icon: Moon, desc: "Deep rich evening mood with golden accents" },
                    { id: "auto", label: "System Automatic", icon: RefreshCw, desc: "Dynamically adapts to customer phone/device settings" },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = draftUserTheme.mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleUpdateUserTheme({ mode: m.id as any })}
                        className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/40"
                              : "border-amber-400 bg-amber-400/10 shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
                            : isLight
                            ? "border-slate-200 bg-slate-50/80 hover:bg-slate-100"
                            : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                        }`}
                      >
                        <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? "text-amber-500 dark:text-amber-400" : isLight ? "text-slate-400" : "text-neutral-400"}`} />
                        <div>
                          <p className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{m.label}</p>
                          <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>{m.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Accent Color Palettes */}
              <div className="space-y-3 pt-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                  Storefront Accent & Highlight Color:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  {USER_PALETTES.map((pal) => {
                    const isSelected = draftUserTheme.accentColor.toLowerCase() === pal.hex.toLowerCase();
                    return (
                      <button
                        key={pal.hex}
                        type="button"
                        onClick={() => handleUpdateUserTheme({ accentColor: pal.hex })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? isLight
                              ? "border-amber-500 bg-amber-500/10 shadow-xs"
                              : "border-amber-400 bg-amber-400/10 shadow-[0_2px_12px_rgba(212,175,55,0.2)]"
                            : isLight
                            ? "border-slate-200 bg-slate-50/80 hover:bg-slate-100"
                            : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-full border border-black/10 dark:border-white/20 shadow-inner ${pal.preview}`} />
                        <span className={`text-[11px] font-semibold leading-tight ${isLight ? "text-slate-700" : "text-neutral-200"}`}>{pal.name}</span>
                        <span className={`text-[9px] font-mono ${isLight ? "text-slate-400" : "text-neutral-500"}`}>{pal.hex}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-3 pt-3 max-w-sm">
                  <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-neutral-400"}`}>Custom Storefront Accent:</label>
                  <div className={`flex items-center gap-2 border rounded-xl px-3 py-1.5 flex-1 ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-neutral-950 border-neutral-800"
                  }`}>
                    <input
                      type="color"
                      value={draftUserTheme.accentColor}
                      onChange={(e) => handleUpdateUserTheme({ accentColor: e.target.value })}
                      className="h-6 w-6 rounded cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={draftUserTheme.accentColor}
                      onChange={(e) => handleUpdateUserTheme({ accentColor: e.target.value })}
                      className={`bg-transparent text-xs font-mono outline-none w-24 ${isLight ? "text-slate-900 font-semibold" : "text-white"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Top Announcement Bar */}
              <div className={`border-t pt-5 space-y-4 ${isLight ? "border-slate-200" : "border-neutral-800/80"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Top Announcement Bar</h3>
                    <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                      Displays a promotional notice at the top of the storefront
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUpdateUserTheme({ bannerEnabled: !draftUserTheme.bannerEnabled })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      draftUserTheme.bannerEnabled ? "bg-amber-500 dark:bg-amber-400" : isLight ? "bg-slate-200" : "bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                        draftUserTheme.bannerEnabled ? "translate-x-5 bg-black" : isLight ? "translate-x-0 bg-white shadow-xs" : "translate-x-0 bg-neutral-400"
                      }`}
                    />
                  </button>
                </div>

                {draftUserTheme.bannerEnabled && (
                  <div className="space-y-2 pt-2">
                    <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-neutral-400"}`}>Announcement Banner Text:</label>
                    <input
                      type="text"
                      value={draftUserTheme.bannerText}
                      onChange={(e) => handleUpdateUserTheme({ bannerText: e.target.value })}
                      placeholder="e.g. Free India Post Speed Post on orders above ₹499 · Pure Extrait de Parfum"
                      className={`w-full rounded-xl px-4 py-2.5 text-xs outline-none transition-colors border ${
                        isLight
                          ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                          : "bg-neutral-950 border-neutral-800 text-white focus:border-amber-400"
                      }`}
                    />

                    {/* Banner Live Preview */}
                    <div
                      style={{ backgroundColor: draftUserTheme.accentColor || "#f59e0b", color: "#000" }}
                      className="mt-3 p-2.5 text-[11px] font-bold text-center uppercase tracking-widest rounded-lg shadow-sm"
                    >
                      Storefront Live Banner: {draftUserTheme.bannerText}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: BRANDING & CONTACT INFO
      ───────────────────────────────────────────────────────────── */}
      {activeSection === "branding" && (
        <div className="space-y-6 animate-fadeIn">
          <div className={`rounded-2xl border p-6 space-y-5 transition-colors ${
            isLight
              ? "bg-white border-slate-200/90 shadow-xs"
              : "border-neutral-800/80 bg-neutral-900/30"
          }`}>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Brand Identity & Messaging</h2>
              <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                Update core brand names, taglines, and currency settings seen across headers, emails, and invoices
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-neutral-400"}`}>Brand Name</label>
                <input
                  type="text"
                  value={draftBranding.brandName}
                  onChange={(e) => {
                    const updated = { ...draftBranding, brandName: e.target.value };
                    setDraftBranding(updated);
                    updateConfig({ branding: updated });
                  }}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs outline-none transition-colors border ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                      : "bg-neutral-950 border-neutral-800 text-white focus:border-amber-400"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-neutral-400"}`}>Currency Symbol & Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={draftBranding.currencySymbol}
                    onChange={(e) => {
                      const updated = { ...draftBranding, currencySymbol: e.target.value };
                      setDraftBranding(updated);
                      updateConfig({ branding: updated });
                    }}
                    placeholder="₹"
                    className={`w-20 rounded-xl px-3 py-2.5 text-xs text-center font-bold outline-none transition-colors border ${
                      isLight
                        ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                        : "bg-neutral-950 border-neutral-800 text-white focus:border-amber-400"
                    }`}
                  />
                  <input
                    type="text"
                    value={draftBranding.currencyCode}
                    onChange={(e) => {
                      const updated = { ...draftBranding, currencyCode: e.target.value };
                      setDraftBranding(updated);
                      updateConfig({ branding: updated });
                    }}
                    placeholder="INR"
                    className={`flex-1 rounded-xl px-4 py-2.5 text-xs outline-none transition-colors border ${
                      isLight
                        ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                        : "bg-neutral-950 border-neutral-800 text-white focus:border-amber-400"
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-neutral-400"}`}>Brand Tagline</label>
              <input
                type="text"
                value={draftBranding.brandTagline}
                onChange={(e) => {
                  const updated = { ...draftBranding, brandTagline: e.target.value };
                  setDraftBranding(updated);
                  updateConfig({ branding: updated });
                }}
                className={`w-full rounded-xl px-4 py-2.5 text-xs outline-none transition-colors border ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                    : "bg-neutral-950 border-neutral-800 text-white focus:border-amber-400"
                }`}
              />
            </div>
          </div>

          {/* Brand Story / About POLLEN (Dynamic Content) */}
          <div className={`rounded-2xl border p-6 space-y-5 transition-colors ${
            isLight
              ? "bg-white border-slate-200/90 shadow-xs"
              : "border-neutral-800/80 bg-neutral-900/30"
          }`}>
            <div className="flex items-center justify-between border-b pb-4 border-slate-200/60 dark:border-neutral-800/80">
              <div>
                <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${isLight ? "text-slate-900" : "text-white"}`}>
                  <BookOpen className="h-4 w-4 text-amber-500" />
                  <span>Brand Story & "About POLLEN" Section</span>
                </h2>
                <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                  Manage the official brand philosophy and narrative dynamically displayed on the homepage Moment Section and About pages
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const updated = {
                    ...draftBranding,
                    aboutTitle: "About POLLEN",
                    aboutStory: DEFAULT_ABOUT_STORY,
                  };
                  setDraftBranding(updated);
                  updateConfig({ branding: updated });
                  onShowToast?.("Brand Story reset to official document copy");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                  isLight
                    ? "text-slate-700 bg-slate-100 hover:bg-slate-200"
                    : "text-neutral-300 bg-neutral-800 hover:bg-neutral-700"
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to Doc Copy</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                  About Section Title
                </label>
                <input
                  type="text"
                  value={draftBranding.aboutTitle || "About POLLEN"}
                  onChange={(e) => {
                    const updated = { ...draftBranding, aboutTitle: e.target.value };
                    setDraftBranding(updated);
                    updateConfig({ branding: updated });
                  }}
                  placeholder="About POLLEN"
                  className={`w-full rounded-xl px-4 py-2.5 text-xs outline-none transition-colors border ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                      : "bg-neutral-950 border-neutral-800 text-white focus:border-amber-400"
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold flex items-center justify-between ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                  <span>Brand Narrative & Story (Line-by-Line)</span>
                  <span className="text-[10px] font-normal text-amber-500">Rendered dynamically across store</span>
                </label>
                <textarea
                  rows={8}
                  value={draftBranding.aboutStory || DEFAULT_ABOUT_STORY}
                  onChange={(e) => {
                    const updated = { ...draftBranding, aboutStory: e.target.value };
                    setDraftBranding(updated);
                    updateConfig({ branding: updated });
                  }}
                  placeholder={DEFAULT_ABOUT_STORY}
                  className={`w-full font-sans rounded-xl p-4 text-xs leading-relaxed outline-none transition-colors border resize-y ${
                    isLight
                      ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-400"
                      : "bg-neutral-950 border-neutral-800 text-white focus:border-amber-400"
                  }`}
                />
              </div>

              {/* Live Preview Card */}
              <div className={`p-4 rounded-xl border ${
                isLight ? "bg-slate-50/80 border-slate-200" : "bg-black/50 border-neutral-800"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="h-3.5 w-3.5 text-amber-500" />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                    Live Storefront Preview
                  </span>
                </div>
                <div className="text-center py-2 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-amber-500">
                    {draftBranding.aboutTitle || "About POLLEN"}
                  </h4>
                  {(draftBranding.aboutStory || DEFAULT_ABOUT_STORY).split("\n").map((line, i) => (
                    <p key={i} className={`text-[11px] leading-relaxed ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Support & Social Channels */}
          <div className={`rounded-2xl border p-6 space-y-5 transition-colors ${
            isLight
              ? "bg-white border-slate-200/90 shadow-xs"
              : "border-neutral-800/80 bg-neutral-900/30"
          }`}>
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Customer Support & Social Links</h2>
              <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                Contact channels shown in the footer and order emails
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-neutral-400"}`}>Support Email</label>
                <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-neutral-950 border-neutral-800"
                }`}>
                  <Mail className={`h-4 w-4 ${isLight ? "text-slate-400" : "text-neutral-500"}`} />
                  <input
                    type="email"
                    value={draftBranding.supportEmail}
                    onChange={(e) => {
                      const updated = { ...draftBranding, supportEmail: e.target.value };
                      setDraftBranding(updated);
                      updateConfig({ branding: updated });
                    }}
                    className={`bg-transparent text-xs outline-none flex-1 ${isLight ? "text-slate-900 placeholder:text-slate-400" : "text-white"}`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-neutral-400"}`}>Support Phone / WhatsApp</label>
                <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-neutral-950 border-neutral-800"
                }`}>
                  <Phone className={`h-4 w-4 ${isLight ? "text-slate-400" : "text-neutral-500"}`} />
                  <input
                    type="text"
                    value={draftBranding.supportPhone || ""}
                    onChange={(e) => {
                      const updated = { ...draftBranding, supportPhone: e.target.value };
                      setDraftBranding(updated);
                      updateConfig({ branding: updated });
                    }}
                    className={`bg-transparent text-xs outline-none flex-1 ${isLight ? "text-slate-900 placeholder:text-slate-400" : "text-white"}`}
                  />
                </div>
              </div>
            </div>

            {/* Social Media Channels (Instagram & Facebook) */}
            <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-neutral-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>
                    Storefront Footer Social Media Links
                  </h3>
                  <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                    Links configured here appear as clickable Instagram and Facebook icons in the website footer
                  </p>
                </div>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Footer Links
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Instagram URL Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                      <Instagram size={13} className="text-[#E4405F]" />
                      <span>Instagram Account URL</span>
                    </label>
                    {draftBranding.socialLinks?.instagram && (
                      <a
                        href={draftBranding.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                        title="Test link in new tab"
                      >
                        <span>Test</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-neutral-950 border-neutral-800"
                  }`}>
                    <Instagram className="h-4 w-4 text-[#E4405F] shrink-0" />
                    <input
                      type="url"
                      placeholder="https://www.instagram.com/_pollen.co"
                      value={draftBranding.socialLinks?.instagram || ""}
                      onChange={(e) => {
                        const updated = {
                          ...draftBranding,
                          socialLinks: { ...draftBranding.socialLinks, instagram: e.target.value },
                        };
                        setDraftBranding(updated);
                        updateConfig({ branding: updated });
                      }}
                      className={`bg-transparent text-xs outline-none flex-1 ${isLight ? "text-slate-900 placeholder:text-slate-400" : "text-white"}`}
                    />
                  </div>
                </div>

                {/* Facebook URL Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                      <Facebook size={13} className="text-[#1877F2]" />
                      <span>Facebook Account URL</span>
                    </label>
                    {draftBranding.socialLinks?.facebook && (
                      <a
                        href={draftBranding.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                        title="Test link in new tab"
                      >
                        <span>Test</span>
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${
                    isLight ? "bg-slate-50 border-slate-200 text-slate-900" : "bg-neutral-950 border-neutral-800"
                  }`}>
                    <Facebook className="h-4 w-4 text-[#1877F2] shrink-0" />
                    <input
                      type="url"
                      placeholder="https://www.facebook.com/share/1EKwnHM4Ya/"
                      value={draftBranding.socialLinks?.facebook || ""}
                      onChange={(e) => {
                        const updated = {
                          ...draftBranding,
                          socialLinks: { ...draftBranding.socialLinks, facebook: e.target.value },
                        };
                        setDraftBranding(updated);
                        updateConfig({ branding: updated });
                      }}
                      className={`bg-transparent text-xs outline-none flex-1 ${isLight ? "text-slate-900 placeholder:text-slate-400" : "text-white"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Save button for Branding */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={saving}
                  style={{
                    backgroundColor: draftAdminTheme.accentColor || "#f59e0b",
                    color: "#000000",
                  }}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save size={13} />
                  <span>Save Social Links & Branding</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: NAVIGATION CONTROLS
      ───────────────────────────────────────────────────────────── */}
      {activeSection === "navigation" && (
        <div className={`rounded-2xl border p-6 space-y-6 animate-fadeIn transition-colors ${
          isLight
            ? "bg-white border-slate-200/90 shadow-xs"
            : "border-neutral-800/80 bg-neutral-900/30"
        }`}>
          <div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>Storefront Navigation Links</h2>
            <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
              Select which sections and discovery links appear in the desktop top bar and mobile drawer menu
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                key: "showCollectionLink",
                title: "Fragrance Collection (#fragrances)",
                desc: "Shows direct link to the fragrance catalog in the main navigation",
              },
              {
                key: "showGiftSetLink",
                title: "Discovery Gift Set Link",
                desc: "Shows top menu button leading to the luxury trio discovery set",
              },
              {
                key: "showAboutLink",
                title: "Our Story / Brand Heritage",
                desc: "Displays the heritage narrative link in navigation and drawer",
              },
            ].map((nav) => {
              const isChecked = (draftNavigation as any)[nav.key] !== false;
              return (
                <div
                  key={nav.key}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    isLight
                      ? "bg-slate-50/80 border-slate-200/90 text-slate-900"
                      : "bg-neutral-950 border-neutral-800/80"
                  }`}
                >
                  <div>
                    <p className={`text-xs font-bold ${isLight ? "text-slate-900" : "text-white"}`}>{nav.title}</p>
                    <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>{nav.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const updated = {
                        ...draftNavigation,
                        [nav.key]: !isChecked,
                      };
                      setDraftNavigation(updated);
                      updateConfig({ navigation: updated });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isChecked ? "bg-amber-500 dark:bg-amber-400" : isLight ? "bg-slate-200" : "bg-neutral-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                        isChecked ? "translate-x-5 bg-black" : isLight ? "translate-x-0 bg-white shadow-xs" : "translate-x-0 bg-neutral-400"
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: STORE POLICIES & LEGAL (DYNAMIC & EDITABLE)
      ───────────────────────────────────────────────────────────── */}
      {activeSection === "policies" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card */}
          <div
            className={`p-5 rounded-2xl border transition-colors ${
              isLight ? "bg-white border-slate-200/90 shadow-xs" : "bg-neutral-900/40 border-neutral-800/80"
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <h2 className={`text-base font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                    Storefront Legal & Policies Editor
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Live Dynamic Sync
                  </span>
                </div>
                <p className={`text-xs mt-1 max-w-2xl ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                  Customize your storefront legal documents, checkout consent notices, and policy clauses.
                  Updates are instantly rendered across customer legal pages, footer links, and Flipkart/Amazon checkout modals.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleResetPolicyToDefault(activePolicyKey)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isLight
                      ? "text-slate-700 bg-slate-100 hover:bg-slate-200"
                      : "text-neutral-300 bg-neutral-800 hover:bg-neutral-700"
                  }`}
                  title="Reset only this active policy to official document default text"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Active Policy</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAllPolicies}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  title="Reset all 5 policies to official Google Document defaults"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All to Doc Defaults</span>
                </button>
              </div>
            </div>

            {/* Policy Selector Pills */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-4 border-t border-slate-100 dark:border-neutral-800">
              {[
                { key: "terms" as const, label: "Terms & Conditions", icon: Scale },
                { key: "ordersShipping" as const, label: "Orders & Shipping", icon: Truck },
                { key: "privacy" as const, label: "Privacy Policy", icon: ShieldCheck },
                { key: "refund" as const, label: "Return & Refund", icon: RotateCcw },
                { key: "cookies" as const, label: "Cookie Policy", icon: Sparkles },
              ].map((tab) => {
                const isActive = activePolicyKey === tab.key;
                const Icon = tab.icon;
                const policyObj = draftPolicies[tab.key] || DEFAULT_POLICIES[tab.key];
                const clauseCount = policyObj?.sections?.length || 0;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActivePolicyKey(tab.key)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? isLight
                          ? "bg-amber-500/10 border-amber-500/40 text-amber-900 shadow-2xs"
                          : "bg-amber-500/10 border-amber-500/40 text-amber-200"
                        : isLight
                        ? "bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-700"
                        : "bg-neutral-900/40 hover:bg-neutral-800/60 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full justify-between">
                      <Icon className={`h-4 w-4 ${isActive ? "text-amber-500" : "text-neutral-400"}`} />
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                        {clauseCount} clauses
                      </span>
                    </div>
                    <span className="text-xs font-bold mt-2 truncate w-full">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Policy Metadata Editor */}
          {(() => {
            const currentPolicy = draftPolicies[activePolicyKey] || DEFAULT_POLICIES[activePolicyKey];

            return (
              <div className="space-y-6">
                {/* Meta Configuration Card */}
                <div
                  className={`p-5 rounded-2xl border transition-colors ${
                    isLight ? "bg-white border-slate-200/90 shadow-xs" : "bg-neutral-900/40 border-neutral-800/80"
                  }`}
                >
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                    Policy General Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                        Policy Heading Title
                      </label>
                      <input
                        type="text"
                        value={currentPolicy.title || ""}
                        onChange={(e) => handleUpdatePolicyMeta("title", e.target.value)}
                        placeholder="e.g. Terms & Conditions"
                        className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium border outline-hidden transition-colors ${
                          isLight
                            ? "bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-900"
                            : "bg-neutral-950 border-neutral-800 focus:border-amber-500 text-white"
                        }`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-semibold mb-1.5 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                        Last Updated Date
                      </label>
                      <input
                        type="text"
                        value={currentPolicy.lastUpdated || ""}
                        onChange={(e) => handleUpdatePolicyMeta("lastUpdated", e.target.value)}
                        placeholder="e.g. 10 September 2026"
                        className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium border outline-hidden transition-colors ${
                          isLight
                            ? "bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-900"
                            : "bg-neutral-950 border-neutral-800 focus:border-amber-500 text-white"
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isLight ? "text-slate-600" : "text-neutral-400"}`}>
                      Introduction / Lead Statement
                    </label>
                    <textarea
                      rows={3}
                      value={currentPolicy.intro || ""}
                      onChange={(e) => handleUpdatePolicyMeta("intro", e.target.value)}
                      placeholder="Introductory paragraph or welcome note shown at the top of the policy page..."
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium border outline-hidden transition-colors ${
                        isLight
                          ? "bg-slate-50 border-slate-200 focus:border-amber-500 text-slate-900"
                          : "bg-neutral-950 border-neutral-800 focus:border-amber-500 text-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Clauses & Sections List */}
                <div
                  className={`p-5 rounded-2xl border transition-colors ${
                    isLight ? "bg-white border-slate-200/90 shadow-xs" : "bg-neutral-900/40 border-neutral-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                        Policy Clauses & Terms ({currentPolicy.sections.length})
                      </h3>
                      <p className={`text-[11px] mt-0.5 ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
                        Each clause appears as a separate section block with bold title and formatted text.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddClause}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Clause</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {currentPolicy.sections.map((section, idx) => (
                      <div
                        key={section.id || idx}
                        className={`p-4 rounded-xl border transition-colors ${
                          isLight
                            ? "bg-slate-50/70 border-slate-200/80"
                            : "bg-neutral-950/70 border-neutral-800/80"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Clause #{idx + 1}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveClause(idx, "up")}
                              disabled={idx === 0}
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                idx === 0
                                  ? "opacity-30 cursor-not-allowed"
                                  : isLight
                                  ? "hover:bg-slate-200 text-slate-600"
                                  : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                              }`}
                              title="Move Clause Up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveClause(idx, "down")}
                              disabled={idx === currentPolicy.sections.length - 1}
                              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                idx === currentPolicy.sections.length - 1
                                  ? "opacity-30 cursor-not-allowed"
                                  : isLight
                                  ? "hover:bg-slate-200 text-slate-600"
                                  : "hover:bg-neutral-800 text-neutral-400 hover:text-white"
                              }`}
                              title="Move Clause Down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveClause(idx)}
                              className="p-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Clause"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <input
                              type="text"
                              value={section.heading}
                              onChange={(e) => handleUpdateClause(idx, "heading", e.target.value)}
                              placeholder="Clause Heading (e.g. Transit Damage & Replacement)"
                              className={`w-full px-3 py-1.5 rounded-lg text-xs font-bold border outline-hidden transition-colors ${
                                isLight
                                  ? "bg-white border-slate-200 focus:border-amber-500 text-slate-900"
                                  : "bg-neutral-900 border-neutral-700/80 focus:border-amber-500 text-white"
                              }`}
                            />
                          </div>

                          <div>
                            <textarea
                              rows={4}
                              value={section.body}
                              onChange={(e) => handleUpdateClause(idx, "body", e.target.value)}
                              placeholder="Clause description, bullet points, and conditions..."
                              className={`w-full px-3 py-2 rounded-lg text-xs leading-relaxed font-normal border outline-hidden transition-colors ${
                                isLight
                                  ? "bg-white border-slate-200 focus:border-amber-500 text-slate-800"
                                  : "bg-neutral-900 border-neutral-700/80 focus:border-amber-500 text-neutral-300"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={handleAddClause}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-dashed transition-all cursor-pointer ${
                        isLight
                          ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                          : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5 text-amber-500" />
                      <span>Add Another Clause to {currentPolicy.title}</span>
                    </button>
                  </div>
                </div>

                {/* Live Preview Box */}
                <div
                  className={`p-5 rounded-2xl border transition-colors ${
                    isLight ? "bg-white border-slate-200/90 shadow-xs" : "bg-neutral-900/40 border-neutral-800/80"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-neutral-800">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-slate-700" : "text-neutral-300"}`}>
                      Live Customer Storefront Preview
                    </h3>
                  </div>

                  <div className="p-6 rounded-xl bg-[#faf9f7] dark:bg-[#0a0a0a] border border-black/10 dark:border-neutral-800 text-black dark:text-white max-h-96 overflow-y-auto">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-black/35 dark:text-neutral-500 mb-2">
                      Legal
                    </p>
                    <h2 className="text-2xl font-extrabold tracking-tight mb-2">
                      {currentPolicy.title || "Policy Title"}
                    </h2>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/35 dark:text-neutral-500 mb-4">
                      Last updated: {currentPolicy.lastUpdated || "Current"}
                    </p>
                    {currentPolicy.intro && (
                      <p className="text-sm leading-relaxed text-black/70 dark:text-neutral-300 mb-6 pb-4 border-b border-black/10 dark:border-neutral-800 whitespace-pre-line">
                        {currentPolicy.intro}
                      </p>
                    )}
                    <div className="space-y-5">
                      {currentPolicy.sections.map((sec, idx) => (
                        <div key={idx} className="border-t border-black/10 dark:border-neutral-800 pt-3">
                          <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-1.5">
                            {sec.heading}
                          </h4>
                          <p className="text-xs leading-relaxed text-black/60 dark:text-neutral-400 whitespace-pre-line">
                            {sec.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Quick-Save Bar */}
                <div
                  className={`sticky bottom-4 p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-lg ${
                    isLight
                      ? "bg-white/95 backdrop-blur-md border-slate-200 text-slate-900"
                      : "bg-neutral-900/95 backdrop-blur-md border-neutral-800 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold">
                      Policies configured. Click Save Changes to publish to database.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={saving}
                    style={{
                      backgroundColor: draftAdminTheme.accentColor || "#f59e0b",
                      color: "#000000",
                    }}
                    className="flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save All Policies</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
