import React, { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Gift,
  Layers,
  Mail,
  MessageSquare,
  Package,
  ShoppingBag,
  Sliders,
  Truck,
  Users,
  ShieldCheck,
} from "lucide-react";
import {
  AdminStats,
  AdminUser,
  AdminAccount,
  BackendProduct,
  approveAdminReview,
  deleteAdminCoupon,
  deleteAdminOrder,
  deleteAdminProduct,
  deleteAdminAccount,
  getAdminAccounts,
  getAdminAuditLogs,
  getAdminCoupons,
  getAdminNewsletterSubscribers,
  getAdminOrders,
  getAdminProducts,
  getAdminReturns,
  getAdminReviews,
  getAdminShippingRules,
  getAdminStats,
  getAdminUsers,
  processAdminReturn,
  toggleAdminUserStatus,
  updateAdminOrderStatus,
  updateAdminAccount,
  ensureAdminToken,
} from "@/app/api";
import { AdminHeader } from "./AdminHeader";
import { OverviewTab } from "./tabs/OverviewTab";
import { OrdersTab } from "./tabs/OrdersTab";
import { ProductsTab } from "./tabs/ProductsTab";
import { CustomersTab } from "./tabs/CustomersTab";
import { ReturnsTab } from "./tabs/ReturnsTab";
import { CouponsTab } from "./tabs/CouponsTab";
import { ReviewsTab } from "./tabs/ReviewsTab";
import { ShippingTab } from "./tabs/ShippingTab";
import { NewsletterTab } from "./tabs/NewsletterTab";
import { AuditLogsTab } from "./tabs/AuditLogsTab";
import { AdminsTab } from "./tabs/AdminsTab";
import { SettingsTab } from "./tabs/SettingsTab";
import { EditPriceModal } from "./modals/EditPriceModal";
import { EditProductModal } from "./modals/EditProductModal";
import { AddProductModal } from "./modals/AddProductModal";
import { AddCouponModal } from "./modals/AddCouponModal";
import { EditCouponModal } from "./modals/EditCouponModal";
import { CreateAdminModal } from "./modals/CreateAdminModal";
import { OrderDetailsModal } from "./modals/OrderDetailsModal";
import { TrackingModal } from "./modals/TrackingModal";
import { CustomerDetailModal } from "./modals/CustomerDetailModal";
import { AdminDashboardProps, NavSection } from "../types";
import { useTenantConfig } from "@/config/tenantContext";

export function AdminDashboard({
  open,
  onClose,
  adminUser,
  onSignOut,
  onProductsUpdated,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<NavSection>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [shippingRules, setShippingRules] = useState<any[]>([]);
  const [newsletterSubs, setNewsletterSubs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orderFilter, setOrderFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminUser | null>(null);
  const [trackingModalOrder, setTrackingModalOrder] = useState<any | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddCoupon, setShowAddCoupon] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [editingPriceProduct, setEditingPriceProduct] = useState<BackendProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<BackendProduct | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [
        statsData,
        ordersData,
        productsData,
        usersData,
        returnsData,
        couponsData,
        reviewsData,
        shippingData,
        newsletterData,
        auditData,
        adminsData,
      ] = await Promise.allSettled([
        getAdminStats(),
        getAdminOrders(orderFilter),
        getAdminProducts(),
        getAdminUsers(),
        getAdminReturns(),
        getAdminCoupons(),
        getAdminReviews(),
        getAdminShippingRules(),
        getAdminNewsletterSubscribers(),
        getAdminAuditLogs(),
        getAdminAccounts(),
      ]);

      if (statsData.status === "fulfilled") setStats(statsData.value);
      if (ordersData.status === "fulfilled") setOrders(ordersData.value);
      if (productsData.status === "fulfilled") setProducts(productsData.value);
      if (usersData.status === "fulfilled") setUsers(usersData.value);
      if (returnsData.status === "fulfilled") setReturns(returnsData.value);
      if (couponsData.status === "fulfilled") setCoupons(couponsData.value);
      if (reviewsData.status === "fulfilled") setReviews(reviewsData.value);
      if (shippingData.status === "fulfilled") setShippingRules(shippingData.value);
      if (newsletterData.status === "fulfilled") setNewsletterSubs(newsletterData.value);
      if (auditData.status === "fulfilled") setAuditLogs(auditData.value);
      if (adminsData.status === "fulfilled") setAdmins(adminsData.value);

      if (isManual) showToast("System synchronized with live database");
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (open) {
      ensureAdminToken().finally(() => {
        loadData();
      });
    }
  }, [open, orderFilter]);

  // Order Handlers
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateAdminOrderStatus(orderId, { status: newStatus });
      showToast(`Order status updated to "${newStatus.toUpperCase()}"`);
      await loadData();
      if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.orderId === orderId)) {
        setSelectedOrder((prev: any) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    try {
      await deleteAdminOrder(orderId);
      showToast("Order removed from database");
      loadData();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete order");
    }
  };

  // Product Handlers
  const handleToggleStock = async (product: BackendProduct) => {
    try {
      const nextStock = !product.inStock;
      await updateAdminProduct(product._id || (product as any).productId || product.slug, {
        inStock: nextStock,
      });
      showToast(`"${product.name}" marked as ${nextStock ? "In Stock" : "Out of Stock"}`);
      await loadData();
      if (onProductsUpdated) onProductsUpdated();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update stock");
    }
  };

  const handleDeleteProduct = async (productId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteAdminProduct(productId);
      showToast(`"${name}" deleted from catalog`);
      await loadData();
      if (onProductsUpdated) onProductsUpdated();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete product");
    }
  };

  // User Handlers
  const handleToggleUser = async (user: AdminUser) => {
    const nextStatus = !(user as any).isActive;
    try {
      await toggleAdminUserStatus(user._id, nextStatus);
      showToast(`User account ${nextStatus ? "activated" : "suspended"}`);
      loadData();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to update user status");
    }
  };

  // Return Handlers
  const handleProcessReturn = async (returnId: string, status: string, refundAmount?: number) => {
    try {
      await processAdminReturn(returnId, { status, refundAmount });
      showToast(`Return marked as ${status.toUpperCase()}`);
      loadData();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to process return");
    }
  };

  // Coupon Handlers
  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await deleteAdminCoupon(couponId);
      showToast("Coupon deleted successfully");
      loadData();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

  // Review Handlers
  const handleApproveReview = async (reviewId: string) => {
    try {
      await approveAdminReview(reviewId);
      showToast("Review approved & published to store");
      loadData();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to approve review");
    }
  };

  // Admin Team Handlers
  const handleDeleteAdmin = async (adminId: string) => {
    try {
      await deleteAdminAccount(adminId);
      showToast("Administrator account deleted successfully");
      loadData();
    } catch (err: any) {
      window.alert(err?.message || "Failed to delete administrator account");
    }
  };

  const handleToggleAdminStatus = async (admin: AdminAccount) => {
    try {
      const newStatus = admin.isActive === false;
      await updateAdminAccount(admin._id || (admin as any).id, { isActive: newStatus });
      showToast(`Admin account ${newStatus ? "activated" : "suspended"}`);
      loadData();
    } catch (err: any) {
      window.alert(err?.message || "Failed to update admin account status");
    }
  };

  if (!open) return null;

  const { adminTheme } = useTenantConfig();
  const accent = adminTheme?.accentColor || "#f59e0b";
  const isLight = adminTheme?.mode === "light";
  const isMidnight = adminTheme?.mode === "midnight";

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: ShoppingBag, badge: stats?.pendingOrders },
    { id: "products", label: "Fragrances", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
    { id: "returns", label: "Returns", icon: Clock, badge: stats?.pendingReturns },
    { id: "coupons", label: "Coupons", icon: Gift },
    { id: "reviews", label: "Reviews", icon: MessageSquare, badge: stats?.pendingReviews },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "newsletter", label: "Subscribers", icon: Mail },
    { id: "audit", label: "Audit Trails", icon: Layers },
    { id: "admins", label: "Admin Team", icon: ShieldCheck, badge: admins.length > 0 ? admins.length : undefined },
    { id: "settings", label: "Settings & Features", icon: Sliders },
  ];

  return (
    <div
      data-admin-theme={adminTheme?.mode || "dark"}
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden font-sans transition-colors duration-200 ${
        isLight
          ? "admin-theme-light bg-slate-100 text-slate-900"
          : isMidnight
          ? "admin-theme-midnight bg-[#070b14] text-slate-100"
          : "admin-theme-dark bg-neutral-950 text-white"
      }`}
    >
      <AdminHeader
        adminUser={adminUser}
        activeTab={activeTab}
        searchQuery={searchQuery}
        refreshing={refreshing}
        onSearchChange={setSearchQuery}
        onRefresh={() => loadData(true)}
        onClose={onClose}
        onSignOut={onSignOut}
      />

      {/* Mobile Navigation Tab Bar (< md) */}
      <div
        className={`flex md:hidden overflow-x-auto no-scrollbar border-b px-3 py-2 gap-1.5 shrink-0 transition-colors ${
          isLight
            ? "border-slate-200/90 bg-white"
            : isMidnight
            ? "border-slate-800/80 bg-[#0c1222]"
            : "border-neutral-800/80 bg-neutral-950"
        }`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as NavSection)}
              style={
                isActive
                  ? {
                      backgroundColor: accent,
                      color: isLight ? "#ffffff" : "#000000",
                      boxShadow: `0 2px 8px ${accent}40`,
                    }
                  : undefined
              }
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? "font-bold"
                  : isLight
                  ? "bg-slate-100 text-slate-600 hover:text-slate-900"
                  : "bg-neutral-900 text-neutral-400 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span
                  style={
                    isActive
                      ? { backgroundColor: "#000000", color: accent }
                      : { backgroundColor: `${accent}20`, color: accent }
                  }
                  className="rounded-full px-1.5 py-0.2 text-[9px] font-bold"
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <aside
          className={`w-64 border-r p-4 hidden md:flex flex-col justify-between shrink-0 transition-colors duration-200 ${
            isLight
              ? "border-slate-200/90 bg-white text-slate-800"
              : isMidnight
              ? "border-slate-800/80 bg-[#0b1120] text-slate-200"
              : "border-neutral-800/80 bg-neutral-950 text-neutral-400"
          }`}
        >
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as NavSection)}
                  style={
                    isActive
                      ? {
                          backgroundColor: accent,
                          color: isLight ? "#ffffff" : "#000000",
                          boxShadow: `0 2px 12px ${accent}40`,
                        }
                      : undefined
                  }
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "font-bold"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 ? (
                    <span
                      style={
                        isActive
                          ? { backgroundColor: "#000000", color: accent }
                          : { backgroundColor: `${accent}20`, color: accent }
                      }
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Tab Content Panel */}
        <main
          className={`flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 transition-colors duration-200 ${
            isLight
              ? "bg-slate-50 text-slate-900"
              : isMidnight
              ? "bg-[#070b14]/90 text-white"
              : "bg-neutral-950/60 text-white"
          }`}
        >
          {loading ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-neutral-400 text-xs uppercase tracking-widest">
                <div
                  style={{ borderTopColor: accent }}
                  className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700"
                />
                <span>Loading Admin Data...</span>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "overview" && (
                <OverviewTab stats={stats} orders={orders} onSelectTab={setActiveTab} />
              )}

              {activeTab === "orders" && (
                <OrdersTab
                  orders={orders}
                  searchQuery={searchQuery}
                  orderFilter={orderFilter}
                  onFilterChange={setOrderFilter}
                  onSelectOrder={setSelectedOrder}
                  onUpdateStatus={handleStatusChange}
                  onOpenTracking={setTrackingModalOrder}
                  onDeleteOrder={handleDeleteOrder}
                />
              )}

              {activeTab === "products" && (
                <ProductsTab
                  products={products}
                  searchQuery={searchQuery}
                  onAddProduct={() => setShowAddProduct(true)}
                  onEditProduct={setEditingProduct}
                  onEditPrice={setEditingPriceProduct}
                  onToggleStock={handleToggleStock}
                  onDeleteProduct={handleDeleteProduct}
                  onRefresh={loadData}
                />
              )}

              {activeTab === "customers" && (
                <CustomersTab
                  users={users}
                  searchQuery={searchQuery}
                  onToggleUserStatus={handleToggleUser}
                  onSelectCustomer={setSelectedCustomer}
                />
              )}

              {activeTab === "returns" && (
                <ReturnsTab returns={returns} onProcessReturn={handleProcessReturn} />
              )}

              {activeTab === "coupons" && (
                <CouponsTab
                  coupons={coupons}
                  onAddCoupon={() => setShowAddCoupon(true)}
                  onEditCoupon={(c) => setEditingCoupon(c)}
                  onDeleteCoupon={handleDeleteCoupon}
                />
              )}

              {activeTab === "reviews" && (
                <ReviewsTab reviews={reviews} onApproveReview={handleApproveReview} />
              )}

              {activeTab === "shipping" && (
                <ShippingTab
                  shippingRules={shippingRules}
                  onUpdated={() => {
                    loadData();
                    showToast("Shipping rates updated successfully");
                  }}
                />
              )}

              {activeTab === "newsletter" && <NewsletterTab subscribers={newsletterSubs} />}

              {activeTab === "audit" && <AuditLogsTab auditLogs={auditLogs} />}

              {activeTab === "admins" && (
                <AdminsTab
                  admins={admins}
                  currentAdminEmail={adminUser?.email}
                  onAddAdmin={() => {
                    setEditingAdmin(null);
                    setShowAddAdmin(true);
                  }}
                  onEditAdmin={(adm) => {
                    setEditingAdmin(adm);
                    setShowAddAdmin(true);
                  }}
                  onDeleteAdmin={handleDeleteAdmin}
                  onToggleStatus={handleToggleAdminStatus}
                />
              )}

              {activeTab === "settings" && <SettingsTab onShowToast={showToast} />}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <CustomerDetailModal
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onCustomerUpdated={loadData}
      />

      <OrderDetailsModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleStatusChange}
        onOpenTracking={(ord) => {
          setSelectedOrder(null);
          setTrackingModalOrder(ord);
        }}
      />

      <TrackingModal
        order={trackingModalOrder}
        onClose={() => setTrackingModalOrder(null)}
        onUpdated={loadData}
      />

      <AddProductModal
        open={showAddProduct}
        onClose={() => setShowAddProduct(false)}
        onProductCreated={() => {
          loadData();
          if (onProductsUpdated) onProductsUpdated();
        }}
      />

      <EditProductModal
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onProductUpdated={() => {
          loadData();
          if (onProductsUpdated) onProductsUpdated();
        }}
      />

      <AddCouponModal
        open={showAddCoupon}
        onClose={() => setShowAddCoupon(false)}
        onCouponCreated={() => {
          showToast("Coupon created successfully");
          loadData();
        }}
      />

      <EditCouponModal
        coupon={editingCoupon}
        onClose={() => setEditingCoupon(null)}
        onCouponUpdated={() => {
          showToast("Coupon updated successfully");
          loadData();
        }}
      />

      <EditPriceModal
        product={editingPriceProduct}
        onClose={() => setEditingPriceProduct(null)}
        onSaved={() => {
          loadData();
          if (onProductsUpdated) onProductsUpdated();
        }}
      />

      <CreateAdminModal
        open={showAddAdmin}
        onClose={() => {
          setShowAddAdmin(false);
          setEditingAdmin(null);
        }}
        adminToEdit={editingAdmin}
        currentAdminEmail={adminUser?.email}
        onSuccess={(savedAdmin, isEdit) => {
          loadData();
          showToast(
            isEdit
              ? `Administrator details updated for ${savedAdmin.name}`
              : `Administrator account created for ${savedAdmin.email}`
          );
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2.5 rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
