import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Gift,
  LogOut,
  Minus,
  Moon,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Trash2,
  Truck,
  User as UserIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTenantConfig } from "@/config/tenantContext";

import { NAV_ITEMS, type FragranceProduct } from "./data";

export type CartItem = { id: number; name: string; img: string; price: number; quantity: number };

export function HamburgerButton({
  onClick,
  open,
  isDark = false,
}: {
  onClick: () => void;
  open: boolean;
  isDark?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle menu"
      className="flex flex-col gap-[4px] sm:gap-[5px] cursor-pointer p-1.5 sm:p-2 h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10 justify-center items-center group rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`block transition-all duration-300 ${isDark ? "bg-white" : "bg-black"}`}
          style={{
            width: i === 1 ? (open ? "18px" : "13px") : "18px",
            height: "1.5px",
            transformOrigin: "center",
          }}
        />
      ))}
    </button>
  );
}

export function TopBar({
  menuOpen,
  onMenuToggle,
  user,
  onBuyNow,
  onOpenHome,
  onOpenAbout,
  onOpenGiftSet,
  onOpenFragrances,
  onOpenTrackOrder,
  showTrackOrder = true,
  cartCount,
  onCartOpen,
  onLogin,
  onOpenAdmin,
  onOpenAdminLogin,
  onProfileSettings,
}: {
  menuOpen: boolean;
  onMenuToggle: () => void;
  user: { name: string; email: string; role?: string } | null;
  onBuyNow: () => void;
  onOpenHome: () => void;
  onOpenAbout?: () => void;
  onOpenGiftSet?: () => void;
  onOpenFragrances?: () => void;
  onOpenTrackOrder?: () => void;
  showTrackOrder?: boolean;
  cartCount: number;
  onCartOpen: () => void;
  onLogin: () => void;
  onOpenAdmin: () => void;
  onOpenAdminLogin: () => void;
  onProfileSettings: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { config, updateConfig } = useTenantConfig();
  const isDark = config.theme?.mode === "dark";

  const showBanner = Boolean(
    config.theme?.bannerEnabled && config.theme?.bannerText && !bannerDismissed
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(showBanner ? 104 : 72);

  const handleToggleTheme = () => {
    const nextMode = isDark ? "light" : "dark";
    updateConfig({
      theme: {
        ...config.theme,
        mode: nextMode,
      },
    });
  };

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setHeaderHeight(containerRef.current.offsetHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [showBanner, scrolled]);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-x-0 top-0 z-40 transition-all duration-300"
      >
        {/* Dynamic Top Announcement Banner */}
        {showBanner && (
          <div
            style={{ backgroundColor: config.theme?.accentColor || "#f59e0b" }}
            className={`relative z-50 w-full transition-all duration-300 overflow-hidden ${
              scrolled
                ? "max-h-0 opacity-0 pointer-events-none -translate-y-full"
                : "max-h-24 opacity-100 py-1.5 sm:py-2 px-8 sm:px-12"
            }`}
          >
            <div className="flex items-center justify-center max-w-screen-xl mx-auto w-full text-center">
              <span className="text-[10px] sm:text-[11px] md:text-xs font-bold tracking-wider sm:tracking-[0.16em] uppercase text-black leading-tight sm:leading-normal select-none">
                {config.theme?.bannerText}
              </span>
            </div>

            {/* Dismiss banner button */}
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss announcement banner"
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-1 text-black/60 hover:text-black hover:bg-black/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
        )}

        <header
          className="w-full px-2 sm:px-6 md:px-8 lg:px-10 transition-all duration-300"
          style={{
            height: scrolled ? "52px" : "64px",
            background: isDark ? "rgba(10,10,10,0.88)" : "rgba(255,255,255,0.78)",
            backdropFilter: "blur(12px)",
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.14)",
            color: isDark ? "#ffffff" : "#000000",
          }}
        >
        <div className="mx-auto flex h-full w-full max-w-screen-xl items-center justify-between gap-1 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <HamburgerButton onClick={onMenuToggle} open={menuOpen} isDark={isDark} />
            <button
              type="button"
              onClick={onOpenHome}
              aria-label="Go to Know Pollen homepage"
              className={`text-[11px] min-[360px]:text-xs sm:text-sm font-bold tracking-[0.14em] sm:tracking-[0.24em] uppercase select-none whitespace-nowrap cursor-pointer hover:opacity-75 active:scale-95 transition-all shrink-0 ${
                isDark ? "text-white" : "text-black"
              }`}
            >
              Know Pollen
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
            <button
              type="button"
              onClick={onOpenAbout || onOpenHome}
              className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                isDark ? "text-white hover:text-white/70" : "text-black hover:text-black/60"
              }`}
            >
              Know Pollen
            </button>
            {onOpenGiftSet && (
              <button
                type="button"
                onClick={onOpenGiftSet}
                className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                  isDark ? "text-white/80 hover:text-white" : "text-black/70 hover:text-black"
                }`}
              >
                Gift Set
              </button>
            )}
            <a
              href="#shop-collection"
              onClick={(e) => {
                e.preventDefault();
                if (onOpenFragrances) {
                  onOpenFragrances();
                } else {
                  const el = document.getElementById("shop-collection");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                isDark ? "text-white/80 hover:text-white" : "text-black/70 hover:text-black"
              }`}
            >
              Fragrances
            </a>
            {showTrackOrder && (
              <a
                href="#track"
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenTrackOrder) {
                    onOpenTrackOrder();
                  } else {
                    const el = document.getElementById("track");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors cursor-pointer ${
                  isDark ? "text-white/80 hover:text-white" : "text-black/70 hover:text-black"
                }`}
              >
                Track Order
              </a>
            )}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Day / Night Theme Button */}
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={isDark ? "Switch to Day mode" : "Switch to Night mode"}
              title={isDark ? "Switch to Day mode (Light)" : "Switch to Night mode (Dark)"}
              className={`relative flex h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10 items-center justify-center border rounded-lg sm:rounded-xl transition-all cursor-pointer shrink-0 ${
                isDark
                  ? "border-white/20 bg-neutral-900 text-amber-400 hover:bg-neutral-800 hover:border-amber-400/50 shadow-xs"
                  : "border-black/20 bg-white text-neutral-800 hover:bg-black hover:text-white"
              }`}
            >
              {isDark ? (
                <Sun size={15} className="transition-transform duration-300 hover:rotate-90 text-amber-400" />
              ) : (
                <Moon size={15} className="transition-transform duration-300 hover:-rotate-12 text-neutral-800 hover:text-white" />
              )}
            </button>

            {/* Top Right: User Account / Login Button */}
            {user ? (
              <button
                type="button"
                onClick={
                  user.role === "admin" || user.role === "superadmin" || user.email === "admin@pollen.com"
                    ? onOpenAdmin
                    : onProfileSettings
                }
                className={`flex h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-auto items-center justify-center sm:justify-start gap-1.5 border rounded-lg sm:rounded-xl px-0 sm:px-3 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? "border-white/20 bg-neutral-900 text-white hover:bg-neutral-800"
                    : "border-black/20 bg-white text-black hover:bg-neutral-100"
                }`}
                title={
                  user.role === "admin" || user.role === "superadmin" || user.email === "admin@pollen.com"
                    ? "Admin Dashboard"
                    : "My Profile"
                }
              >
                {user.role === "admin" || user.role === "superadmin" || user.email === "admin@pollen.com" ? (
                  <>
                    <ShieldCheck size={14} className="text-amber-500 shrink-0" />
                    <span className="hidden sm:inline">Admin</span>
                  </>
                ) : (
                  <>
                    <UserIcon size={14} className="shrink-0" />
                    <span className="hidden sm:inline">Profile</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onLogin}
                className={`flex h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-auto items-center justify-center sm:justify-start gap-1.5 border rounded-lg sm:rounded-xl px-0 sm:px-3 text-[10px] sm:text-xs font-bold uppercase tracking-[0.12em] transition-colors cursor-pointer shrink-0 ${
                  isDark
                    ? "border-white/20 bg-neutral-900 text-white hover:bg-white hover:text-black"
                    : "border-black/20 bg-white text-black hover:bg-black hover:text-white"
                }`}
                title="Login"
              >
                <UserIcon size={14} className="shrink-0" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              type="button"
              onClick={onCartOpen}
              aria-label={`Open cart${cartCount ? `, ${cartCount} items` : ""}`}
              className={`relative flex h-8 w-8 min-[380px]:h-9 min-[380px]:w-9 sm:h-10 sm:w-10 items-center justify-center border rounded-lg sm:rounded-xl transition-colors cursor-pointer shrink-0 ${
                isDark
                  ? "border-white/20 bg-neutral-900 text-white hover:bg-neutral-800"
                  : "border-black/20 bg-white hover:bg-black hover:text-white"
              }`}
            >
              <ShoppingBag size={15} />
              {cartCount > 0 && (
                <span
                  className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center px-1 text-[9px] font-bold rounded-full ${
                    isDark ? "bg-amber-400 text-black" : "bg-black text-white"
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </button>

            {/* Buy Now Button */}
            <button
              type="button"
              onClick={onBuyNow}
              className={`text-[9px] min-[360px]:text-[10px] md:text-xs font-bold tracking-[0.1em] min-[360px]:tracking-[0.14em] sm:tracking-[0.18em] uppercase px-2 min-[360px]:px-2.5 sm:px-4 md:px-5 h-8 min-[380px]:h-9 sm:h-10 inline-flex items-center justify-center rounded-lg sm:rounded-xl transition-all duration-200 whitespace-nowrap cursor-pointer shadow-xs shrink-0 active:scale-95 ${
                isDark ? "bg-white text-black hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"
              }`}
              style={{ textDecoration: "none", border: "none" }}
            >
              Buy Now
            </button>
          </div>
        </div>
      </header>
    </div>
    <div
      aria-hidden="true"
      className="transition-all duration-300"
      style={{ height: `${headerHeight}px` }}
    />
  </>
  );
}

export function CartDrawer({
  open,
  items,
  onClose,
  onChangeQuantity,
  onRemove,
  onEmpty,
  onCheckout,
}: {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onChangeQuantity: (id: number, change: number) => void;
  onRemove: (id: number) => void;
  onEmpty: () => void;
  onCheckout: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/20"
            onClick={onClose}
          />
          <motion.aside
            key="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.35 }}
            className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-full sm:max-w-md flex-col bg-white dark:bg-[#121212] text-black dark:text-white border-l border-black/10 dark:border-neutral-800 shadow-2xl transition-colors duration-200"
          >
            <div className="flex items-center justify-between border-b border-black/10 dark:border-neutral-800 px-4 py-5 sm:px-6 sm:py-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-black/45 dark:text-neutral-400">
                  Your selection
                </p>
                <h2 className="mt-1 text-lg sm:text-xl font-bold text-black dark:text-white">Cart</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close cart"
                className="flex h-9 w-9 items-center justify-center border border-black/10 dark:border-neutral-700 text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
              {items.length === 0 ? (
                <p className="py-12 text-center text-sm text-black/50 dark:text-neutral-400">Your cart is empty.</p>
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 sm:gap-4 border-b border-black/10 dark:border-neutral-800 pb-4 sm:pb-5">
                      <img src={item.img} alt={item.name} className="h-20 w-14 sm:h-24 sm:w-16 object-cover shrink-0 rounded-xs" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 pr-2">
                            <p className="text-xs sm:text-sm font-bold text-black dark:text-white truncate">{item.name}</p>
                            <p className="mt-0.5 text-xs text-black/50 dark:text-neutral-400">
                              ₹{item.price.toLocaleString()}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onRemove(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="p-1 text-black/40 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onChangeQuantity(item.id, -1)}
                            aria-label={`Decrease ${item.name} quantity`}
                            className="flex h-7 w-7 items-center justify-center border border-black/15 dark:border-neutral-700 text-xs text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-6 text-center text-xs sm:text-sm font-semibold text-black dark:text-white">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onChangeQuantity(item.id, 1)}
                            aria-label={`Increase ${item.name} quantity`}
                            className="flex h-7 w-7 items-center justify-center border border-black/15 dark:border-neutral-700 text-xs text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && (
              <div className="flex gap-2 sm:gap-3 border-t border-black/10 dark:border-neutral-800 p-4 sm:p-6">
                <button
                  type="button"
                  onClick={onEmpty}
                  className="flex-1 border border-black/20 dark:border-neutral-700 px-3 py-3.5 sm:px-4 sm:py-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors cursor-pointer"
                >
                  Empty cart
                </button>
                <button
                  type="button"
                  onClick={onCheckout}
                  className="flex-1 bg-black dark:bg-white px-3 py-3.5 sm:px-4 sm:py-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] sm:tracking-[0.2em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Buy Now
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function SideMenu({
  open,
  onClose,
  onBuyNow,
  onOpenGiftSet,
  onOpenHome,
  onOpenAbout,
  onOpenFragrance,
  onOpenFragrances,
  onOpenTrackOrder,
  user,
  onLogin,
  onProfileSettings,
  onSignOut,
  onOpenOrderHistory,
  onOpenAdmin,
  onOpenAdminLogin,
  fragrances = [],
}: {
  open: boolean;
  onClose: () => void;
  onBuyNow: () => void;
  onOpenGiftSet?: () => void;
  onOpenHome: () => void;
  onOpenAbout?: () => void;
  onOpenFragrance: (id: number) => void;
  onOpenFragrances?: () => void;
  onOpenTrackOrder?: () => void;
  user: { name: string; email: string; role?: string } | null;
  onLogin: () => void;
  onProfileSettings: () => void;
  onSignOut: () => void;
  onOpenOrderHistory: () => void;
  onOpenAdmin?: () => void;
  onOpenAdminLogin?: () => void;
  fragrances?: FragranceProduct[];
}) {
  const [fragrancesOpen, setFragrancesOpen] = useState(false);
  const { config, updateConfig } = useTenantConfig();
  const isDark = config.theme?.mode === "dark";

  const handleToggleTheme = () => {
    const nextMode = isDark ? "light" : "dark";
    updateConfig({
      theme: {
        ...config.theme,
        mode: nextMode,
      },
    });
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawerVariants = {
    hidden: { x: "-100%", opacity: 0.95 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 32,
        mass: 0.85,
        staggerChildren: 0.045,
        delayChildren: 0.06,
      },
    },
    exit: {
      x: "-100%",
      opacity: 0.95,
      transition: {
        duration: 0.28,
        ease: [0.32, 0, 0.08, 1],
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -18 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 280,
        damping: 24,
      },
    },
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Glassmorphic Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
          />

          {/* Modern Motion Drawer */}
          <motion.aside
            key="drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 left-0 z-50 flex h-full w-full flex-col justify-between overflow-y-auto bg-white/98 dark:bg-[#0c0c0c]/98 backdrop-blur-xl text-black dark:text-white transition-colors duration-300 shadow-2xl"
            style={{
              width: "min(380px, 88vw)",
              borderRight: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-7 pt-6 pb-4 border-b border-black/8 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-black dark:bg-white text-white dark:text-black font-black text-xs tracking-wider shadow-sm">
                  P
                </div>
                <div>
                  <span className="text-xs tracking-[0.24em] font-bold text-black dark:text-white uppercase block">
                    Know Pollen
                  </span>
                  <span className="text-[9px] tracking-[0.2em] font-medium text-neutral-400 dark:text-neutral-500 uppercase block -mt-0.5">
                    Haute Parfumerie
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="h-8 w-8 rounded-full border border-black/10 dark:border-white/15 bg-black/5 dark:bg-white/5 flex items-center justify-center text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:rotate-90 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {/* User Profile Card or Sign In Banner */}
              {user ? (
                <motion.div variants={itemVariants} className="px-6 sm:px-7">
                  <div className="p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-900/80 border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-black font-bold text-sm flex items-center justify-center shrink-0 shadow-xs uppercase">
                        {user.name?.charAt(0) || "U"}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-black dark:text-white truncate block">
                            {user.name}
                          </span>
                          {user.role === "admin" && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 px-1.5 py-0.2 rounded-md">
                              Admin
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate block">
                          {user.email}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants} className="px-6 sm:px-7">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogin();
                    }}
                    className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-500/25 hover:border-amber-500/50 text-left flex items-center justify-between group transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-amber-400/20 text-amber-500 flex items-center justify-center shrink-0">
                        <UserIcon size={16} />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-black dark:text-white uppercase tracking-wider block">
                          Sign In / Account
                        </span>
                        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block">
                          Track orders & member benefits
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}

              {/* Navigation Links Group */}
              <nav className="px-6 sm:px-7 space-y-1">
                {/* Admin Dashboard Entry (if admin) */}
                {user && (user.role === "admin" || user.role === "superadmin" || user.email === "admin@pollen.com") && (
                  <motion.div variants={itemVariants}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAdmin?.();
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 hover:border-amber-500/60 text-left text-amber-900 dark:text-amber-200 transition-all cursor-pointer group"
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.14em] flex items-center gap-2.5">
                        <ShieldCheck size={16} className="text-amber-500 shrink-0" />
                        Admin Dashboard
                      </span>
                      <ArrowRight size={14} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {/* Home */}
                <motion.div variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenHome();
                    }}
                    className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-left text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.14em] group-hover:translate-x-1 transition-transform">
                      Know Pollen (Home)
                    </span>
                    <ArrowRight size={13} className="text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </motion.div>

                {/* About POLLEN (Brand Story) */}
                <motion.div variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenAbout) {
                        onOpenAbout();
                      } else {
                        const el = document.getElementById("about");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                        else onOpenHome();
                      }
                    }}
                    className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-left text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.14em] group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      <Sparkles size={14} className="text-neutral-400 group-hover:text-amber-400 transition-colors" />
                      About POLLEN
                    </span>
                    <ArrowRight size={13} className="text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </motion.div>

                {/* The Collection */}
                {NAV_ITEMS.filter((item) => item.label === "SHOP").map((item) => (
                  <motion.div key={item.label} variants={itemVariants}>
                    <a
                      href="#shop-collection"
                      onClick={(e) => {
                        e.preventDefault();
                        onClose();
                        if (onOpenFragrances) {
                          onOpenFragrances();
                        } else {
                          const el = document.getElementById("shop-collection");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                          else onOpenHome();
                        }
                      }}
                      className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-left text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
                      style={{ textDecoration: "none" }}
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.14em] group-hover:translate-x-1 transition-transform flex items-center gap-2">
                        <Package size={14} className="text-neutral-400 group-hover:text-amber-400 transition-colors" />
                        Shop The Collection
                      </span>
                      <ArrowRight size={13} className="text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </a>
                  </motion.div>
                ))}

                {/* Discovery Gift Set */}
                {onOpenGiftSet && (
                  <motion.div variants={itemVariants}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenGiftSet();
                      }}
                      className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-left text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
                    >
                      <span className="text-xs font-bold uppercase tracking-[0.14em] group-hover:translate-x-1 transition-transform flex items-center gap-2">
                        <Gift size={14} className="text-amber-500" />
                        Discovery Gift Set
                      </span>
                      <ArrowRight size={13} className="text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  </motion.div>
                )}

                {/* Fragrances Dropdown Accordion */}
                <motion.div variants={itemVariants} className="pt-1">
                  <button
                    type="button"
                    onClick={() => setFragrancesOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-left text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.14em] group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      <Sparkles size={14} className="text-neutral-400 group-hover:text-amber-400 transition-colors" />
                      Individual Fragrances
                    </span>
                    <ChevronDown
                      size={15}
                      className={`text-neutral-400 transition-transform duration-300 ${
                        fragrancesOpen ? "rotate-180 text-amber-500" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {fragrancesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden pl-4 pr-1 py-1 space-y-1"
                      >
                        {fragrances
                          .filter((f) => !f.isBundle)
                          .map((fragrance) => (
                            <button
                              key={fragrance.id}
                              type="button"
                              onClick={() => {
                                onClose();
                                if (fragrance.id === 1 || fragrance.id === 2 || fragrance.id === 3) {
                                  onOpenFragrance(fragrance.id);
                                } else {
                                  window.location.hash = "fragrances";
                                }
                              }}
                              className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-left text-xs font-medium uppercase tracking-[0.14em] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 group-hover:scale-150 transition-transform" />
                                <span>{fragrance.name}</span>
                              </div>
                              <span className="text-[10px] text-neutral-400 font-mono">₹{fragrance.price}</span>
                            </button>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Track Order */}
                <motion.div variants={itemVariants}>
                  <a
                    href="#track"
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      if (onOpenTrackOrder) {
                        onOpenTrackOrder();
                      } else {
                        const el = document.getElementById("track");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                        else onOpenHome();
                      }
                    }}
                    className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-left text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
                    style={{ textDecoration: "none" }}
                  >
                    <span className="text-xs font-bold uppercase tracking-[0.14em] group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      <Truck size={14} className="text-neutral-400 group-hover:text-amber-400 transition-colors" />
                      Track Speed Post Order
                    </span>
                    <ArrowRight size={13} className="text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </a>
                </motion.div>

                {/* User Specific Links */}
                {user && (
                  <>
                    <motion.div variants={itemVariants}>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenOrderHistory();
                        }}
                        className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-left text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
                      >
                        <span className="text-xs font-bold uppercase tracking-[0.14em] group-hover:translate-x-1 transition-transform flex items-center gap-2">
                          <ShoppingBag size={14} className="text-neutral-400 group-hover:text-amber-400 transition-colors" />
                          My Orders History
                        </span>
                        <ArrowRight size={13} className="text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onProfileSettings();
                        }}
                        className="w-full flex items-center justify-between py-3 px-2 rounded-xl text-left text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all group cursor-pointer"
                      >
                        <span className="text-xs font-bold uppercase tracking-[0.14em] group-hover:translate-x-1 transition-transform flex items-center gap-2">
                          <UserIcon size={14} className="text-neutral-400 group-hover:text-amber-400 transition-colors" />
                          Profile & Addresses
                        </span>
                        <ArrowRight size={13} className="text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </motion.div>
                  </>
                )}
              </nav>

              {/* Day / Night Theme Switcher */}
              <motion.div variants={itemVariants} className="px-6 sm:px-7 pt-2">
                <div className="p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-black/5 dark:border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => isDark && handleToggleTheme()}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !isDark
                        ? "bg-white text-black shadow-xs"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Sun size={14} className={!isDark ? "text-amber-500" : ""} />
                    <span>Day Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => !isDark && handleToggleTheme()}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isDark
                        ? "bg-white text-black shadow-xs"
                        : "text-neutral-500 hover:text-black"
                    }`}
                  >
                    <Moon size={14} className={isDark ? "text-amber-500" : ""} />
                    <span>Night Dark</span>
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="px-6 sm:px-7 py-5 border-t border-black/8 dark:border-white/10 shrink-0 flex items-center justify-between bg-black/2 dark:bg-white/2">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <span className="text-[10px] tracking-[0.24em] uppercase text-neutral-400 dark:text-neutral-500 font-bold">
                  Pollen Atelier
                </span>
              )}

              <span className="text-[10px] tracking-[0.18em] uppercase text-neutral-400 dark:text-neutral-500 font-medium">
                © 2026 Pollen
              </span>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
