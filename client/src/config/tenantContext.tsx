import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_TENANT_CONFIG,
  DEFAULT_POLICIES,
  TenantConfig,
  CompanyBranding,
  FeatureConfig,
  UserThemeConfig,
  AdminThemeConfig,
  PoliciesConfig,
} from "./tenantConfig";
import { getPublicStoreSettings, updateAdminSettings } from "@/app/api";

const STORAGE_KEY = "pollen_tenant_config";

export interface TenantContextValue {
  config: TenantConfig;
  branding: CompanyBranding;
  features: FeatureConfig;
  userTheme: UserThemeConfig;
  adminTheme: AdminThemeConfig;
  policies: PoliciesConfig;
  updateConfig: (overrides: Partial<TenantConfig>) => void;
  isFeatureEnabled: (feature: keyof TenantConfig["features"]) => boolean;
  resetConfigToDefaults: () => void;
  saveConfigToServer: (overrides?: Partial<TenantConfig>) => Promise<boolean>;
  loading: boolean;
}

const defaultContextValue: TenantContextValue = {
  config: DEFAULT_TENANT_CONFIG,
  branding: DEFAULT_TENANT_CONFIG.branding,
  features: DEFAULT_TENANT_CONFIG.features,
  userTheme: DEFAULT_TENANT_CONFIG.theme,
  adminTheme: DEFAULT_TENANT_CONFIG.adminTheme,
  policies: DEFAULT_POLICIES,
  updateConfig: () => {},
  isFeatureEnabled: () => true,
  resetConfigToDefaults: () => {},
  saveConfigToServer: async () => false,
  loading: false,
};

const TenantContext = createContext<TenantContextValue>(defaultContextValue);

export function TenantProvider({
  initialConfig,
  children,
}: {
  initialConfig?: Partial<TenantConfig>;
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<TenantConfig>(() => {
    // 1. Check localStorage first for instant client persistence
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_TENANT_CONFIG,
          ...parsed,
          branding: { ...DEFAULT_TENANT_CONFIG.branding, ...(parsed.branding || {}) },
          features: { ...DEFAULT_TENANT_CONFIG.features, ...(parsed.features || {}) },
          theme: { ...DEFAULT_TENANT_CONFIG.theme, ...(parsed.theme || {}) },
          adminTheme: { ...DEFAULT_TENANT_CONFIG.adminTheme, ...(parsed.adminTheme || {}) },
          navigation: { ...DEFAULT_TENANT_CONFIG.navigation, ...(parsed.navigation || {}) },
          policies: { ...DEFAULT_POLICIES, ...(parsed.policies || {}) },
        };
      }
    } catch {
      // fallback to initial
    }

    return {
      ...DEFAULT_TENANT_CONFIG,
      ...initialConfig,
      branding: {
        ...DEFAULT_TENANT_CONFIG.branding,
        ...(initialConfig?.branding || {}),
      },
      features: {
        ...DEFAULT_TENANT_CONFIG.features,
        ...(initialConfig?.features || {}),
      },
      theme: {
        ...DEFAULT_TENANT_CONFIG.theme,
        ...(initialConfig?.theme || {}),
      },
      adminTheme: {
        ...DEFAULT_TENANT_CONFIG.adminTheme,
        ...(initialConfig?.adminTheme || {}),
      },
      navigation: {
        ...DEFAULT_TENANT_CONFIG.navigation,
        ...(initialConfig?.navigation || {}),
      },
      policies: {
        ...DEFAULT_POLICIES,
        ...(initialConfig?.policies || {}),
      },
    };
  });

  // Sync with backend MongoDB settings on mount
  useEffect(() => {
    let mounted = true;
    async function loadServerSettings() {
      try {
        setLoading(true);
        const serverData = await getPublicStoreSettings();
        if (mounted && serverData) {
          setConfig((prev) => {
            const merged: TenantConfig = {
              ...prev,
              features: serverData.features ? { ...prev.features, ...serverData.features } : prev.features,
              theme: serverData.theme ? { ...prev.theme, ...serverData.theme } : prev.theme,
              adminTheme: serverData.adminTheme ? { ...prev.adminTheme, ...serverData.adminTheme } : prev.adminTheme,
              branding: serverData.branding ? { ...prev.branding, ...serverData.branding } : prev.branding,
              navigation: serverData.navigation ? { ...prev.navigation, ...serverData.navigation } : prev.navigation,
              policies: serverData.policies ? { ...DEFAULT_POLICIES, ...serverData.policies } : (prev.policies || DEFAULT_POLICIES),
            };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {
              // ignore
            }
            return merged;
          });
        }
      } catch (err) {
        console.warn("[TenantContext] Sync error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadServerSettings();
    return () => {
      mounted = false;
    };
  }, []);

  // Dynamically apply accent color to CSS root variables for storefront & admin
  useEffect(() => {
    const userAccent = config.theme?.accentColor || DEFAULT_TENANT_CONFIG.theme.accentColor;
    const adminAccent = config.adminTheme?.accentColor || DEFAULT_TENANT_CONFIG.adminTheme.accentColor;

    document.documentElement.style.setProperty("--pollen-accent", userAccent);
    document.documentElement.style.setProperty("--admin-accent", adminAccent);

    // Apply color scheme if dark / light mode is chosen for storefront
    if (config.theme?.mode === "dark") {
      document.documentElement.classList.add("dark");
    } else if (config.theme?.mode === "light") {
      document.documentElement.classList.remove("dark");
    }
  }, [config.theme?.accentColor, config.theme?.mode, config.adminTheme?.accentColor, config.adminTheme?.mode]);

  const updateConfig = (overrides: Partial<TenantConfig>) => {
    setConfig((prev) => {
      const next: TenantConfig = {
        ...prev,
        ...overrides,
        branding: {
          ...prev.branding,
          ...(overrides.branding || {}),
        },
        features: {
          ...prev.features,
          ...(overrides.features || {}),
        },
        theme: {
          ...prev.theme,
          ...(overrides.theme || {}),
        },
        adminTheme: {
          ...prev.adminTheme,
          ...(overrides.adminTheme || {}),
        },
        navigation: {
          ...prev.navigation,
          ...(overrides.navigation || {}),
        },
        policies: {
          ...(prev.policies || DEFAULT_POLICIES),
          ...(overrides.policies || {}),
        },
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }

      return next;
    });
  };

  const resetConfigToDefaults = () => {
    setConfig(DEFAULT_TENANT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const saveConfigToServer = async (overrides?: Partial<TenantConfig>): Promise<boolean> => {
    try {
      const targetFeatures = overrides?.features || config.features;
      const targetTheme = overrides?.theme || config.theme;
      const targetAdminTheme = overrides?.adminTheme || config.adminTheme;
      const targetBranding = overrides?.branding || config.branding;
      const targetNavigation = overrides?.navigation || config.navigation;
      const targetPolicies = overrides?.policies || config.policies || DEFAULT_POLICIES;

      await updateAdminSettings([
        {
          key: "features",
          value: targetFeatures,
          group: "features",
          label: "Platform Features",
          isPublic: true,
        },
        {
          key: "theme",
          value: targetTheme,
          group: "theme",
          label: "Storefront User Theme",
          isPublic: true,
        },
        {
          key: "adminTheme",
          value: targetAdminTheme,
          group: "theme",
          label: "Admin Dashboard Theme",
          isPublic: true,
        },
        {
          key: "branding",
          value: targetBranding,
          group: "branding",
          label: "Company Branding",
          isPublic: true,
        },
        {
          key: "navigation",
          value: targetNavigation,
          group: "navigation",
          label: "Navigation Controls",
          isPublic: true,
        },
        {
          key: "policies",
          value: targetPolicies,
          group: "policies",
          label: "Store Legal & Policies",
          isPublic: true,
        },
      ]);
      return true;
    } catch (err) {
      console.error("[TenantContext] Failed to save config to server:", err);
      return false;
    }
  };

  const isFeatureEnabled = (feature: keyof TenantConfig["features"]): boolean => {
    return Boolean(config.features[feature]);
  };

  const value = useMemo(
    () => ({
      config,
      branding: config.branding,
      features: config.features,
      userTheme: config.theme,
      adminTheme: config.adminTheme,
      policies: config.policies || DEFAULT_POLICIES,
      updateConfig,
      isFeatureEnabled,
      resetConfigToDefaults,
      saveConfigToServer,
      loading,
    }),
    [config, loading]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenantConfig(): TenantContextValue {
  const context = useContext(TenantContext);
  if (!context || !context.branding) {
    return defaultContextValue;
  }
  return context;
}
