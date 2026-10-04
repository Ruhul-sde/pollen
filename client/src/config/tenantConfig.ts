export interface CompanyBranding {
  companyId: string;
  brandName: string;
  brandTagline: string;
  aboutTitle?: string;
  aboutStory?: string;
  logoUrl?: string;
  currencySymbol: string;
  currencyCode: string;
  supportEmail: string;
  supportPhone?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

export interface FeatureConfig {
  reviews: boolean;
  returns: boolean;
  coupons: boolean;
  newsletter: boolean;
  giftSet: boolean;
  adminDashboard: boolean;
  savedAddresses: boolean;
  dynamicPricing: boolean;
  orderTracking: boolean;
  socialProof: boolean;
}

export interface UserThemeConfig {
  accentColor: string;
  primaryColor?: string;
  mode: "dark" | "light" | "auto";
  bannerEnabled: boolean;
  bannerText: string;
}

export interface AdminThemeConfig {
  mode: "dark" | "light" | "midnight";
  accentColor: string;
  sidebarStyle?: "solid" | "glass" | "bordered";
}

export interface PolicySectionItem {
  id: string;
  heading: string;
  body: string;
}

export interface PolicyDocument {
  title: string;
  lastUpdated: string;
  intro: string;
  sections: PolicySectionItem[];
}

export interface PoliciesConfig {
  terms: PolicyDocument;
  ordersShipping: PolicyDocument;
  privacy: PolicyDocument;
  refund: PolicyDocument;
  cookies: PolicyDocument;
}

export interface TenantConfig {
  branding: CompanyBranding;
  features: FeatureConfig;
  theme: UserThemeConfig;
  adminTheme: AdminThemeConfig;
  policies?: PoliciesConfig;
  navigation?: {
    showCollectionLink?: boolean;
    showGiftSetLink?: boolean;
    showAboutLink?: boolean;
    customLinks?: Array<{ label: string; href: string }>;
  };
}

export const DEFAULT_ABOUT_STORY = `POLLEN is a fragrance brand made for everyday life.
A few sprays before leaving home.
Perfume before meeting someone.
Getting ready for no particular reason.
We like those little moments.
So we make fragrances that fit into them.
Different moods,days or different versions of you.
Pick the one that feels right today.
POLLEN, for the little moments that become part of your day.`;

export const DEFAULT_POLICIES: PoliciesConfig = {
  terms: {
    title: "Terms & Conditions",
    lastUpdated: "September 2026",
    intro: "Welcome to POLLEN.\n\nBy using our website or placing an order, you agree to these terms.",
    sections: [
      {
        id: "terms-products",
        heading: "Products",
        body: "We do our best to show our products as accurately as possible.\n\nThe colour of a product may look slightly different depending on your screen or device.",
      },
      {
        id: "terms-pricing",
        heading: "Pricing",
        body: "All prices are shown in Indian Rupees (₹).\n\nThe price shown at checkout applies to your order. Any applicable shipping charges will be shown before you complete your purchase.",
      },
      {
        id: "terms-orders",
        heading: "Orders",
        body: "Once your order is placed, you'll receive an order confirmation.\n\nAn order may be cancelled if the product becomes unavailable, there is an incorrect price or product detail on the website, or an order appears to involve fraudulent activity.\n\nIf we've already received your payment, we'll refund the amount paid for a cancelled order.",
      },
      {
        id: "terms-delivery",
        heading: "Delivery",
        body: "Orders are shipped to the address provided during checkout.\n\nDelivery time can vary depending on your location and the courier service.\n\nPlease check your address and phone number before placing your order.",
      },
      {
        id: "terms-damaged",
        heading: "Damaged or Incorrect Orders",
        body: "If your order arrives damaged, leaking, defective, or with the wrong product, contact us within 48 hours of delivery.\n\nPlease send your order number along with clear photos or a video of the product and packaging.\n\nWe'll review the issue and help with the appropriate resolution.",
      },
      {
        id: "terms-content",
        heading: "Website Content",
        body: "All POLLEN photographs, designs, text, product names, logos and other website content belong to POLLEN or are used with permission.\n\nPlease contact us before using any of our content elsewhere.",
      },
    ],
  },
  ordersShipping: {
    title: "Orders & Shipping",
    lastUpdated: "September 2026",
    intro: "Every POLLEN fragrance is priced at ₹499 for 50 ml. Shipping charges, if applicable, will be shown at checkout.",
    sections: [
      {
        id: "ship-pricing",
        heading: "Pricing & Checkout",
        body: "All prices are shown in Indian Rupees (₹).\n\nThe price shown at checkout applies to your order. Any applicable shipping charges will be shown before you complete your purchase.",
      },
      {
        id: "ship-delivery",
        heading: "Delivery Timelines",
        body: "Orders are shipped via India Post Speed Post EMS.\n\nDelivery time can vary depending on your location and the courier service. Please check your address and phone number before placing your order.",
      },
      {
        id: "ship-support",
        heading: "Customer Support",
        body: "For shipping questions or updates, reach out to us at contactpollen@gmail.com or on WhatsApp at +91 9609180954.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "September 2026",
    intro: "When you shop with POLLEN, we collect the information needed to process your order and get it to you.\n\nThis may include your name, phone number, email address, billing address, delivery address and order details.",
    sections: [
      {
        id: "privacy-usage",
        heading: "How We Use Your Information",
        body: "We use your information to:\n1. Process and deliver your orders\n2. Send order and delivery updates\n3. Respond to your questions\n4. Process payments\n5. Improve our website and products\n6. Prevent fraud and misuse\n7. Send marketing messages when you've chosen to receive them",
      },
      {
        id: "privacy-sharing",
        heading: "Sharing Your Information",
        body: "Some information needs to be shared with the people and services that help us run POLLEN.\n\nThis may include payment providers, courier partners, website providers and customer support services.\n\nWe only share information needed for these services.",
      },
      {
        id: "privacy-security",
        heading: "Your Information",
        body: "We take reasonable steps to keep your information safe.\n\nIf you have a question about your personal information or want to make a request about it, contact us at contactpollen@gmail.com.",
      },
    ],
  },
  refund: {
    title: "Refund & Exchange Policy",
    lastUpdated: "September 2026",
    intro: "We do not offer refunds; however, if the issue is genuine, a gift code of the same value will be provided to the customer.",
    sections: [
      {
        id: "refund-cover",
        heading: "What We Cover",
        body: "We offer replacements or gift codes for orders that arrive damaged, defective, or incorrect. This includes leakage, breakage, or a wrong item being delivered. As a fragrance brand our products cannot be returned or resold once opened, items cannot be returned once delivered.",
      },
      {
        id: "refund-claim",
        heading: "How to Raise a Claim",
        body: "We cover damaged, defective, or incorrect items. Report within 48 hours of delivery.\n\nWhat you need:\n1. Your order number\n2. An unboxing video showing the sealed package, opening and the issue\n3. Photos of the damaged packaging box with shipping label affixed and photos of damaged or wrong item.",
      },
      {
        id: "refund-contact",
        heading: "Contact Us",
        body: "On WhatsApp: +91 9609180954 OR mail: contactpollen@gmail.com",
      },
    ],
  },
  cookies: {
    title: "Cookie Policy",
    lastUpdated: "September 2026",
    intro: "POLLEN uses cookies to keep the website working properly and understand how people use it.",
    sections: [
      {
        id: "cookie-essential",
        heading: "Essential Website Cookies",
        body: "Some cookies help with things like your cart, checkout and website security.",
      },
      {
        id: "cookie-analytics",
        heading: "Analytics & Experience",
        body: "Others help us understand which parts of the website people use, so we can make the experience better.",
      },
      {
        id: "cookie-advertising",
        heading: "Advertising Performance",
        body: "We may also use cookies to understand how our advertising performs.",
      },
      {
        id: "cookie-manage",
        heading: "Managing Your Cookies",
        body: "You can manage or turn off cookies through your browser settings.\n\nSome parts of the website may not work properly when certain cookies are turned off.",
      },
    ],
  },
};

export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  branding: {
    companyId: "pollen-luxury",
    brandName: "Pollen",
    brandTagline: "Fragrances made for everyday life.",
    aboutTitle: "About POLLEN",
    aboutStory: DEFAULT_ABOUT_STORY,
    currencySymbol: "₹",
    currencyCode: "INR",
    supportEmail: "contactpollen@gmail.com",
    supportPhone: "+91 9609180954",
    socialLinks: {
      instagram: "https://www.instagram.com/_pollen.co",
      facebook: "https://www.facebook.com/share/1EKwnHM4Ya/",
    },
  },
  features: {
    reviews: true,
    returns: true,
    coupons: true,
    newsletter: true,
    giftSet: true,
    adminDashboard: true,
    savedAddresses: true,
    dynamicPricing: true,
    orderTracking: true,
    socialProof: true,
  },
  theme: {
    accentColor: "#f59e0b", // Amber gold
    primaryColor: "#000000",
    mode: "light",
    bannerEnabled: true,
    bannerText: "Complimentary India Post Speed Post on orders above ₹499 · Pure Extrait de Parfum",
  },
  adminTheme: {
    mode: "dark",
    accentColor: "#f59e0b",
    sidebarStyle: "solid",
  },
  policies: DEFAULT_POLICIES,
  navigation: {
    showCollectionLink: true,
    showGiftSetLink: true,
    showAboutLink: true,
  },
};
