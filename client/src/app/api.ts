/**
 * API Client for Pollen Node.js Backend Server
 */

// Backend API base URL
const API_BASE_URL = "http://localhost:5001/api";

export interface ServerHealthResponse {
  success: boolean;
  message: string;
  uptime: number;
  timestamp: string;
  environment: string;
  database: {
    status: "connected" | "disconnected" | "connecting" | "disconnecting" | "unknown";
    host: string | null;
    database: string | null;
  };
}

export interface BackendProduct {
  _id: string;
  productId?: number;
  slug?: string;
  name: string;
  tagline?: string;
  description: string;
  storyTitle?: string;
  storyDescription?: string;
  notes: string[];
  volume?: string;
  type?: string;
  gender?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  gallery?: string[];
  details?: string[];
  isBundle?: boolean;
  inStock: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BackendOrder {
  _id: string;
  trackingId: string;
  carrier?: string;
  consignmentNumber?: string;
  shippingMethod?: string;
  trackingUrl?: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  deliveryPhone?: string;
  deliveryAddress?: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminStats {
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalRevenue: number;
  statusCounts: {
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  recentOrders: BackendOrder[];
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "user" | "admin";
  createdAt?: string;
}

/**
 * Auto-detect District / City and State from Indian 6-digit PIN Code
 */
export async function lookupPincode(
  pincode: string
): Promise<{ city: string; district: string; state: string; postOffices: string[] } | null> {
  const cleanPin = pincode.replace(/\D/g, "").slice(0, 6);
  if (cleanPin.length !== 6) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (
        Array.isArray(data) &&
        data[0]?.Status === "Success" &&
        Array.isArray(data[0]?.PostOffice) &&
        data[0].PostOffice.length > 0
      ) {
        const poList = data[0].PostOffice;
        const first = poList[0];
        const district = first.District || first.Division || first.Block || "";
        const state = first.State || "";
        const city = district || first.Name || "";
        const postOffices = poList.map((p: any) => p.Name).filter(Boolean);

        return {
          district,
          city,
          state,
          postOffices,
        };
      }
    }
  } catch (err) {
    console.warn("Postal API error or timeout, trying backend circle fallback:", err);
  }

  // Fallback: Query backend Speed Post circle info
  try {
    const fallbackRes = await fetch(`${API_BASE_URL}/shipping/calculate?pincode=${cleanPin}&cartTotal=0`);
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      const info = fallbackData?.data?.circleInfo || fallbackData?.data;
      if (info?.state && info.state !== "India") {
        return {
          district: info.circle || info.gpo || "",
          city: info.circle || info.gpo || "",
          state: info.state,
          postOffices: [info.gpo || info.circle].filter(Boolean),
        };
      }
    }
  } catch (fallbackErr) {
    console.warn("Backend pincode fallback error:", fallbackErr);
  }

  return null;
}

/**
 * Check backend and MongoDB connection health
 */
export async function checkServerHealth(): Promise<ServerHealthResponse> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok && res.status !== 503) {
    throw new Error(`Server returned HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch products from MongoDB
 */
export async function fetchProducts(): Promise<BackendProduct[]> {
  const endpoints = Array.from(
    new Set([
      `${API_BASE_URL}/products`,
      "/api/products",
    ]),
  );

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        if (result && Array.isArray(result.data) && result.data.length > 0) {
          return result.data;
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return [];
}

/**
 * Fetch a single product by ID or slug
 */
export async function fetchProductById(idOrSlug: string): Promise<BackendProduct | null> {
  const endpoints = Array.from(
    new Set([
      `${API_BASE_URL}/products/${encodeURIComponent(idOrSlug)}`,
      `/api/products/${encodeURIComponent(idOrSlug)}`,
    ]),
  );

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const result = await res.json();
        if (result && result.data) {
          return result.data;
        }
      }
    } catch {
      // Try next endpoint
    }
  }

  return null;
}

/**
 * Seed initial products into MongoDB if empty
 */
export async function seedProducts(force = false): Promise<BackendProduct[]> {
  const res = await fetch(`${API_BASE_URL}/products/seed${force ? "?force=true" : ""}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to seed products: ${res.statusText}`);
  }
  const result = await res.json();
  return result.data || [];
}

/**
 * Create a new order in MongoDB
 */
export async function createBackendOrder(orderData: {
  userId?: string;
  customerName: string;
  customerEmail?: string;
  deliveryPhone: string;
  deliveryAddress: string;
  totalAmount: number;
  items?: Array<{ name: string; price: number; quantity: number }>;
}): Promise<BackendOrder> {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });

  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.message || "Failed to create order");
  }
  return result.data;
}

/**
 * Track an order by tracking ID
 */
export async function trackBackendOrder(trackingId: string): Promise<BackendOrder> {
  const res = await fetch(`${API_BASE_URL}/orders/track/${encodeURIComponent(trackingId)}`);
  const result = await res.json();
  if (!res.ok || !result.success) {
    throw new Error(result.message || "Order not found");
  }
  return result.data;
}

/**
 * User Profile API
 */
export async function getUserProfile(userId?: string, email?: string): Promise<UserProfile> {
  const param = userId ? `userId=${encodeURIComponent(userId)}` : `email=${encodeURIComponent(email || "")}`;
  const res = await fetch(`${API_BASE_URL}/auth/profile?${param}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load profile");
  }
  return data.data;
}

export async function updateUserProfile(payload: {
  userId?: string;
  email?: string;
  name?: string;
  phone?: string;
}): Promise<UserProfile> {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update profile");
  }
  return data.data;
}

export async function updateSavedAddress(
  addressId: string,
  addressData: any,
): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(addressData),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update address");
  }
  return data.data;
}

export async function deleteSavedAddress(addressId: string, userId?: string): Promise<void> {
  const param = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await fetch(`${API_BASE_URL}/addresses/${addressId}${param}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to delete address");
  }
}

/**
 * Admin Token Management
 */
export function getAdminToken(): string | null {
  try {
    return localStorage.getItem("pollen_admin_token");
  } catch {
    return null;
  }
}

export function setAdminToken(token: string) {
  try {
    localStorage.setItem("pollen_admin_token", token);
  } catch {
    // ignore
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem("pollen_admin_token");
  } catch {
    // ignore
  }
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Get auth token - checks admin token first, then falls back to user session token
 */
export function getAuthToken(): string | null {
  // Try admin token first
  const adminToken = getAdminToken();
  if (adminToken) return adminToken;

  // Try user session token from localStorage
  try {
    const session = localStorage.getItem("pollen_user_session");
    if (session) {
      const parsed = JSON.parse(session);
      return parsed?.accessToken || null;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Customer Register & Login (MongoDB Backend)
 */
export async function registerCustomer(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const endpoints = [
    `${API_BASE_URL}/v1/auth/register`,
    `${API_BASE_URL}/auth/register`,
    `${API_BASE_URL}/auth/signup`,
  ];

  let lastError = "Registration failed";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.requiresOtp) {
          return {
            requiresOtp: true,
            email: data.data?.email || payload.email,
            message: data.message,
          };
        }
        return data.data || data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

export async function continueWithEmail(payload: { email: string; name?: string; phone?: string }) {
  const endpoints = [
    `${API_BASE_URL}/v1/auth/continue-with-email`,
    `${API_BASE_URL}/auth/continue-with-email`,
  ];

  let lastError = "Failed to send verification code";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

export async function verifyRegistrationOTP(payload: { email: string; otp: string }) {
  const endpoints = [
    `${API_BASE_URL}/v1/auth/verify-email`,
    `${API_BASE_URL}/auth/verify-email`,
  ];

  let lastError = "Invalid or expired verification code";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

export async function resendRegistrationOTP(email: string) {
  const endpoints = [
    `${API_BASE_URL}/v1/auth/resend-otp`,
    `${API_BASE_URL}/auth/resend-otp`,
  ];

  let lastError = "Failed to resend verification code";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

export async function loginCustomer(payload: { email: string; password: string }) {
  const endpoints = [
    `${API_BASE_URL}/v1/auth/login`,
    `${API_BASE_URL}/auth/login`,
  ];

  let lastError = "Invalid email or password";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.requiresOtp) {
          return {
            requiresOtp: true,
            email: data.data?.email || payload.email,
            message: data.message,
          };
        }
        return data.data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

export async function verifyLoginOTP(payload: { email: string; otp: string }) {
  const endpoints = [
    `${API_BASE_URL}/v1/auth/verify-login-otp`,
    `${API_BASE_URL}/auth/verify-login-otp`,
  ];

  let lastError = "Invalid or expired verification code";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

export async function resendLoginOTP(email: string) {
  const endpoints = [
    `${API_BASE_URL}/v1/auth/resend-login-otp`,
    `${API_BASE_URL}/auth/resend-login-otp`,
  ];

  let lastError = "Failed to resend verification code";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

export async function forgotPassword(email: string) {
  const endpoints = [
    `${API_BASE_URL}/v1/auth/forgot-password`,
    `${API_BASE_URL}/auth/forgot-password`,
  ];

  let lastError = "Failed to send password reset code";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

export async function resetPassword(payload: { email: string; otp: string; password: string }) {
  const endpoints = [
    `${API_BASE_URL}/v1/auth/reset-password`,
    `${API_BASE_URL}/auth/reset-password`,
  ];

  let lastError = "Failed to reset password";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

/**
 * Admin Login
 */
export async function adminLogin(email: string, password: string) {
  const endpoints = [
    `${API_BASE_URL}/v1/admin/login`,
    `${API_BASE_URL}/admin/login`,
    `${API_BASE_URL}/auth/admin-login`,
  ];

  let lastError = "Invalid admin credentials";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const admin = data.data?.admin || data.data?.user || { email, name: "Admin", role: "admin" };
        const token = data.data?.accessToken;
        if (token) {
          setAdminToken(token);
        }
        return {
          id: admin.id || admin._id,
          name: admin.name || "Administrator",
          email: admin.email,
          role: admin.role || "superadmin",
          permissions: admin.permissions || [],
          accessToken: token,
        };
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

/**
 * Get Admin Dashboard Stats
 */
export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/dashboard`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    // Try fallback endpoint
    const fallbackRes = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: getAuthHeaders(),
    });
    const fallbackData = await fallbackRes.json();
    if (!fallbackRes.ok || !fallbackData.success) {
      throw new Error(data.message || "Failed to load admin stats");
    }
    return fallbackData.data;
  }
  return data.data;
}

/**
 * Get all orders for Admin
 */
export async function getAdminOrders(status = "all"): Promise<any[]> {
  const query = status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${API_BASE_URL}/v1/admin/orders${query}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (res.ok && data.success) {
    return Array.isArray(data.data) ? data.data : (data.data?.data || []);
  }
  // Fallback
  const fallback = await fetch(`${API_BASE_URL}/admin/orders${query}`, {
    headers: getAuthHeaders(),
  });
  const fallbackData = await fallback.json();
  if (fallback.ok && fallbackData.success) {
    return fallbackData.data || [];
  }
  return [];
}

/**
 * Update order status from Admin
 */
export async function updateAdminOrderStatus(
  orderId: string,
  payload:
    | string
    | {
        status: string;
        carrier?: string;
        consignmentNumber?: string;
        trackingId?: string;
        trackingUrl?: string;
        trackingDescription?: string;
        description?: string;
        location?: string;
      }
): Promise<any> {
  const body = typeof payload === "string" ? { status: payload } : payload;
  const res = await fetch(`${API_BASE_URL}/v1/admin/orders/${orderId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    // Try PATCH fallback
    const patchRes = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const patchData = await patchRes.json();
    if (!patchRes.ok || !patchData.success) {
      throw new Error(data.message || patchData.message || "Failed to update order status");
    }
    return patchData.data;
  }
  return data.data;
}

export interface DynamicShippingInfo {
  carrier: string;
  carrierNameHindi: string;
  carrierCode: string;
  serviceName: string;
  originOffice: string;
  destinationCircle: string;
  destinationState: string;
  destinationGPO: string;
  tier: "local" | "circle" | "national" | "special";
  standardCharge: number;
  charge: number;
  isFreeShipping: boolean;
  isWaived?: boolean;
  waivedAmount?: number;
  waiveLabel?: string;
  freeShippingAbove: number;
  minDays: number;
  maxDays: number;
  estimatedDaysText: string;
  estimatedDeliveryText: string;
  officialTrackingUrl: string;
  serviceable: boolean;
  codAvailable?: boolean;
  codCharge?: number;
}

/**
 * Dynamic Indian Speed Post shipping calculator
 */
export async function calculateDynamicShipping(
  pincode: string,
  cartTotal: number
): Promise<DynamicShippingInfo> {
  const cleanPin = pincode.replace(/\D/g, "").slice(0, 6);
  try {
    const res = await fetch(
      `${API_BASE_URL}/v1/shipping/calculate?pincode=${encodeURIComponent(cleanPin)}&cartTotal=${cartTotal}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("Speed Post dynamic shipping calculation fallback:", err);
  }

  // Graceful client fallback matching Indian Speed Post domestic tariff
  let customConfig: any = null;
  try {
    const raw = localStorage.getItem("pollen_shipping_config");
    if (raw) customConfig = JSON.parse(raw);
  } catch {}

  const isLocal = cleanPin.startsWith("11");
  const isCircle =
    cleanPin.startsWith("12") ||
    cleanPin.startsWith("13") ||
    cleanPin.startsWith("14") ||
    cleanPin.startsWith("20") ||
    cleanPin.startsWith("25");
  const isSpecial =
    cleanPin.startsWith("78") || cleanPin.startsWith("79") || cleanPin.startsWith("19");

  const tier = isLocal ? "local" : isCircle ? "circle" : isSpecial ? "special" : "national";
  const isFlat = customConfig?.shippingType === "flat";
  const localPrice = customConfig?.localCharge !== undefined ? Number(customConfig.localCharge) : 35;
  const circlePrice = customConfig?.circleCharge !== undefined ? Number(customConfig.circleCharge) : 47;
  const nationalPrice = customConfig?.nationalCharge !== undefined ? Number(customConfig.nationalCharge) : 65;
  const specialPrice = customConfig?.specialCharge !== undefined ? Number(customConfig.specialCharge) : 85;
  const flatPrice = customConfig?.flatCharge !== undefined ? Number(customConfig.flatCharge) : 65;
  const freeThreshold = customConfig?.freeShippingAbove !== undefined ? Number(customConfig.freeShippingAbove) : 499;

  const standardCharge = isFlat
    ? flatPrice
    : isLocal
    ? localPrice
    : isCircle
    ? circlePrice
    : isSpecial
    ? specialPrice
    : nationalPrice;

  const hasFreeShipping = freeThreshold > 0;
  const isFree = hasFreeShipping && cartTotal >= freeThreshold;
  const charge = isFree ? 0 : standardCharge;
  const minDays = isLocal ? 1 : isCircle ? 2 : isSpecial ? 5 : 3;
  const maxDays = isLocal ? 2 : isCircle ? 3 : isSpecial ? 7 : 5;

  return {
    carrier: "India Post Speed Post",
    carrierNameHindi: "भारतीय डाक - स्पीड पोस्ट",
    carrierCode: "INDIAPOST_SPEEDPOST",
    serviceName: "Domestic Express Air & Surface Speed Post",
    originOffice: "New Delhi GPO (Booking NSH)",
    destinationCircle: "India Post National Network",
    destinationState: "India",
    destinationGPO: "National Sorting Hub",
    tier,
    standardCharge,
    charge,
    isFreeShipping: isFree,
    freeShippingAbove: 499,
    minDays,
    maxDays,
    estimatedDaysText: `${minDays}-${maxDays} Business Days`,
    estimatedDeliveryText: `${minDays}-${maxDays} Business Days via Speed Post`,
    officialTrackingUrl: "https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx",
    serviceable: true,
  };
}

/**
 * Fetch live Speed Post tracking status
 */
export async function trackOrderLive(trackingId: string): Promise<any> {
  const cleanId = encodeURIComponent(trackingId.trim());
  const res = await fetch(`${API_BASE_URL}/v1/orders/track/${cleanId}`);
  if (!res.ok) {
    const legRes = await fetch(`${API_BASE_URL}/orders/track/${cleanId}`);
    if (legRes.ok) {
      const legData = await legRes.json();
      return legData.data || legData;
    }
    throw new Error(`Tracking details not found for ${trackingId}`);
  }
  const data = await res.json();
  return data.data;
}

/**
 * Delete order from Admin
 */
export async function deleteAdminOrder(orderId: string): Promise<void> {
  // Try v1 admin endpoint first
  const endpoints = [
    `${API_BASE_URL}/v1/admin/orders/${orderId}`,
    `${API_BASE_URL}/admin/orders/${orderId}`,
    `/api/v1/admin/orders/${orderId}`,
    `/api/orders/${orderId}`,
  ];

  let lastError = "";
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({ success: true }));
        if (data.success !== false) return;
        lastError = data.message || "Failed to delete order";
      } else {
        const data = await res.json().catch(() => ({}));
        lastError = data.message || `HTTP ${res.status}`;
        // Continue to try next endpoint
      }
    } catch {
      // Network error — try next endpoint
    }
  }
  throw new Error(lastError || "Failed to delete order");
}

/**
 * Products Admin
 */
export async function getAdminProducts(): Promise<BackendProduct[]> {
  const res = await fetch(`${API_BASE_URL}/v1/products?limit=100`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (res.ok && data.success) {
    return data.data || [];
  }
  return fetchProducts();
}

export async function createAdminProduct(productData: any): Promise<BackendProduct> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/products`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create product");
  }
  return data.data;
}

export async function updateAdminProduct(
  productId: string,
  updateData: Partial<BackendProduct>
): Promise<BackendProduct> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/products/${productId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update product");
  }
  return data.data;
}

export async function deleteAdminProduct(productId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/products/${productId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to delete product");
  }
}

/**
 * Upload Image (Admin/User)
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE_URL}/v1/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
      if (data.relativeUrl) return data.relativeUrl;
    }
  } catch (err) {
    console.warn("Backend image upload failed, falling back to base64 DataURL:", err);
  }

  // Fallback to base64 data URL
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Customers / Users Admin
 */
export async function getAdminUsers(search = ""): Promise<AdminUser[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const res = await fetch(`${API_BASE_URL}/v1/admin/users${query}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load users");
  }
  return data.data || [];
}

export async function toggleAdminUserStatus(userId: string, isActive: boolean) {
  const res = await fetch(`${API_BASE_URL}/v1/admin/users/${userId}/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ isActive }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update user status");
  }
  return data.data;
}

export interface AdminCustomerDetails {
  user: AdminUser & {
    avatar?: string;
    isVerified?: boolean;
    loyaltyPoints?: number;
    loyaltyTier?: string;
    referralCode?: string;
    lastLogin?: string;
    createdAt?: string;
  };
  orders: any[];
  cart: {
    items: any[];
    itemCount: number;
    subtotal: number;
    updatedAt?: string | null;
  };
  wishlist: any[];
  addresses: any[];
  loginHistory: Array<{
    timestamp: string;
    ip?: string;
    device?: string;
    method?: string;
  }>;
  metrics: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
    cartItemsCount: number;
    cartValue: number;
    wishlistCount: number;
    savedAddressesCount: number;
    accountAgeDays: number;
    lastActive: string;
  };
}

export async function getAdminCustomerDetails(userId: string): Promise<AdminCustomerDetails> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/users/${userId}/details`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to load customer details");
  }
  return data.data;
}

/**
 * Returns & Refunds Admin
 */
export async function getAdminReturns(status = ""): Promise<any[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await fetch(`${API_BASE_URL}/v1/admin/returns${query}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return (res.ok && data.success) ? (data.data || []) : [];
}

export async function processAdminReturn(
  returnId: string,
  payload: { status: string; adminNotes?: string; rejectionReason?: string; refundAmount?: number; refundMethod?: string }
) {
  const res = await fetch(`${API_BASE_URL}/v1/admin/returns/${returnId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to process return");
  }
  return data.data;
}

/**
 * Coupons Admin
 */
export async function getAdminCoupons(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/coupons`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return (res.ok && data.success) ? (data.data || []) : [];
}

export async function createAdminCoupon(payload: any) {
  const res = await fetch(`${API_BASE_URL}/v1/admin/coupons`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create coupon");
  }
  return data.data;
}

export async function updateAdminCoupon(id: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/v1/admin/coupons/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update coupon");
  }
  return data.data;
}

export async function deleteAdminCoupon(id: string) {
  const res = await fetch(`${API_BASE_URL}/v1/admin/coupons/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to delete coupon");
  }
}

/**
 * Customer Coupons & Checkout Discounts
 */
export interface ValidatedCoupon {
  code: string;
  type: string;
  value: number;
  discount: number;
  freeShipping?: boolean;
  description?: string;
  minOrderAmount?: number;
  maxDiscount?: number;
}

export async function validateCoupon(code: string, cartTotal: number): Promise<ValidatedCoupon> {
  const endpoints = [
    `${API_BASE_URL}/v1/coupons/validate`,
    `${API_BASE_URL}/v1/validate`,
    `${API_BASE_URL}/coupons/validate`,
  ];

  let lastError = "Invalid or expired coupon code";
  const token = getAdminToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          cartTotal: Number(cartTotal) || 0,
          productIds: [],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        return data.data;
      }
      if (data.message) lastError = data.message;
    } catch {
      // try next
    }
  }

  throw new Error(lastError);
}

export async function getAvailableCoupons(): Promise<any[]> {
  const endpoints = [
    `${API_BASE_URL}/v1/coupons/available`,
    `${API_BASE_URL}/v1/available`,
    `${API_BASE_URL}/coupons/available`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        return data.data;
      }
    } catch {
      // try next
    }
  }

  return [];
}

/**
 * Reviews Admin
 */
export async function getAdminReviews(isApproved?: boolean): Promise<any[]> {
  const query = isApproved !== undefined ? `?isApproved=${isApproved}` : "";
  const res = await fetch(`${API_BASE_URL}/v1/admin/reviews${query}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return (res.ok && data.success) ? (data.data || []) : [];
}

export async function approveAdminReview(reviewId: string, approve: boolean, adminResponse = "") {
  const res = await fetch(`${API_BASE_URL}/v1/admin/reviews/${reviewId}/approve`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ approve, adminResponse }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update review approval");
  }
  return data.data;
}

/**
 * Shipping Rules Admin
 */
export async function getAdminShippingRules(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/shipping`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return (res.ok && data.success) ? (data.data || []) : [];
}

export async function createAdminShippingRule(payload: any) {
  const res = await fetch(`${API_BASE_URL}/v1/admin/shipping`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to create shipping rule");
  }
  return data.data;
}

export async function updateAdminShippingRule(id: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/v1/admin/shipping/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update shipping rule");
  }
  try {
    localStorage.setItem("pollen_shipping_config", JSON.stringify(data.data));
  } catch {}
  return data.data;
}

export async function saveAdminShippingConfig(payload: any) {
  const url = payload?._id
    ? `${API_BASE_URL}/v1/admin/shipping/${payload._id}`
    : `${API_BASE_URL}/v1/admin/shipping`;
  const res = await fetch(url, {
    method: payload?._id ? "PUT" : "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to save shipping configuration");
  }
  try {
    localStorage.setItem("pollen_shipping_config", JSON.stringify(data.data));
  } catch {}
  return data.data;
}

/**
 * Audit Logs & Newsletter
 */
export async function getAdminAuditLogs(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/audit-logs`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return (res.ok && data.success) ? (data.data || []) : [];
}

export async function getAdminNewsletterSubscribers(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/newsletter`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return (res.ok && data.success) ? (data.data || []) : [];
}

/**
 * Reports Admin
 */
export async function getAdminSalesReport(from?: string, to?: string, groupBy = "day") {
  let query = `?groupBy=${groupBy}`;
  if (from) query += `&from=${encodeURIComponent(from)}`;
  if (to) query += `&to=${encodeURIComponent(to)}`;
  const res = await fetch(`${API_BASE_URL}/v1/admin/reports/sales${query}`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  return (res.ok && data.success) ? data.data : null;
}

/**
 * Razorpay Payment APIs
 */
export async function getRazorpayConfig(): Promise<{ success: boolean; keyId: string; hasSecret: boolean }> {
  const res = await fetch(`${API_BASE_URL}/payments/config`);
  const data = await res.json();
  return data;
}

export async function createRazorpayOrder(amount: number, receipt?: string, orderId?: string) {
  const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, receipt, orderId }),
  });
  const data = await res.json();
  if (!res.ok || !data.success || !data.data) {
    throw new Error(data.message || "Failed to create payment order");
  }
  return data.data;
}

export async function verifyRazorpayPayment(payload: {
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  orderId?: string;
  trackingId?: string;
}) {
  const res = await fetch(`${API_BASE_URL}/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Payment verification failed");
  }
  return data.data;
}

/**
 * Settings Admin & Storefront APIs
 */
export async function getAdminSettings(group?: string): Promise<any[]> {
  const url = group
    ? `${API_BASE_URL}/v1/admin/settings?group=${encodeURIComponent(group)}`
    : `${API_BASE_URL}/v1/admin/settings`;
  const res = await fetch(url, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (res.ok && data.success) {
    return data.data || [];
  }
  return [];
}

export async function updateAdminSettings(updates: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/v1/admin/settings`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Failed to update settings");
  }
  return data;
}

export async function getPublicStoreSettings(): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/v1/settings`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("[Settings] Could not load public settings:", err);
  }
  return null;
}


