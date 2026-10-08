import { BackendOrder, BackendProduct, AdminStats, AdminUser } from "@/app/api";

export type NavSection =
  | "overview"
  | "orders"
  | "products"
  | "customers"
  | "returns"
  | "coupons"
  | "reviews"
  | "shipping"
  | "newsletter"
  | "audit"
  | "admins"
  | "settings";

export interface AdminDashboardProps {
  open: boolean;
  onClose: () => void;
  adminUser: { name: string; email: string; role?: string };
  onSignOut: () => void;
  onProductsUpdated?: () => void;
}
