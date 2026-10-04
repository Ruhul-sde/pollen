export interface FragranceNote {
  type?: "top" | "heart" | "base" | string;
  name: string;
}

export interface FragranceProduct {
  id: number;
  name: string;
  tagline: string;
  price: number;
  originalPrice?: number;
  description: string;
  storyTitle: string;
  storyDescription: string;
  notes: string[];
  volume?: string;
  type?: string;
  gender?: string;
  img: string;
  images?: string[];
  isBundle?: boolean;
  slug?: string;
  inStock?: boolean;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  img: string;
  volume?: string;
  type?: string;
}

export interface SavedAddress {
  id: string;
  label?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  post_office?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  created_at?: string;
  name?: string;
  address?: string;
  pincode?: string;
  email?: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  savedAddresses?: SavedAddress[];
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  img?: string;
  volume?: string;
}

export interface OrderRecord {
  id?: string;
  _id?: string;
  orderId?: string;
  displayId?: string;
  createdAt?: string;
  created_at?: string;
  status: string;
  paymentStatus?: string;
  amount?: number;
  total?: number;
  items?: OrderItem[];
  shippingAddress?: SavedAddress;
  shipping_address?: SavedAddress;
  trackingId?: string;
  courierName?: string;
  trackingUpdates?: Array<{
    status: string;
    description: string;
    timestamp: string;
  }>;
  hasReturnRequested?: boolean;
  returnStatus?: string;
  returnReason?: string;
}

export interface Coupon {
  _id?: string;
  code: string;
  discountType?: "percentage" | "fixed" | "flat";
  discountValue?: number;
  type?: "percentage" | "flat" | string;
  value?: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  expiresAt?: string;
  isActive?: boolean;
  isPrivate?: boolean;
  visibility?: "public" | "private";
  description?: string;
}
