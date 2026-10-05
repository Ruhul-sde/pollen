/**
 * Pollen Backend Services (Node.js + MongoDB API)
 * Replaces legacy Supabase with native Node.js Express & MongoDB backend.
 */

// Backend API base URL
const API_BASE_URL = "http://localhost:5001/api";

export const PAYMENT_API_BASE_URL = `${API_BASE_URL}/payments`;
export const PAYMENT_ORDER_URL = `${PAYMENT_API_BASE_URL}/create-order`;
export const PAYMENT_CAPTURE_URL = `${PAYMENT_API_BASE_URL}/capture`;
export const PAYMENT_VERIFY_URL = `${PAYMENT_API_BASE_URL}/verify`;

export async function createPaymentOrder(
  amount: number,
  receipt?: string,
  orderId?: string,
) {
  const response = await fetch(PAYMENT_ORDER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, receipt, orderId }),
  });
  const result = (await response.json()) as {
    success?: boolean;
    data?: { id: string | null; amount: number; currency: string; keyId?: string };
    message?: string;
    error?: string;
  };
  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.message ?? result.error ?? "Unable to start payment.");
  }
  return result.data;
}

export async function verifyPayment(paymentData: {
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature?: string;
  orderId?: string;
  trackingId?: string;
}) {
  const response = await fetch(PAYMENT_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(paymentData),
  });
  const result = (await response.json()) as {
    success?: boolean;
    message?: string;
    data?: any;
  };
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Payment verification failed.");
  }
  return result.data;
}

export async function capturePayment(paymentId: string, amount: number, orderId?: string) {
  const response = await fetch(PAYMENT_CAPTURE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId, amount: Math.round(amount * 100), orderId }),
  });
  const result = (await response.json()) as {
    success?: boolean;
    data?: { status?: string };
    message?: string;
    error?: string;
  };
  if (!response.ok || !result.success) {
    throw new Error(result.message ?? result.error ?? "Unable to capture payment.");
  }
  return result;
}

export type Order = {
  id: string;
  order_id?: string;
  orderId?: string;
  tracking_id: string;
  customer_name: string | null;
  delivery_phone: string | null;
  delivery_address: string | null;
  status: string;
  total_amount: number | null;
  created_at: string;
  coupon_code?: string | null;
  coupon_discount?: number | null;
};

export type SavedAddress = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  post_office: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  created_at: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  provider?: string;
};

export type AuthSession = {
  user: {
    id: string;
    email: string;
    app_metadata: { provider?: string; role?: string };
    user_metadata: { name?: string; role?: string };
  };
};

const SESSION_STORAGE_KEY = "pollen_user_session";
type AuthListener = (event: string, session: AuthSession | null) => void;
const authListeners: Set<AuthListener> = new Set();

function getStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: AuthSession | null) {
  try {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  authListeners.forEach((listener) => {
    try {
      listener(session ? "SIGNED_IN" : "SIGNED_OUT", session);
    } catch {
      // Ignore listener error
    }
  });
}

export function setCustomSession(user: { id: string; name: string; email: string; role?: string; provider?: string }) {
  const session: AuthSession = {
    user: {
      id: user.id,
      email: user.email,
      app_metadata: { provider: user.provider || "email", role: user.role || "user" },
      user_metadata: { name: user.name, role: user.role || "user" },
    },
  };
  setStoredSession(session);
}

/**
 * Native auth interface matching existing API contract
 */
export const supabase = {
  auth: {
    async getSession(): Promise<{ data: { session: AuthSession | null }; error: null }> {
      return { data: { session: getStoredSession() }, error: null };
    },
    onAuthStateChange(callback: AuthListener) {
      authListeners.add(callback);
      const session = getStoredSession();
      callback(session ? "INITIAL_SESSION" : "SIGNED_OUT", session);
      return {
        data: {
          subscription: {
            unsubscribe() {
              authListeners.delete(callback);
            },
          },
        },
      };
    },
    async signInWithPassword({
      email,
      password,
    }: {
      email: string;
      password?: string;
    }): Promise<{ error: Error | null }> {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { error: new Error(data.message || "Invalid credentials") };
        }
        if (data.requiresOtp) {
          return { error: null };
        }
        const user = data.data?.user || { id: "temp", email, name: email.split("@")[0], role: "user" };
        const session: AuthSession = {
          user: {
            id: user.id || "temp",
            email: user.email || email,
            app_metadata: { provider: user.provider || "email", role: user.role || "user" },
            user_metadata: { name: user.name || email.split("@")[0], role: user.role || "user" },
          },
        };
        setStoredSession(session);
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Unable to log in.") };
      }
    },
    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password?: string;
      options?: { data?: { name?: string } };
    }): Promise<{ data: { session: AuthSession | null }; error: Error | null }> {
      try {
        const name = options?.data?.name || email.split("@")[0];
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { data: { session: null }, error: new Error(data.message || "Failed to create account") };
        }
        if (data.requiresOtp) {
          return { data: { session: null }, error: null };
        }
        const user = data.data?.user || { id: "temp", email, name, role: "user" };
        const session: AuthSession = {
          user: {
            id: user.id || "temp",
            email: user.email || email,
            app_metadata: { provider: user.provider || "email", role: user.role || "user" },
            user_metadata: { name: user.name || name, role: user.role || "user" },
          },
        };
        setStoredSession(session);
        return { data: { session }, error: null };
      } catch (err) {
        return { data: { session: null }, error: err instanceof Error ? err : new Error("Sign up failed.") };
      }
    },
    async signInWithOAuth({
      provider,
    }: {
      provider: string;
      options?: { redirectTo?: string };
    }): Promise<{ error: Error | null }> {
      return {
        error: new Error(
          `OAuth with ${provider} is not configured. Please use email & password login.`,
        ),
      };
    },
    async updateUser({
      password,
    }: {
      password?: string;
    }): Promise<{ error: Error | null }> {
      const session = getStoredSession();
      if (!session?.user?.email) {
        return { error: new Error("User must be signed in to update password.") };
      }
      try {
        const res = await fetch(`${API_BASE_URL}/auth/update-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: session.user.email, newPassword: password }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { error: new Error(data.message || "Failed to update password") };
        }
        return { error: null };
      } catch (err) {
        return { error: err instanceof Error ? err : new Error("Failed to update password.") };
      }
    },
    async signOut(): Promise<{ error: Error | null }> {
      setStoredSession(null);
      return { error: null };
    },
  },
};

/**
 * Order APIs via Node.js + MongoDB
 */
export async function getOrderByTrackingId(
  _userId: string,
  trackingId: string,
): Promise<Order | null> {
  const res = await fetch(`${API_BASE_URL}/orders/track/${encodeURIComponent(trackingId.trim().toUpperCase())}`);
  if (res.status === 404) return null;
  const json = await res.json();
  if (!res.ok || !json.success || !json.data) return null;

  const o = json.data;
  return {
    id: o._id,
    tracking_id: o.trackingId,
    customer_name: o.customerName || null,
    delivery_phone: o.deliveryPhone || null,
    delivery_address: o.deliveryAddress || null,
    status: o.status || "pending",
    total_amount: o.totalAmount,
    created_at: o.createdAt,
  };
}

export async function createOrder(
  userId: string,
  totalAmount: number,
  customerName: string,
  address: SavedAddress,
  couponDetails?: {
    couponCode?: string;
    couponDiscount?: number;
    subtotal?: number;
    shippingCharge?: number;
  },
): Promise<Order> {
  const deliveryAddress = [
    address.address_line1,
    address.post_office,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId,
      customerName: customerName.trim(),
      deliveryPhone: address.phone,
      deliveryAddress,
      totalAmount,
      couponCode: couponDetails?.couponCode,
      couponDiscount: couponDetails?.couponDiscount,
      discount: couponDetails?.couponDiscount,
      subtotal: couponDetails?.subtotal,
      shippingCharge: couponDetails?.shippingCharge,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to create order");
  }

  const o = json.data;
  const isShipped = ["shipped", "out_for_delivery", "delivered"].includes(String(o.status || "").toLowerCase());
  const resolvedId = o.orderId || o.order_id || (o._id ? o._id.slice(-8) : "");
  return {
    id: o._id || o.id,
    order_id: resolvedId,
    orderId: resolvedId,
    tracking_id: isShipped ? (o.trackingId || "") : "",
    customer_name: o.customerName || null,
    delivery_phone: o.deliveryPhone || null,
    delivery_address: o.deliveryAddress || null,
    status: o.status,
    total_amount: o.totalAmount,
    coupon_code: o.couponCode || couponDetails?.couponCode || null,
    coupon_discount: o.couponDiscount ?? couponDetails?.couponDiscount ?? null,
    created_at: o.createdAt,
  };
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  const res = await fetch(`${API_BASE_URL}/orders?userId=${encodeURIComponent(userId)}`);
  const json = await res.json();
  if (!res.ok || !json.success) return [];

  return (json.data || []).map((o: any) => {
    const isShipped = ["shipped", "out_for_delivery", "delivered"].includes(String(o.status || "").toLowerCase());
    const resolvedId = o.orderId || o.order_id || (o._id ? o._id.slice(-8) : "");
    return {
      id: o._id || o.id,
      order_id: resolvedId,
      orderId: resolvedId,
      tracking_id: isShipped ? (o.trackingId || "") : "",
      customer_name: o.customerName || null,
      delivery_phone: o.deliveryPhone || null,
      delivery_address: o.deliveryAddress || null,
      status: o.status,
      total_amount: o.totalAmount,
      created_at: o.createdAt,
    };
  });
}

export async function markOrderPaid(_userId: string, orderId: string) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmed", paymentStatus: "paid" }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to mark order as paid");
  }
  return json.data;
}

export async function deleteOrder(userId: string, orderId: string) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}?userId=${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to delete order");
  }
}

/**
 * Address APIs via Node.js + MongoDB
 */
export async function getSavedAddresses(userId: string): Promise<SavedAddress[]> {
  const res = await fetch(`${API_BASE_URL}/addresses?userId=${encodeURIComponent(userId)}`);
  const json = await res.json();
  if (!res.ok || !json.success) return [];
  return json.data || [];
}

export async function createSavedAddress(
  userId: string,
  address: Omit<SavedAddress, "id" | "created_at">,
): Promise<SavedAddress> {
  const res = await fetch(`${API_BASE_URL}/addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...address }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to save address");
  }
  return json.data;
}

export async function updateSavedAddress(
  userId: string,
  addressId: string,
  address: Partial<SavedAddress>,
): Promise<SavedAddress> {
  const res = await fetch(`${API_BASE_URL}/addresses/${addressId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...address }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Failed to update address");
  }
  return json.data;
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

