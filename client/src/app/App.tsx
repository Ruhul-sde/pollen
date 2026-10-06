import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, CreditCard, ShieldCheck, Smartphone, X, Zap } from "lucide-react";
import { toast } from "sonner";

import { AuthModal, ProfileSettings, type User } from "./auth";
import { useTenantConfig } from "@/config/tenantContext";
import {
  mapBackendToFragrance,
  type FragranceProduct,
  PRODUCT_IMAGE_MAP,
} from "./data";
import { fetchProducts, adminLogin, registerCustomer, loginCustomer, continueWithEmail, clearAdminToken } from "./api";
import { Footer } from "./footer";
import giftGalleryOne from "./Images/4a.PNG";
import {
  CookiePolicySection,
  OrdersShippingSection,
  PrivacyPolicySection,
  RefundPolicySection,
  TermsSection,
} from "./legal";
import { CartDrawer, SideMenu, TopBar, type CartItem } from "./navigation";
import {
  BottleCarousel,
  CheckoutSection,
  CollectionPageWithBack,
  FreshOrchidPageWithRecommendations,
  GiftSetPage,
  Hero,
  IntroStories,
  LostCherryPageWithRecommendations,
  MomentSection,
  PerfumeVariants,
  PowerOfYouPageWithRecommendations,
  PricingSection,
  TrackBanner,
} from "./sections";
import {
  capturePayment,
  createOrder,
  createPaymentOrder,
  createSavedAddress,
  deleteOrder,
  getOrdersByUser,
  getSavedAddresses,
  markOrderPaid,
  setCustomSession,
  supabase,
  updateSavedAddress,
  verifyPayment,
  type SavedAddress,
} from "./supabase";
import { AdminDashboard } from "./components/AdminDashboard";
import { AdminLoginModal } from "./components/AdminLoginModal";
import { MyOrdersSection, type OrderRecord } from "./components/MyOrdersSection";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, handler: (response: any) => void) => void };
  }
}

const getPathname = () => {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/know-pollen" || pathname === "/knowpollen") {
    return "/";
  }
  return pathname;
};

const getInitialDetailRoute = () => {
  const pathname = window.location.pathname;
  if (
    [
      "/gift-set",
      "/collection",
      "/power-of-you",
      "/lost-cherry",
      "/fresh-orchid",
    ].includes(pathname)
  ) {
    return pathname;
  }
  return pathname;
};

const GiftSetGallerySection = (props: {
  route: string;
  products?: FragranceProduct[];
  onAddBundle: () => void;
  onBack: () => void;
  onSelectVariant: (route: string) => void;
  quantities: { power: number; lost: number; fresh: number };
  onChangeQuantity: (id: number, change: number) => void;
  onBuyProduct?: (productId: number) => void;
}) => {
  const prods = props.products && props.products.length > 0 ? props.products : [];
  const powerProduct = prods.find((p) => p.slug === "power-of-you" || p.id === 1);
  const lostProduct = prods.find((p) => p.slug === "lost-cherry" || p.id === 2);
  const freshProduct = prods.find((p) => p.slug === "fresh-orchid" || p.id === 3);
  const bundleProduct = prods.find((p) => p.slug === "gift-set" || p.id === 4 || p.isBundle);

  return props.route === "/collection" ? (
    <CollectionPageWithBack
      products={prods}
      onAddToCart={(item) =>
        window.dispatchEvent(new CustomEvent("collection-add-to-cart", { detail: item }))
      }
      onBack={props.onBack}
    />
  ) : props.route === "/power-of-you" ? (
    <div className="perfume-route">
      <PowerOfYouPageWithRecommendations
        product={powerProduct}
        onAddToCart={() => window.dispatchEvent(new CustomEvent("power-of-you-add-to-cart"))}
        onBuyNow={() => props.onBuyProduct?.(1)}
        onBack={props.onBack}
        quantity={props.quantities.power}
        onChangeQuantity={(change) => props.onChangeQuantity(1, change)}
      />
      <PerfumeVariants currentName="Power of You" fragrances={prods} onSelectVariant={props.onSelectVariant} />
    </div>
  ) : props.route === "/lost-cherry" ? (
    <div className="perfume-route">
      <LostCherryPageWithRecommendations
        product={lostProduct}
        onAddToCart={() => window.dispatchEvent(new CustomEvent("lost-cherry-add-to-cart"))}
        onBuyNow={() => props.onBuyProduct?.(2)}
        onBack={props.onBack}
        quantity={props.quantities.lost}
        onChangeQuantity={(change) => props.onChangeQuantity(2, change)}
      />
      <PerfumeVariants currentName="Lost Cherry" fragrances={prods} onSelectVariant={props.onSelectVariant} />
    </div>
  ) : props.route === "/fresh-orchid" ? (
    <div className="perfume-route">
      <FreshOrchidPageWithRecommendations
        product={freshProduct}
        onAddToCart={() => window.dispatchEvent(new CustomEvent("fresh-orchid-add-to-cart"))}
        onBuyNow={() => props.onBuyProduct?.(3)}
        onBack={props.onBack}
        quantity={props.quantities.fresh}
        onChangeQuantity={(change) => props.onChangeQuantity(3, change)}
      />
      <PerfumeVariants currentName="Fresh Orchid" fragrances={prods} onSelectVariant={props.onSelectVariant} />
    </div>
  ) : (
    <GiftSetPage
      {...props}
      product={bundleProduct}
      onBuyNow={() => props.onBuyProduct?.(4)}
      onOpenPrivacy={() =>
        window.dispatchEvent(new CustomEvent("open-policy", { detail: "privacy" }))
      }
      onOpenTerms={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "terms" }))}
      onOpenRefund={() =>
        window.dispatchEvent(new CustomEvent("open-policy", { detail: "refund" }))
      }
      onOpenCookies={() =>
        window.dispatchEvent(new CustomEvent("open-policy", { detail: "cookies" }))
      }
      onOpenOrdersShipping={() =>
        window.dispatchEvent(new CustomEvent("open-policy", { detail: "orders" }))
      }
    />
  );
};

const GLOBAL_STYLES = `
  html { scroll-behavior: smooth; overflow-x: hidden; }
  body { overflow-x: hidden; }
  .perfume-route { position: relative; }
  @media (max-width: 1023px) {
    .perfume-route > .perfume-variant-picker { position: absolute; top: calc(84vw + 2px); left: 0; width: 100%; z-index: 2; }
    .perfume-route > div:first-child section > div > div:last-child { padding-top: 110px; }
  }
  @media (min-width: 768px) and (max-width: 1023px) {
    .perfume-route > .perfume-variant-picker { position: absolute; top: calc(188vw + 32px); left: 0; right: auto; width: 100%; z-index: 2; }
    .perfume-route > div:first-child section > div > div:last-child { padding-top: 520px; }
  }
  @media (min-width: 1024px) {
    .perfume-route > .perfume-variant-picker { position: absolute; top: 480px; right: 0; width: 42%; z-index: 2; }
  }
  [class*="mt-12"][class*="border-t"][class*="border-black/10"][class*="pt-5"] { display: none !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #fff; }
  ::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 2px; }
  html.dark ::-webkit-scrollbar-track { background: #0a0a0a; }
  html.dark ::-webkit-scrollbar-thumb { background: #333333; }
  ::selection { background: rgba(0,0,0,0.12); }
  html.dark ::selection { background: rgba(255,255,255,0.2); }
  #fragrances > div:nth-child(2) article > div:first-child { background: #fff; }
  #fragrances > div:nth-child(2) article > div:first-child img { object-fit: contain; mix-blend-mode: multiply; }
  html.dark #fragrances { background: #0a0a0a !important; }
  html.dark #fragrances .bottle-stage-panel { background-color: #0a0a0a !important; }
  html.dark #fragrances > div:nth-child(2) article > div:first-child { background: #121212; }
  html.dark #fragrances > div:nth-child(2) article > div:first-child img { mix-blend-mode: normal; }
  .bottle-stage-panel {
    background-position: center 5px;
    background-size: auto 76%;
  }
  @media (min-width: 640px) {
    .bottle-stage-panel {
      background-position: center 10px;
      background-size: auto 78%;
    }
  }
  @media (min-width: 1024px) {
    .bottle-stage-panel {
      background-position: center 15px;
      background-size: auto 80%;
    }
  }
  @media (min-width: 768px) {
    .hidden.grid-cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .hidden.grid-cols-4 > div:first-child { grid-column: span 2; }
  }
  @media (min-width: 1024px) {
    [class*="max-w-[1440px]"] { align-items: start; }
    [class*="max-w-[1440px]"] > div:last-child { position: sticky; top: 0; align-self: start; height: fit-content; }
  }
  @media (max-width: 767px) {
    button[aria-label="Previous gift set image"], button[aria-label="Next gift set image"] { display: none; }
  }
  @keyframes slide-progress { from { width: 0%; } to { width: 100%; } }
`;

function scrollToHash(hash: string) {
  const target = hash === "#" ? null : document.querySelector(hash);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
  window.history.pushState(null, "", hash);
}

function returnToHome() {
  window.history.replaceState(null, "", "/");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function App() {
  const { config, isFeatureEnabled } = useTenantConfig();
  const [menuOpen, setMenuOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [ordersShippingOpen, setOrdersShippingOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cookiesOpen, setCookiesOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<User | null>(null);
  const [authProvider, setAuthProvider] = useState("email");
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(() => window.location.pathname === "/checkout");
  const [giftSetOpen, setGiftSetOpen] = useState(() =>
    ["/gift-set", "/collection", "/power-of-you", "/lost-cherry", "/fresh-orchid"].includes(
      getPathname(),
    ),
  );
  const [activeRoute, setActiveRoute] = useState(() => getPathname());
  const [checkoutAfterLogin, setCheckoutAfterLogin] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<{
    id: string;
    tracking_id: string;
    status: string;
    total_amount: number | null;
    created_at: string;
    title: string;
    delivery_phone: string | null;
    delivery_address: string | null;
    coupon_code?: string | null;
    coupon_discount?: number | null;
  } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(() =>
    ["/my-orders", "/my-order", "/orders"].includes(getPathname()),
  );
  const [orderHistory, setOrderHistory] = useState<OrderRecord[]>([]);
  const [pendingNoticeDismissed, setPendingNoticeDismissed] = useState(false);
  const [fragrances, setFragrances] = useState<FragranceProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const shopScrollY = useRef(0);
  const pendingScrollRestore = useRef<number | null>(null);

  const reloadProducts = async () => {
    try {
      const items = await fetchProducts();
      if (items && items.length > 0) {
        setFragrances(items.map(mapBackendToFragrance));
      }
    } catch (err) {
      console.warn("Failed to refresh products:", err);
    }
  };

  useEffect(() => {
    let mounted = true;
    setProductsLoading(true);
    fetchProducts()
      .then((items) => {
        if (!mounted) return;
        if (items && items.length > 0) {
          const mapped = items.map(mapBackendToFragrance);
          setFragrances(mapped);
        }
      })
      .catch((err) => {
        console.warn("Failed to fetch products from backend:", err);
      })
      .finally(() => {
        if (mounted) setProductsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleOpenDrawer = () => setCartOpen(true);
    window.addEventListener("open-cart-drawer", handleOpenDrawer);
    return () => window.removeEventListener("open-cart-drawer", handleOpenDrawer);
  }, []);

  useEffect(() => {
    const handlePolicyNavigation = (event: Event) => {
      const policy = (event as CustomEvent<string>).detail;
      shopScrollY.current = window.scrollY;
      window.history.pushState({ legal: true }, "", window.location.pathname);
      if (policy === "privacy") setPrivacyOpen(true);
      if (policy === "terms") setTermsOpen(true);
      if (policy === "orders") setOrdersShippingOpen(true);
      if (policy === "refund") setRefundOpen(true);
      if (policy === "cookies") setCookiesOpen(true);
    };
    window.addEventListener("open-policy", handlePolicyNavigation);
    return () => window.removeEventListener("open-policy", handlePolicyNavigation);
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }
    let mounted = true;
    getSavedAddresses(user.id)
      .then((addresses) => {
        if (!mounted) return;
        setSavedAddresses(addresses);
        setSelectedAddressId((current) => (current && addresses.some((a) => a.id === current) ? current : (addresses[0]?.id ?? null)));
      })
      .catch((error) => {
        console.warn("Unable to load addresses:", error);
      });
    return () => {
      mounted = false;
    };
  }, [user?.id, checkoutOpen]);

  useEffect(() => {
    if (!orderHistoryOpen || !user?.id) return;
    let mounted = true;
    getOrdersByUser(user.id)
      .then((orders) => {
        if (!mounted) return;
        setOrderHistory(
          orders.map((order) => ({
            ...order,
            title: order.total_amount
              ? `${order.customer_name || user.name || "Customer"} · Order ${order.order_id || (order as any).orderId || `#${order.id?.slice(-8).toUpperCase()}`}`
              : (order.customer_name ?? "Pollen Fragrance Order"),
            customer_name: order.customer_name || user.name || "Customer",
            delivery_phone: order.delivery_phone || user.phone || null,
            delivery_address: order.delivery_address || null,
          })),
        );
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [orderHistoryOpen, user?.id, user?.name, user?.phone]);

  useEffect(() => {
    const handleCollectionAdd = (event: Event) =>
      handleAddToCart(
        (event as CustomEvent<{ id: number; name: string; img: string; price: number }>).detail,
      );
    const handlePowerOfYouAdd = () => {
      const p = fragrances.find((f) => f.slug === "power-of-you" || f.id === 1);
      if (p) handleAddToCart({ id: p.id, name: p.name, img: p.img, price: p.price });
    };
    const handleLostCherryAdd = () => {
      const p = fragrances.find((f) => f.slug === "lost-cherry" || f.id === 2);
      if (p) handleAddToCart({ id: p.id, name: p.name, img: p.img, price: p.price });
    };
    const handleFreshOrchidAdd = () => {
      const p = fragrances.find((f) => f.slug === "fresh-orchid" || f.id === 3);
      if (p) handleAddToCart({ id: p.id, name: p.name, img: p.img, price: p.price });
    };
    window.addEventListener("collection-add-to-cart", handleCollectionAdd);
    window.addEventListener("power-of-you-add-to-cart", handlePowerOfYouAdd);
    window.addEventListener("lost-cherry-add-to-cart", handleLostCherryAdd);
    window.addEventListener("fresh-orchid-add-to-cart", handleFreshOrchidAdd);
    return () => {
      window.removeEventListener("collection-add-to-cart", handleCollectionAdd);
      window.removeEventListener("power-of-you-add-to-cart", handlePowerOfYouAdd);
      window.removeEventListener("lost-cherry-add-to-cart", handleLostCherryAdd);
      window.removeEventListener("fresh-orchid-add-to-cart", handleFreshOrchidAdd);
    };
  }, [fragrances]);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem("know-pollen-cart");
      if (!savedCart) return [];
      const parsed = JSON.parse(savedCart) as CartItem[];
      return parsed.map((item) => ({
        ...item,
        img:
          item.img && !item.img.startsWith("data:") && item.img.length < 500
            ? item.img
            : PRODUCT_IMAGE_MAP[String(item.id)] ||
              PRODUCT_IMAGE_MAP[item.name] ||
              item.img ||
              "",
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (!fragrances || fragrances.length === 0) return;
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        const matched = fragrances.find((f) => f.id === item.id || f.name === item.name);
        return matched
          ? {
              ...item,
              price: matched.price,
              img:
                item.img && !item.img.startsWith("data:") && item.img.length < 500
                  ? item.img
                  : matched.img || item.img,
            }
          : item;
      }),
    );
  }, [fragrances]);

  useEffect(() => {
    try {
      // Sanitize stored cart: strip bloated data: URIs or oversized strings to prevent QuotaExceededError
      const sanitized = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        img: item.img && (item.img.startsWith("data:") || item.img.length > 500) ? "" : item.img,
        price: item.price,
        quantity: item.quantity,
      }));
      localStorage.setItem("know-pollen-cart", JSON.stringify(sanitized));
    } catch (err) {
      console.warn("Storage quota warning on know-pollen-cart, saving minimal payload:", err);
      try {
        const minimal = cartItems.map(({ id, name, price, quantity }) => ({
          id,
          name,
          img: "",
          price,
          quantity,
        }));
        localStorage.setItem("know-pollen-cart", JSON.stringify(minimal));
      } catch (quotaErr) {
        console.warn("Storage quota exceeded; cart will persist in memory only for this session:", quotaErr);
      }
    }
  }, [cartItems]);

  useEffect(() => {
    if (!giftSetOpen) return;
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    resetScroll();
    const frame = window.requestAnimationFrame(resetScroll);
    return () => window.cancelAnimationFrame(frame);
  }, [giftSetOpen]);

  useEffect(() => {
    let mounted = true;
    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user && mounted) {
        setAuthProvider(session.user.app_metadata.provider ?? "email");
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name ?? session.user.email ?? "",
          email: session.user.email ?? "",
          role: session.user.user_metadata?.role || session.user.app_metadata?.role || "user",
        });
      }
    };
    restoreSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      setAuthProvider(session.user.app_metadata.provider ?? "email");
      if (mounted)
        setUser({
          id: session.user.id,
          name: session.user.user_metadata.name ?? session.user.email ?? "",
          email: session.user.email ?? "",
          role: session.user.user_metadata?.role || session.user.app_metadata?.role || "user",
        });
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleInternalNavigation = (event: MouseEvent) => {
      const hashAnchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (hashAnchor) {
        const hash = hashAnchor.getAttribute("href");
        if (hash) {
          event.preventDefault();
          scrollToHash(hash);
          return;
        }
      }
      const homeAnchor = (event.target as Element).closest<HTMLAnchorElement>(
        'a[href="/"], a[href="/know-pollen"], a[href="/knowpollen"]',
      );
      if (homeAnchor) {
        event.preventDefault();
        handleOpenHome();
        return;
      }
      const ordersAnchor = (event.target as Element).closest<HTMLAnchorElement>(
        'a[href="/my-orders"], a[href="/my-order"], a[href="/orders"], a[href="#my-orders"]',
      );
      if (ordersAnchor) {
        event.preventDefault();
        openOrderHistory();
        return;
      }
    };
    document.addEventListener("click", handleInternalNavigation);
    return () => document.removeEventListener("click", handleInternalNavigation);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
      setPrivacyOpen(false);
      setTermsOpen(false);
      setOrdersShippingOpen(false);
      setRefundOpen(false);
      setCookiesOpen(false);
      if (currentPath === "/" || currentPath === "/know-pollen" || currentPath === "/knowpollen") {
        handleOpenHome(false);
      } else if (
        ["/gift-set", "/collection", "/power-of-you", "/lost-cherry", "/fresh-orchid"].includes(
          currentPath,
        )
      ) {
        setActiveRoute(currentPath);
        setGiftSetOpen(true);
        setCheckoutOpen(false);
        setPaymentOpen(false);
        setPaymentOrder(null);
        setOrderHistoryOpen(false);
      } else if (currentPath === "/checkout") {
        setCheckoutOpen(true);
        setGiftSetOpen(false);
        setPaymentOpen(false);
        setPaymentOrder(null);
        setOrderHistoryOpen(false);
      } else if (["/my-orders", "/my-order", "/orders"].includes(currentPath)) {
        setOrderHistoryOpen(true);
        setGiftSetOpen(false);
        setCheckoutOpen(false);
        setPaymentOpen(false);
        setPaymentOrder(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useLayoutEffect(() => {
    const legalPageOpen =
      privacyOpen || termsOpen || ordersShippingOpen || refundOpen || cookiesOpen;
    if (!legalPageOpen) {
      if (pendingScrollRestore.current === null) return;
      const scrollY = pendingScrollRestore.current;
      pendingScrollRestore.current = null;
      document.documentElement.scrollTop = scrollY;
      document.body.scrollTop = scrollY;
      window.scrollTo({ top: scrollY, behavior: "auto" });
      return;
    }
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);
    const resetAfterRender = window.requestAnimationFrame(() => {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    });
    return () => window.cancelAnimationFrame(resetAfterRender);
  }, [privacyOpen, termsOpen, ordersShippingOpen, refundOpen, cookiesOpen]);

  const openAuth = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };
  const openLegalPage = (setPageOpen: (open: boolean) => void) => {
    shopScrollY.current = window.scrollY;
    window.history.pushState({ legal: true }, "", window.location.pathname);
    setPageOpen(true);
  };
  const closeLegalPage = (setPageOpen: (open: boolean) => void) => {
    pendingScrollRestore.current = shopScrollY.current;
    setPageOpen(false);
    if (window.history.state && window.history.state.legal) {
      window.history.back();
    }
  };
  const handleAuthSubmit = async ({
    name,
    email,
    phone,
    password,
  }: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
  }) => {
    const cleanedName = name.trim();
    const cleanedEmail = email.trim().toLowerCase();
    if (!cleanedEmail) throw new Error("Please enter your email address.");
    if (!/\S+@\S+\.\S+/.test(cleanedEmail)) throw new Error("Please enter a valid email address.");

    let formattedPhone = "";
    if (phone) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length === 10) {
        formattedPhone = `+91${digits}`;
      } else if (digits.length === 12 && digits.startsWith("91")) {
        formattedPhone = `+${digits}`;
      }
    }

    if (authMode === "signup") {
      if (!formattedPhone) {
        throw new Error("Please enter a valid 10-digit mobile number.");
      }
    }

    // If password is not entered, execute passwordless "Continue with email" OTP flow!
    if (!password) {
      const res = await continueWithEmail({ email: cleanedEmail, name: cleanedName, phone: formattedPhone });
      return {
        requiresOtp: true,
        email: cleanedEmail,
        isSignup: res?.isSignup,
      };
    }

    if (authMode === "login") {
      // 1. Try admin credentials only for the exact admin email
      if (cleanedEmail === "admin@pollen.com" || cleanedEmail.endsWith("@pollen.com")) {
        try {
          const adminUser = await adminLogin(cleanedEmail, password);
          setCustomSession(adminUser);
          setUser(adminUser);
          setAuthOpen(false);
          setProfileSettingsOpen(false);
          setAdminDashboardOpen(true);
          return;
        } catch {
          // fallback to customer login if admin login fails
        }
      }

      // 2. Try MongoDB Backend Customer Login
      try {
        const customerData = await loginCustomer({ email: cleanedEmail, password });
        if (customerData?.requiresOtp) {
          return customerData;
        }
        const customer = customerData.user || {
          email: cleanedEmail,
          name: cleanedEmail.split("@")[0],
          role: "user",
        };
        setCustomSession(customer);
        setUser(customer);
        setAuthOpen(false);
      } catch (backendLoginErr) {
        throw new Error(
          backendLoginErr instanceof Error ? backendLoginErr.message : "Invalid email or password."
        );
      }
    } else {
      // SIGN UP MODE:
      try {
        const regRes = await registerCustomer({
          name: cleanedName || cleanedEmail.split("@")[0],
          email: cleanedEmail,
          phone: formattedPhone,
          password,
        });
        if (regRes?.requiresOtp) {
          return { requiresOtp: true, email: cleanedEmail, isSignup: true };
        }
        const registeredUser = regRes.user || {
          name: cleanedName,
          email: cleanedEmail,
          role: "user",
        };
        setCustomSession(registeredUser);
        setUser(registeredUser);
      } catch (regErr) {
        // Fallback: Continue with email OTP
        try {
          const res = await continueWithEmail({ email: cleanedEmail, name: cleanedName, phone: formattedPhone });
          return {
            requiresOtp: true,
            email: cleanedEmail,
            isSignup: res?.isSignup,
          };
        } catch {
          throw new Error(regErr instanceof Error ? regErr.message : "Sign up failed");
        }
      }
    }
    setAuthOpen(false);
    if (checkoutAfterLogin) {
      setCheckoutAfterLogin(false);
      setCartOpen(false);
      setGiftSetOpen(false);
      setCheckoutOpen(true);
      window.history.pushState(null, "", "/checkout");
    } else returnToHome();
  };
  const handleLoginSuccess = (verifiedUser: any) => {
    setCustomSession(verifiedUser);
    setUser(verifiedUser);
    setAuthOpen(false);
    if (checkoutAfterLogin) {
      setCheckoutAfterLogin(false);
      setCartOpen(false);
      setGiftSetOpen(false);
      setCheckoutOpen(true);
      window.history.pushState(null, "", "/checkout");
    } else returnToHome();
  };
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "https://pollenstore.in/" },
    });
    if (error) throw new Error(error.message);
  };
  const handlePasswordChange = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  };
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign out error:", err);
    }
    clearAdminToken();
    try {
      localStorage.removeItem("pollen_user_session");
      localStorage.removeItem("pollen_admin_token");
      sessionStorage.clear();
    } catch {
      // ignore
    }
    setUser(null);
    setSavedAddresses([]);
    setSelectedAddressId(null);
    setOrderHistory([]);
    setAuthProvider("email");
    setProfileSettingsOpen(false);
    setAdminDashboardOpen(false);
    setAdminLoginOpen(false);
    setAuthOpen(false);
    handleOpenHome();
  };
  const navigateBack = (fallbackPath = "/") => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (fallbackPath === "/") {
      handleOpenHome(true);
    } else {
      handleOpenPerfumeRoute(fallbackPath);
    }
  };
  const handleOpenHome = (pushHistory = true) => {
    sessionStorage.removeItem("know-pollen-detail-route");
    setActiveRoute("/");
    setGiftSetOpen(false);
    setCheckoutOpen(false);
    setPaymentOpen(false);
    setPaymentOrder(null);
    setOrderHistoryOpen(false);
    setPrivacyOpen(false);
    setTermsOpen(false);
    setOrdersShippingOpen(false);
    setRefundOpen(false);
    setCookiesOpen(false);
    setProfileSettingsOpen(false);
    setAdminDashboardOpen(false);
    setAdminLoginOpen(false);
    setAuthOpen(false);
    setCartOpen(false);
    setMenuOpen(false);
    if (pushHistory) {
      window.history.pushState(null, "", "/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleOpenAbout = () => {
    if (activeRoute !== "/") {
      handleOpenHome(true);
      setTimeout(() => {
        const el = document.getElementById("about");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } else {
      const el = document.getElementById("about");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };
  const handleOpenGiftSet = () => {
    sessionStorage.setItem("know-pollen-detail-route", "/gift-set");
    setActiveRoute("/gift-set");
    setGiftSetOpen(true);
    window.history.pushState(null, "", "/gift-set");
    window.scrollTo(0, 0);
  };
  const handleBackFromGiftSet = () => {
    sessionStorage.removeItem("know-pollen-detail-route");
    navigateBack("/");
  };
  const handleOpenPowerOfYou = () => {
    sessionStorage.setItem("know-pollen-detail-route", "/power-of-you");
    setActiveRoute("/power-of-you");
    setGiftSetOpen(true);
    window.history.pushState(null, "", "/power-of-you");
    window.scrollTo(0, 0);
  };
  const handleOpenLostCherry = () => {
    sessionStorage.setItem("know-pollen-detail-route", "/lost-cherry");
    setActiveRoute("/lost-cherry");
    setGiftSetOpen(true);
    window.history.pushState(null, "", "/lost-cherry");
    window.scrollTo(0, 0);
  };
  const handleOpenFreshOrchid = () => {
    sessionStorage.setItem("know-pollen-detail-route", "/fresh-orchid");
    setActiveRoute("/fresh-orchid");
    setGiftSetOpen(true);
    window.history.pushState(null, "", "/fresh-orchid");
    window.scrollTo(0, 0);
  };
  const handleOpenPerfumeRoute = (route: string) => {
    if (route === "/power-of-you") return handleOpenPowerOfYou();
    if (route === "/lost-cherry") return handleOpenLostCherry();
    if (route === "/fresh-orchid") return handleOpenFreshOrchid();
  };
  const handleOpenCart = () => setCartOpen(true);
  const handleAddToCart = (fragrance: { id: number; name: string; img: string; price: number }) => {
    const matched = fragrances.find((f) => f.id === fragrance.id || f.name === fragrance.name);
    const price = matched ? matched.price : fragrance.price;
    setCartItems((items) =>
      items.some((item) => item.id === fragrance.id)
        ? items.map((item) =>
            item.id === fragrance.id ? { ...item, price, quantity: item.quantity + 1 } : item,
          )
        : [...items, { id: fragrance.id, name: fragrance.name, img: fragrance.img, price, quantity: 1 }],
    );
  };
  const handleCartQuantity = (id: number, change: number) =>
    setCartItems((items) =>
      items.flatMap((item) =>
        item.id === id
          ? [{ ...item, quantity: item.quantity + change }].filter(
              (updated) => updated.quantity > 0,
            )
          : [item],
      ),
    );
  const handleRemoveFromCart = (id: number) =>
    setCartItems((items) => items.filter((item) => item.id !== id));
  const handleEmptyCart = () => setCartItems([]);
  const handleCheckout = (items = cartItems) => {
    if (items.length === 0) return;
    if (!user) {
      setCheckoutAfterLogin(true);
      return openAuth("login");
    }
    setCartOpen(false);
    setGiftSetOpen(false);
    setSelectedAddressId((current) => (current && savedAddresses.some((a) => a.id === current) ? current : (savedAddresses[0]?.id ?? null)));
    setCheckoutOpen(true);
    window.history.pushState(null, "", "/checkout");
  };
  const handleBuyNow = () => {
    // If already anything in cart, redirect directly to checkout page
    if (cartItems.length > 0) {
      handleCheckout(cartItems);
      return;
    }

    // If nothing in cart, scroll to items section (#fragrances) as now
    if (giftSetOpen || checkoutOpen || paymentOpen || orderHistoryOpen || profileSettingsOpen || adminDashboardOpen) {
      handleOpenHome();
      setTimeout(() => {
        const section = document.getElementById("fragrances");
        if (section) section.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      const section = document.getElementById("fragrances");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      } else {
        handleOpenPowerOfYou();
      }
    }
  };
  const handleBuyProduct = (productId: number) => {
    const targetProd =
      fragrances.find(
        (f) => f.id === productId || (productId === 4 && (f.isBundle || f.slug === "gift-set")),
      ) || (productId === 4 ? { id: 4, name: "Luxury Discovery Gift Set", img: giftGalleryOne, price: fragrances.find((f) => f.isBundle)?.price || 0 } : null);

    if (targetProd) {
      const price = targetProd.price || 0;
      setCartItems((prev) => {
        const existing = prev.find((item) => item.id === productId);
        if (existing) return prev;
        return [
          ...prev,
          {
            id: productId,
            name: targetProd.name,
            img: targetProd.img || giftGalleryOne,
            price,
            quantity: 1,
          },
        ];
      });
    }

    setCartOpen(false);
    setGiftSetOpen(false);
    if (!user) {
      setCheckoutAfterLogin(true);
      return openAuth("login");
    }
    setSelectedAddressId((current) =>
      current && savedAddresses.some((a) => a.id === current)
        ? current
        : savedAddresses[0]?.id ?? null,
    );
    setCheckoutOpen(true);
    window.history.pushState(null, "", "/checkout");
  };
  const handleSaveAddress = async (
    address: Omit<SavedAddress, "id" | "created_at">,
  ): Promise<SavedAddress> => {
    if (!user?.id) throw new Error("Please sign in before saving an address.");
    const saved = await createSavedAddress(user.id, address);
    setSavedAddresses((current) => [saved, ...current.filter((a) => a.id !== saved.id)]);
    setSelectedAddressId(saved.id);
    return saved;
  };
  const handleUpdateAddress = async (
    addressId: string,
    address: Partial<SavedAddress>,
  ): Promise<SavedAddress> => {
    if (!user?.id) throw new Error("Please sign in before updating an address.");
    const updated = await updateSavedAddress(user.id, addressId, address);
    setSavedAddresses((current) =>
      current.map((a) => (a.id === addressId ? updated : a))
    );
    setSelectedAddressId(updated.id);
    return updated;
  };
  const handlePlaceOrder = async (
    address: SavedAddress,
    finalTotal?: number,
    couponDetails?: {
      couponCode?: string;
      couponDiscount?: number;
      subtotal?: number;
      shippingCharge?: number;
    }
  ) => {
    if (!user || cartItems.length === 0) return;
    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const totalAmount = finalTotal !== undefined && finalTotal > 0 ? finalTotal : subtotal;
    try {
      const order = await createOrder(user.id ?? "", totalAmount, user.name, address, {
        subtotal,
        ...couponDetails,
      });
      const titles = cartItems.map((item) => item.name).join(", ");
      const createdOrder = {
        ...order,
        status: "pending",
        title: titles,
        coupon_code: couponDetails?.couponCode,
        coupon_discount: couponDetails?.couponDiscount,
      };
      setCartItems([]);
      setCartOpen(false);
      setPaymentOrder(createdOrder);
      setOrderHistory((prev) => [createdOrder, ...prev.filter((o) => o.id !== createdOrder.id)]);
      setPaymentOpen(true);
      setCheckoutOpen(false);
      window.history.pushState(null, "", "/payment");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create your order.");
    }
  };
  const handlePayNow = useCallback(async (order = paymentOrder, preferredMethod: "upi" | "all" = "upi") => {
    if (!order || !user) return;
    const returnHome = () => {
      setPaymentOpen(false);
      setPaymentOrder(null);
      window.history.pushState(null, "", "/");
      window.scrollTo(0, 0);
    };
    const showPaymentFailure = (message = "Payment failed. Please try again.") => {
      toast.error(message);
    };
    const razorpayKey =
      import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TecGalptwwTSdS";
    if (!razorpayKey || razorpayKey.includes("your_")) {
      toast.error(
        "Razorpay is not configured. Add VITE_RAZORPAY_KEY_ID in client/.env and restart the client.",
      );
      return;
    }
    try {
      const gatewayOrder = await createPaymentOrder(
        Number(order.total_amount ?? 0),
        order.tracking_id,
        order.id,
      );
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load the Razorpay payment window."));
          document.body.appendChild(script);
        });
      }
      if (!window.Razorpay) throw new Error("Razorpay is unavailable. Please try again.");

      const options: Record<string, unknown> = {
        key: gatewayOrder.keyId || razorpayKey,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency || "INR",
        name: "Know Pollen",
        description: order.title || "Pollen Fragrance Order",
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || order.delivery_phone || "",
          method: preferredMethod === "upi" ? "upi" : undefined,
        },
        theme: { color: "#0a0a0a" },
        // Direct UPI Intent and App-switching configuration
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay using UPI (Google Pay, PhonePe, Paytm, BHIM)",
                instruments: [
                  {
                    method: "upi",
                    flows: ["intent", "qr"],
                  },
                ],
              },
              other: {
                name: "Cards, NetBanking & Wallets",
                instruments: [
                  { method: "card" },
                  { method: "netbanking" },
                  { method: "wallet" },
                ],
              },
            },
            sequence: preferredMethod === "upi" ? ["block.upi", "block.other"] : ["block.other", "block.upi"],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        upi: {
          flow: "intent",
        },
        send_sms_hash: true,
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id?: string;
          razorpay_signature?: string;
        }) => {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.id,
              trackingId: order.tracking_id,
            });
            await markOrderPaid(user.id, order.id).catch(() => {});
            setPaymentOrder((current) =>
              current?.id === order.id ? { ...current, status: "confirmed" } : current,
            );
            setOrderHistory((prev) =>
              prev.map((o) => (o.id === order.id ? { ...o, status: "confirmed" } : o)),
            );
            toast.success("Payment successful! Your order has been confirmed.");
            returnHome();
          } catch (error) {
            showPaymentFailure(
              error instanceof Error ? error.message : "Payment verification failed. Please try again.",
            );
          }
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment pending. You can complete your order anytime from My Orders.");
          },
        },
      };

      if (gatewayOrder.id) {
        options.order_id = gatewayOrder.id;
      }

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response: { error?: { description?: string } }) => {
        showPaymentFailure(response.error?.description ?? "Payment failed. Your order remains pending in My Orders for repayment.");
      });
      razorpay.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start payment.");
    }
  }, [paymentOrder, user]);

  const openOrderHistory = async () => {
    if (!user) {
      openAuth("login");
      return;
    }
    setOrderHistoryOpen(true);
    setGiftSetOpen(false);
    setCheckoutOpen(false);
    setPaymentOpen(false);
    setMenuOpen(false);
    window.history.pushState(null, "", "/my-orders");
    try {
      const orders = await getOrdersByUser(user.id ?? "");
      setOrderHistory(
        orders.map((order) => ({
          ...order,
          title: order.total_amount
            ? `${order.customer_name || user.name || "Customer"} · Order ${order.order_id || (order as any).orderId || `#${order.id?.slice(-8).toUpperCase()}`}`
            : (order.customer_name ?? "Pollen Fragrance Order"),
          customer_name: order.customer_name || user.name || "Customer",
          delivery_phone: order.delivery_phone || user.phone || null,
          delivery_address: order.delivery_address || null,
        })),
      );
    } catch (error) {
       toast.error(error instanceof Error ? error.message : "Unable to load your orders.");
    }
  };

  const handleBuyAgain = (order: OrderRecord) => {
    // Try to find the product by order items first (if available), then by name substring
    const orderItems = (order as any).items as Array<{ name?: string; productId?: string }> | undefined;
    let matched: typeof fragrances[0] | undefined;

    if (orderItems && orderItems.length > 0) {
      // Try to match the first item by productId or name
      const firstItem = orderItems[0];
      matched =
        fragrances.find((f) => f._id && firstItem.productId && f._id === firstItem.productId) ||
        fragrances.find((f) => firstItem.name && f.name.toLowerCase() === firstItem.name.toLowerCase()) ||
        fragrances.find((f) => firstItem.name && firstItem.name.toLowerCase().includes(f.name.toLowerCase()));
    }

    // Fallback: match by order title
    if (!matched) {
      matched = fragrances.find((f) => order.title?.toLowerCase().includes(f.name.toLowerCase()));
    }

    // Last resort: first available fragrance
    if (!matched) {
      matched = fragrances.find((f) => !f.isBundle) || fragrances[0];
    }

    if (matched) {
      handleAddToCart({
        id: matched.id,
        name: matched.name,
        img: matched.img,
        price: matched.price,
      });
      setCartOpen(true);
      toast.success(`${matched.name} added to cart!`);
    }
  };

  const handleDeletePendingOrder = async (orderId: string) => {
    if (!user?.id) {
      toast.error("Please sign in to delete this order.");
      return;
    }

    try {
      await deleteOrder(user.id, orderId);
      setOrderHistory((orders) => orders.filter((order) => order.id !== orderId));
    } catch (error) {
       toast.error(error instanceof Error ? error.message : "Unable to delete this pending order.");
    }
  };
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const legalPage = cookiesOpen ? (
    <CookiePolicySection onBack={() => closeLegalPage(setCookiesOpen)} />
  ) : refundOpen ? (
    <RefundPolicySection onBack={() => closeLegalPage(setRefundOpen)} />
  ) : ordersShippingOpen ? (
    <OrdersShippingSection onBack={() => closeLegalPage(setOrdersShippingOpen)} />
  ) : privacyOpen ? (
    <PrivacyPolicySection onBack={() => closeLegalPage(setPrivacyOpen)} />
  ) : termsOpen ? (
    <TermsSection onBack={() => closeLegalPage(setTermsOpen)} />
  ) : null;

  return (
    <div
      style={{
        fontFamily: "'Bricolage Grotesque', sans-serif",
        background: config.theme?.mode === "dark" ? "#0a0a0a" : "#ffffff",
        minHeight: "100vh",
        color: config.theme?.mode === "dark" ? "#ffffff" : "#0a0a0a",
        overflowX: "hidden",
      }}
    >
      <style>{GLOBAL_STYLES}</style>

      <SideMenu
        open={menuOpen}
        fragrances={fragrances}
        onClose={() => setMenuOpen(false)}
        onBuyNow={handleBuyNow}
        onOpenGiftSet={isFeatureEnabled("giftSet") ? handleOpenGiftSet : undefined}
        onOpenHome={handleOpenHome}
        onOpenAbout={handleOpenAbout}
        onOpenFragrance={(id) => {
          if (id === 1) handleOpenPowerOfYou();
          if (id === 2) handleOpenLostCherry();
          if (id === 3) handleOpenFreshOrchid();
        }}
        user={user}
        onLogin={() => openAuth("login")}
        onProfileSettings={() => setProfileSettingsOpen(true)}
        onSignOut={handleSignOut}
        onOpenOrderHistory={openOrderHistory}
        onOpenAdmin={isFeatureEnabled("adminDashboard") ? () => setAdminDashboardOpen(true) : undefined}
        onOpenAdminLogin={isFeatureEnabled("adminDashboard") ? () => setAdminLoginOpen(true) : undefined}
      />
      <TopBar
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((open: boolean) => !open)}
        user={user}
        onBuyNow={handleBuyNow}
        onOpenHome={handleOpenHome}
        onOpenAbout={handleOpenAbout}
        onOpenGiftSet={isFeatureEnabled("giftSet") ? handleOpenGiftSet : undefined}
        showTrackOrder={isFeatureEnabled("orderTracking")}
        cartCount={cartCount}
        onCartOpen={handleOpenCart}
        onLogin={() => openAuth("login")}
        onOpenAdmin={isFeatureEnabled("adminDashboard") ? () => setAdminDashboardOpen(true) : () => {}}
        onOpenAdminLogin={isFeatureEnabled("adminDashboard") ? () => setAdminLoginOpen(true) : () => {}}
        onProfileSettings={() => setProfileSettingsOpen(true)}
      />
      <CartDrawer
        open={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onChangeQuantity={handleCartQuantity}
        onRemove={handleRemoveFromCart}
        onEmpty={handleEmptyCart}
        onCheckout={handleCheckout}
      />
      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => {
          setCheckoutAfterLogin(false);
          setAuthOpen(false);
        }}
        onSubmit={handleAuthSubmit}
        onGoogleSignIn={handleGoogleSignIn}
        onModeChange={setAuthMode}
        user={user}
        onLoginSuccess={handleLoginSuccess}
      />
      <ProfileSettings
        open={profileSettingsOpen}
        user={user}
        provider={authProvider}
        onClose={() => setProfileSettingsOpen(false)}
        onPasswordChange={handlePasswordChange}
        onSignOut={handleSignOut}
        onOpenAdmin={() => {
          setProfileSettingsOpen(false);
          setAdminDashboardOpen(true);
        }}
        onProfileUpdated={(updated) => setUser(updated)}
        onTrackOrder={(trackingId) => {
          setProfileSettingsOpen(false);
          const el = document.querySelector("#track");
          if (el) el.scrollIntoView({ behavior: "smooth" });
          window.dispatchEvent(new CustomEvent("lookup-track-id", { detail: trackingId }));
        }}
        onShopNow={() => {
          setProfileSettingsOpen(false);
          const el = document.querySelector("#fragrances");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
        onPayNow={handlePayNow}
      />
      <AdminDashboard
        open={adminDashboardOpen}
        onClose={() => {
          setAdminDashboardOpen(false);
          reloadProducts();
        }}
        adminUser={user ?? { name: "Admin", email: "admin@pollen.com" }}
        onSignOut={handleSignOut}
        onProductsUpdated={reloadProducts}
      />
      <AdminLoginModal
        open={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onSuccess={(adminUser) => {
          setCustomSession(adminUser);
          setUser(adminUser);
          setProfileSettingsOpen(false);
          setAdminLoginOpen(false);
          setAdminDashboardOpen(true);
        }}
      />
      <main>
        {legalPage ? (
          legalPage
        ) : giftSetOpen ? (
          <GiftSetGallerySection
            route={activeRoute}
            products={fragrances}
            onAddBundle={() => {
              const bundle =
                fragrances.find((p) => p.isBundle || p.slug === "gift-set" || p.id === 4);
              if (bundle) {
                handleAddToCart({
                  id: bundle.id,
                  name: bundle.name,
                  img: bundle.img || giftGalleryOne,
                  price: bundle.price,
                });
              }
            }}
            onBack={handleBackFromGiftSet}
            onSelectVariant={handleOpenPerfumeRoute}
            quantities={{
              power: cartItems.find((item) => item.id === 1)?.quantity ?? 0,
              lost: cartItems.find((item) => item.id === 2)?.quantity ?? 0,
              fresh: cartItems.find((item) => item.id === 3)?.quantity ?? 0,
            }}
            onChangeQuantity={handleCartQuantity}
            onBuyProduct={handleBuyProduct}
          />
        ) : paymentOpen && paymentOrder ? (
          <section className="min-h-screen bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 px-4 pb-16 pt-24 sm:px-6 md:px-16 md:pt-32 transition-colors">
            <div className="mx-auto max-w-screen-xl">
              <button
                type="button"
                onClick={() => {
                  setPaymentOpen(false);
                  setPaymentOrder(null);
                  navigateBack("/");
                }}
                className="mb-8 sm:mb-12 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer group"
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
                <span>Back</span>
              </button>
              <div className="grid gap-8 lg:gap-12 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-none border border-black/10 dark:border-neutral-800 bg-[#fafafa] dark:bg-neutral-900 p-5 sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-black/45 dark:text-white/45">
                    Payment
                  </p>
                  <h1 className="mt-3 sm:mt-4 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                    Complete payment
                  </h1>
                  <p className="mt-4 sm:mt-6 max-w-md text-xs sm:text-sm leading-relaxed text-black/60 dark:text-neutral-400">
                    Your order has been created. Confirm the details below and proceed with the
                    payment to complete checkout.
                  </p>
                  <div className="mt-6 sm:mt-8 space-y-4 text-xs sm:text-sm">
                    <div className="flex items-center justify-between border-b border-black/10 dark:border-neutral-800 pb-3">
                      <span className="text-black/50 dark:text-neutral-400">Order Reference</span>
                      <span className="font-mono font-semibold break-all text-right ml-2 text-neutral-900 dark:text-white">
                        {(paymentOrder.order_id || (paymentOrder as any).orderId || `#${paymentOrder.id ? paymentOrder.id.slice(-8).toUpperCase() : "PENDING"}`)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-black/10 dark:border-neutral-800 pb-3">
                      <span className="text-black/50 dark:text-neutral-400">Order</span>
                      <span className="font-semibold text-right ml-2 text-neutral-900 dark:text-white">{paymentOrder.title}</span>
                    </div>
                    {paymentOrder.coupon_code && (
                      <div className="flex items-center justify-between border-b border-black/10 dark:border-neutral-800 pb-3 text-emerald-700 dark:text-emerald-400">
                        <span className="text-black/50 dark:text-neutral-400">Coupon Applied</span>
                        <span className="font-semibold text-right ml-2 font-mono">
                          {paymentOrder.coupon_code}
                          {paymentOrder.coupon_discount ? ` (-₹${Number(paymentOrder.coupon_discount).toLocaleString()})` : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-b border-black/10 dark:border-neutral-800 pb-3">
                      <span className="text-black/50 dark:text-neutral-400">Amount</span>
                      <span className="font-semibold text-neutral-900 dark:text-white">
                        ₹{Number(paymentOrder.total_amount ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="border-b border-black/10 dark:border-neutral-800 pb-3">
                      <span className="text-black/50 dark:text-neutral-400">Deliver to</span>
                      <p className="mt-2 text-right font-semibold text-neutral-900 dark:text-white">{paymentOrder.delivery_phone}</p>
                      <p className="mt-1 text-right text-xs sm:text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{paymentOrder.delivery_address}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black/50 dark:text-neutral-400">Status</span>
                      <span className="font-semibold uppercase tracking-[0.12em] text-neutral-900 dark:text-white">
                        {paymentOrder.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-[#f5f5f5] dark:bg-neutral-900/60 border border-black/10 dark:border-neutral-800 p-5 sm:p-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-black/45 dark:text-white/45">
                    Payment details
                  </p>
                  <div className="mt-6 space-y-5">
                    <div className="rounded-none border border-black/10 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                        Amount Payable
                      </p>
                      <p className="mt-1 text-2xl font-mono font-bold text-neutral-900 dark:text-white">
                        ₹{Number(paymentOrder.total_amount ?? 0).toLocaleString()}
                      </p>
                    </div>

                    {/* Instant UPI Payment Method */}
                    <div className="rounded-2xl border-2 border-amber-500/30 dark:border-amber-400/30 bg-amber-500/5 dark:bg-amber-400/5 p-4 sm:p-5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Zap size={16} className="text-amber-500 shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                            UPI Instant App Payment
                          </span>
                        </div>
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                          Recommended
                        </span>
                      </div>

                      {/* UPI Apps visual badges */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        {[
                          { name: "Google Pay", color: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50" },
                          { name: "PhonePe", color: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50" },
                          { name: "Paytm", color: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50" },
                          { name: "BHIM / CRED", color: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700" },
                        ].map((app) => (
                          <span
                            key={app.name}
                            className={`rounded-lg border px-2 py-1 text-[10px] font-semibold tracking-wide ${app.color}`}
                          >
                            {app.name}
                          </span>
                        ))}
                      </div>

                      <p className="mt-3 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                        Redirects directly to your installed UPI app to enter your PIN. On desktop, generates a dynamic QR code for instant scanning.
                      </p>

                      <button
                        type="button"
                        onClick={() => void handlePayNow(paymentOrder, "upi")}
                        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-black dark:bg-white px-5 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer shadow-md"
                      >
                        <Smartphone size={15} />
                        <span>Pay ₹{Number(paymentOrder.total_amount ?? 0).toLocaleString()} via UPI</span>
                      </button>
                    </div>

                    {/* Secondary: Other Payment Modes */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => void handlePayNow(paymentOrder, "all")}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                      >
                        <CreditCard size={14} />
                        <span>Pay with Cards, NetBanking or Wallets</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                      <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                      <span>Secured with 256-bit encryption by Razorpay</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : checkoutOpen ? (
          <CheckoutSection
            items={cartItems}
            addresses={savedAddresses}
            selectedAddressId={selectedAddressId}
            onSelectAddress={setSelectedAddressId}
            onSaveAddress={handleSaveAddress}
            onUpdateAddress={handleUpdateAddress}
            onChangeQuantity={handleCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onBack={() => {
              setCheckoutOpen(false);
              navigateBack("/");
            }}
            onPlaceOrder={handlePlaceOrder}
            onOpenPrivacy={() => setPrivacyOpen(true)}
            onOpenTerms={() => setTermsOpen(true)}
            onOpenRefund={() => setRefundOpen(true)}
            onOpenOrdersShipping={() => setOrdersShippingOpen(true)}
          />
        ) : orderHistoryOpen ? (
          <MyOrdersSection
            orders={orderHistory}
            user={user}
            onBack={() => {
              setOrderHistoryOpen(false);
              navigateBack("/");
            }}
            onPayNow={handlePayNow}
            onDeleteOrder={handleDeletePendingOrder}
            onBuyAgain={handleBuyAgain}
            onExploreFragrances={() => {
              setOrderHistoryOpen(false);
              window.history.pushState(null, "", "/");
              const el = document.querySelector("#fragrances");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          />
        ) : (
          <>
            <Hero />
            <IntroStories fragrances={fragrances} />
            <BottleCarousel
              fragrances={fragrances}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyProduct}
            />
            <MomentSection />
            <PricingSection
              fragrances={fragrances}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyProduct}
              cartItems={cartItems}
              onChangeQuantity={handleCartQuantity}
            />
            {isFeatureEnabled("orderTracking") && (
              <TrackBanner userId={user?.id} onRequireLogin={() => openAuth("login")} />
            )}
          </>
        )}
      </main>
      {!pendingNoticeDismissed &&
        orderHistoryOpen &&
        orderHistory.some((order) => order.status.toLowerCase() === "pending") && (
          <aside className="fixed bottom-6 right-6 z-40 w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-black/15 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-5 shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-black/10 dark:border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/60 dark:text-white/60">
                  Pending payments
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingNoticeDismissed(true)}
                className="flex h-6 w-6 items-center justify-center rounded-lg text-black/40 dark:text-white/40 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title="Dismiss notification"
                aria-label="Close pending payments notification"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mt-3.5 space-y-3">
              {orderHistory
                .filter((order) => order.status.toLowerCase() === "pending")
                .map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-4 border-t border-black/5 dark:border-neutral-800 pt-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{order.title}</p>
                      <p className="mt-1 text-xs text-black/50 dark:text-neutral-400">
                        ₹{Number(order.total_amount ?? 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePayNow(order)}
                        className="rounded-lg bg-black dark:bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                      >
                        Pay now
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeletePendingOrder(order.id)}
                        className="rounded-lg border border-black/20 dark:border-neutral-700 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </aside>
        )}
      {!legalPage && !checkoutOpen && !giftSetOpen && !paymentOpen && !orderHistoryOpen && (
        <Footer
          onOpenPrivacy={() => openLegalPage(setPrivacyOpen)}
          onOpenTerms={() => openLegalPage(setTermsOpen)}
          onOpenOrdersShipping={() => openLegalPage(setOrdersShippingOpen)}
          onOpenRefund={() => openLegalPage(setRefundOpen)}
          onOpenCookies={() => openLegalPage(setCookiesOpen)}
          onOpenHome={handleOpenHome}
          onOpenAdminLogin={() => setAdminLoginOpen(true)}
        />
      )}
    </div>
  );
}
