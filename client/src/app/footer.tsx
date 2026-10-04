import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react";
import { ServerStatusBadge } from "./components/ServerStatusBadge";
import { useTenantConfig } from "@/config/tenantContext";

type FooterProps = {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenRefund: () => void;
  onOpenCookies: () => void;
  onOpenOrdersShipping?: () => void;
  onOpenHome?: () => void;
  onOpenAdminLogin?: () => void;
};

const policyLinks = [
  "Privacy Policy",
  "Terms & Conditions",
  "Orders & Shipping",
  "Cookie Policy",
  "Return & Refund Policy",
];

const DEFAULT_INSTAGRAM = "https://www.instagram.com/_pollen.co";
const DEFAULT_FACEBOOK = "https://www.facebook.com/share/1EKwnHM4Ya/";

export function Footer({
  onOpenPrivacy,
  onOpenTerms,
  onOpenRefund,
  onOpenCookies,
  onOpenOrdersShipping = () => {},
  onOpenHome = () => window.scrollTo({ top: 0, behavior: "smooth" }),
  onOpenAdminLogin,
}: FooterProps) {
  const { branding, isFeatureEnabled, config } = useTenantConfig();
  const isDark = config.theme?.mode === "dark";

  const instagramUrl = (branding.socialLinks?.instagram || DEFAULT_INSTAGRAM).trim();
  const facebookUrl = (branding.socialLinks?.facebook || DEFAULT_FACEBOOK).trim();

  const trigger = (callback: () => void, policy: string) => () => {
    callback();
    window.dispatchEvent(new CustomEvent("open-policy", { detail: policy }));
  };
  const handlers: Record<string, () => void> = {
    "Privacy Policy": trigger(onOpenPrivacy, "privacy"),
    "Terms & Conditions": trigger(onOpenTerms, "terms"),
    "Orders & Shipping": trigger(onOpenOrdersShipping, "orders"),
    "Return & Refund Policy": trigger(onOpenRefund, "refund"),
    "Cookie Policy": trigger(onOpenCookies, "cookies"),
  };

  return (
    <footer
      className={`border-t transition-colors duration-200 ${
        isDark ? "border-neutral-800 bg-[#0a0a0a] text-white" : "border-[#e8e8e8] bg-white text-black"
      }`}
    >
      <div className="mx-auto max-w-screen-xl px-5 py-10 sm:px-8 md:px-16 md:py-16">
        <div className="mb-10 sm:mb-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1.5fr_1.5fr] gap-8 sm:gap-10 md:gap-12">
          {/* Brand Info */}
          <div className="col-span-1 sm:col-span-2 md:col-span-1">
            <button
              type="button"
              onClick={onOpenHome}
              className="mb-3 text-left text-base sm:text-lg font-extrabold uppercase tracking-[0.25em] hover:opacity-75 transition-opacity cursor-pointer"
            >
              {branding.brandName || "Know Pollen"}
            </button>
            <p className="mb-5 max-w-xs text-xs leading-relaxed text-black/50 dark:text-neutral-400">
              {branding.brandTagline || "Artisanal Fragrance House · Crafted to Be Remembered"}
            </p>
            <div className="flex items-center gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  title="Follow us on Instagram"
                  className="group flex h-9 w-9 items-center justify-center rounded-xl border border-black/15 dark:border-neutral-800 bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 hover:text-white hover:bg-gradient-to-tr hover:from-[#fd5949] hover:via-[#d6249f] hover:to-[#285AEB] hover:border-transparent transition-all duration-300 shadow-xs cursor-pointer"
                >
                  <Instagram size={15} className="transition-transform duration-300 group-hover:scale-110" />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  title="Follow us on Facebook"
                  className="group flex h-9 w-9 items-center justify-center rounded-xl border border-black/15 dark:border-neutral-800 bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 hover:text-white hover:bg-[#1877F2] hover:border-transparent transition-all duration-300 shadow-xs cursor-pointer"
                >
                  <Facebook size={15} className="transition-transform duration-300 group-hover:scale-110" />
                </a>
              )}
            </div>
          </div>

          {/* Mobile 2-column link container / Desktop direct grid items */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2 grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-[1fr_1.5fr]">
            {/* Fragrances & Company */}
            <div className="space-y-6">
              <div>
                <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 dark:text-neutral-500">
                  Fragrances
                </p>
                <div className="space-y-2.5">
                  {["Power of You", "Lost Cherry", "Fresh Orchid"].map((name) => (
                    <a
                      key={name}
                      href={`/${name.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={(e) => {
                        e.preventDefault();
                        const slug = name.toLowerCase().replace(/\s+/g, "-");
                        window.history.pushState(null, "", `/${slug}`);
                        window.dispatchEvent(new PopStateEvent("popstate"));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="block text-xs font-medium text-black/70 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
                    >
                      {name}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 dark:text-neutral-500">
                  Company
                </p>
                <button
                  type="button"
                  onClick={onOpenHome}
                  className="block text-left text-xs font-medium text-black/70 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  Know Pollen (Home)
                </button>
              </div>
            </div>

            {/* Policies */}
            <div>
              <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 dark:text-neutral-500">
                Policy
              </p>
              <div className="space-y-2.5">
                {policyLinks.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={handlers[label]}
                    className="block text-left text-xs font-medium text-black/70 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Us */}
          <div className="col-span-1 pt-4 sm:pt-0 border-t border-black/5 dark:border-neutral-800/80 sm:border-0">
            <p className="mb-3.5 text-[10px] font-bold uppercase tracking-[0.25em] text-black/40 dark:text-neutral-500">
              Contact Us
            </p>
            <div className="space-y-3">
              <a
                href={`mailto:${branding.supportEmail || "contactpollen@gmail.com"}`}
                className="inline-flex items-center gap-2.5 text-xs font-medium text-black/70 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors max-w-full"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 text-black/60 dark:text-neutral-300">
                  <Mail size={13} />
                </span>
                <span className="truncate">{branding.supportEmail || "contactpollen@gmail.com"}</span>
              </a>
              {branding.supportPhone && (
                <a
                  href={`https://wa.me/${branding.supportPhone.replace(/[^\d]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2.5 text-xs font-medium text-black/70 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 text-black/60 dark:text-neutral-300">
                    <MessageCircle size={13} />
                  </span>
                  <span>{branding.supportPhone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#e8e8e8] dark:border-neutral-800 pt-6 sm:pt-8 sm:flex-row text-center sm:text-left">
          <p className="text-[11px] tracking-wide text-black/45 dark:text-neutral-500">
            © 2026 {branding.brandName || "Pollen"}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <ServerStatusBadge />
            {isFeatureEnabled("adminDashboard") && onOpenAdminLogin && (
              <button
                type="button"
                onClick={onOpenAdminLogin}
                className="text-[11px] uppercase tracking-[0.2em] text-black/45 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title="Admin Access"
              >
                Admin
              </button>
            )}
            <span className="text-black/20 dark:text-neutral-700 hidden sm:inline">·</span>
            <p className="text-[11px] uppercase tracking-[0.2em] text-black/45 dark:text-neutral-500">
              Crafted in India
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}