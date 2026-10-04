import React from "react";
import { ArrowLeft, LogOut, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import { NavSection } from "../types";
import { useTenantConfig } from "@/config/tenantContext";

interface AdminHeaderProps {
  adminUser: { name: string; email: string; role?: string };
  activeTab: NavSection;
  searchQuery: string;
  refreshing: boolean;
  onSearchChange: (q: string) => void;
  onRefresh: () => void;
  onClose: () => void;
  onSignOut: () => void;
}

export function AdminHeader({
  adminUser,
  activeTab,
  searchQuery,
  refreshing,
  onSearchChange,
  onRefresh,
  onClose,
  onSignOut,
}: AdminHeaderProps) {
  const { adminTheme, branding } = useTenantConfig();
  const accent = adminTheme?.accentColor || "#f59e0b";
  const isLight = adminTheme?.mode === "light";
  const isMidnight = adminTheme?.mode === "midnight";
  const isSearchable = ["orders", "products", "customers"].includes(activeTab);

  return (
    <header
      className={`sticky top-0 z-40 flex flex-col md:flex-row items-center justify-between gap-4 border-b px-6 py-4 backdrop-blur-md transition-colors duration-200 ${
        isLight
          ? "border-slate-200/90 bg-white/90 text-slate-900 shadow-sm"
          : isMidnight
          ? "border-slate-800/80 bg-[#0c1222]/90 text-white"
          : "border-neutral-800/80 bg-neutral-950/80 text-white"
      }`}
    >
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={onClose}
          className={`p-2 rounded-xl border transition-colors ${
            isLight
              ? "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
          }`}
          title="Return to Store"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div
            style={{
              backgroundColor: `${accent}15`,
              color: accent,
              borderColor: `${accent}35`,
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm"
          >
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-sm font-bold uppercase tracking-wider ${isLight ? "text-slate-900" : "text-white"}`}>
                {branding?.brandName ? `${branding.brandName.toUpperCase()} HQ` : "POLLEN HQ"}
              </h1>
              <span
                style={{
                  backgroundColor: `${accent}15`,
                  color: accent,
                  borderColor: `${accent}30`,
                }}
                className="rounded-full border px-2 py-0.2 text-[9px] font-bold uppercase"
              >
                Live
              </span>
            </div>
            <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-neutral-400"}`}>
              {adminUser.name} · {adminUser.role || "Superadmin"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {isSearchable && (
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className={`w-full rounded-xl border pl-9 pr-3 py-1.5 text-xs outline-none transition-colors ${
                isLight
                  ? "bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400"
                  : "bg-neutral-900/60 border-neutral-800 text-white placeholder-neutral-500 focus:border-amber-400"
              }`}
            />
          </div>
        )}

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className={`flex items-center gap-1.5 p-2 rounded-xl border transition-colors disabled:opacity-50 ${
            isLight
              ? "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
          }`}
          title="Sync with Live Database"
        >
          <RefreshCw
            style={{ color: refreshing ? accent : undefined }}
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>

        <button
          onClick={onSignOut}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
            isLight
              ? "bg-slate-100 border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200"
              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-rose-400 hover:border-rose-900/50"
          }`}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>

        <button
          onClick={onClose}
          className={`p-2 rounded-xl border transition-colors ${
            isLight
              ? "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
          }`}
          title="Close Panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
