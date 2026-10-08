import pollen1 from "./Images/1c.jpg";
import pollen2 from "./Images/2e.jpg";
import pollen3 from "./Images/3e.jpg";
import giftSetHero from "./Images/4a.PNG";

export const NAV_ITEMS = [
  { label: "SHOP", href: "#shop-collection" },
  { label: "GET YOUR BUNDLE", href: "/gift-set" },
  { label: "KNOW POLLEN", href: "/" },
  { label: "TRACK ORDER", href: "#track" },
  { label: "BUY NOW", href: "#fragrances" },
];

export interface FragranceProduct {
  id: number;
  _id?: string;
  productId?: number;
  slug?: string;
  name: string;
  tagline: string;
  description: string;
  storyTitle?: string;
  storyDescription?: string;
  notes: string[];
  volume?: string;
  type?: string;
  gender?: string;
  price: number;
  originalPrice?: number;
  img: string;
  imageUrl?: string;
  gallery?: string[];
  details?: string[];
  inStock?: boolean;
  isBundle?: boolean;
}

export const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "1": pollen2,
  "2": pollen3,
  "3": pollen1,
  "4": giftSetHero,
  "power-of-you": pollen2,
  "lost-cherry": pollen3,
  "fresh-orchid": pollen1,
  "gift-set": giftSetHero,
  "Power of You": pollen2,
  "Lost Cherry": pollen3,
  "Fresh Orchid": pollen1,
  "The Legacy Set": giftSetHero,
};

/**
 * Initial canonical fragrance products as fallback before/if fetching live product details from MongoDB
 */
export const DEFAULT_FRAGRANCES: FragranceProduct[] = [
  {
    id: 1,
    productId: 1,
    slug: "power-of-you",
    name: "Power of You",
    tagline: "Bold · Fierce · Unapologetic",
    description:
      "Black POLLEN perfume bottle with minimalist packaging. A commanding fragrance that asserts presence before you enter the room. Warm woods, dark musk, and a spark of citrus that lingers all day.",
    storyTitle: "Take the room. Keep your edge.",
    storyDescription:
      "Dark musk, cedarwood, and bergamot come together in a fragrance made for the version of you that does not wait for permission.",
    notes: ["Bergamot", "Cedarwood", "Dark Musk"],
    volume: "50 ML",
    type: "Parfum",
    gender: "Unisex",
    price: 499,
    originalPrice: 699,
    img: pollen2,
    imageUrl: pollen2,
    gallery: [pollen2],
    details: [
      "Long-lasting eau de parfum concentration (20% oil)",
      "Cruelty-free & sustainably harvested cedarwood essences",
      "Handcrafted glass flacon with brushed metal cap",
    ],
    inStock: true,
    isBundle: false,
  },
  {
    id: 2,
    productId: 2,
    slug: "lost-cherry",
    name: "Lost Cherry",
    tagline: "Sweet · Seductive · Unforgettable",
    description:
      "Burgundy POLLEN perfume bottle with minimalist packaging. A rich cherry accord layered over Turkish rose and bitter almond. Deeply sensual, dangerously addictive.",
    storyTitle: "Sweet on the surface. Dangerous underneath.",
    storyDescription:
      "A collision of ripe cherry, velvety Turkish rose, and bitter almond. An intoxicating presence that refuses to be ignored.",
    notes: ["Black Cherry", "Turkish Rose", "Bitter Almond"],
    volume: "50 ML",
    type: "Parfum",
    gender: "Unisex",
    price: 499,
    originalPrice: 699,
    img: pollen3,
    imageUrl: pollen3,
    gallery: [pollen3],
    details: [
      "High sillage intoxicating gourmand floral accord",
      "Natural Turkish rose absolute extracts",
      "Signature obsidian-tinted glass flacon",
    ],
    inStock: true,
    isBundle: false,
  },
  {
    id: 3,
    productId: 3,
    slug: "fresh-orchid",
    name: "Fresh Orchid",
    tagline: "Light · Airy · Effortlessly refined",
    description:
      "Blue POLLEN perfume bottle with minimalist packaging. White orchid petals lifted on a breeze of green tea and white cedar. Purity distilled into a single breath.",
    storyTitle: "Clean. Serene. Undeniable.",
    storyDescription:
      "White orchid and crisp green tea resting on white cedar. A calm and sophisticated aura that moves with you.",
    notes: ["Green Tea", "White Orchid", "White Cedar"],
    volume: "50 ML",
    type: "Parfum",
    gender: "Unisex",
    price: 499,
    originalPrice: 699,
    img: pollen1,
    imageUrl: pollen1,
    gallery: [pollen1],
    details: [
      "Crisp luminous fresh floral profile",
      "Clean cold-pressed botanical oils",
      "Minimalist aesthetic frosted flacon",
    ],
    inStock: true,
    isBundle: false,
  },
  {
    id: 4,
    productId: 4,
    slug: "gift-set",
    name: "The Legacy Set",
    tagline: "The Complete Trio · Power, Seduction & Purity",
    description:
      "All three signature Pollen fragrances in one luxury collector's edition gift box. 3 x 50ml bottles presented in our bespoke gift set.",
    storyTitle: "Every mood. Every side of you.",
    storyDescription:
      "Experience the full expression of Pollen. Switch effortlessly between Power of You, Lost Cherry, and Fresh Orchid to match any occasion.",
    notes: ["Fresh Orchid (50ml)", "Lost Cherry (50ml)", "Power of You (50ml)"],
    volume: "3 x 50 ML",
    type: "Parfum Trio",
    gender: "Unisex",
    price: 999,
    originalPrice: 1197,
    img: giftSetHero,
    imageUrl: giftSetHero,
    gallery: [giftSetHero],
    details: [
      "Includes all 3 full-sized 50ml fragrances",
      "Luxury embossed presentation gift box",
      "Best value collector bundle with savings",
    ],
    inStock: true,
    isBundle: true,
  },
];

export const FRAGRANCES: FragranceProduct[] = DEFAULT_FRAGRANCES;

/**
 * Converts a backend MongoDB product record into a rich frontend FragranceProduct
 */
export function mapBackendToFragrance(bp: any, index = 0): FragranceProduct {
  const id = Number(bp.productId ?? bp.id ?? index + 1);
  const name = bp.name || "Pollen Fragrance";
  const slug = bp.slug || name.toLowerCase().replace(/\s+/g, "-");

  // Determine image: if imageUrl is absolute, data URI, or server upload path, use it
  let img = pollen1;
  if (bp.imageUrl && typeof bp.imageUrl === "string") {
    if (bp.imageUrl.startsWith("http") || bp.imageUrl.startsWith("data:")) {
      img = bp.imageUrl;
    } else if (bp.imageUrl.startsWith("/uploads")) {
      const serverOrigin = import.meta.env.VITE_SERVER_URL || "https://pollen-server.jxdww2.easypanel.host";
      img = `${serverOrigin}${bp.imageUrl}`;
    } else {
      img = PRODUCT_IMAGE_MAP[slug] || PRODUCT_IMAGE_MAP[name] || bp.imageUrl;
    }
  } else {
    img =
      PRODUCT_IMAGE_MAP[slug] ||
      PRODUCT_IMAGE_MAP[name] ||
      PRODUCT_IMAGE_MAP[String(id)] ||
      pollen1;
  }

  return {
    id,
    _id: bp._id,
    productId: id,
    slug,
    name,
    tagline: bp.tagline || "",
    description: bp.description || "",
    storyTitle: bp.storyTitle || "",
    storyDescription: bp.storyDescription || "",
    notes: Array.isArray(bp.notes)
      ? bp.notes
          .map((n: any) => (typeof n === "string" ? n : n?.name || ""))
          .filter(Boolean)
      : [],
    volume: bp.volume || (id === 4 ? "3 x 50 ML" : "50 ML"),
    type: bp.type || (id === 4 ? "Parfum Trio" : "Parfum"),
    gender: bp.gender || "Unisex",
    price: Number(bp.price ?? 399),
    originalPrice: bp.originalPrice ? Number(bp.originalPrice) : undefined,
    img,
    imageUrl: bp.imageUrl || img,
    gallery: Array.isArray(bp.gallery) && bp.gallery.length > 0 ? bp.gallery : [img],
    details: Array.isArray(bp.details) ? bp.details : [],
    inStock: bp.inStock !== false,
    isBundle: Boolean(bp.isBundle || id === 4),
  };
}

export const AUTH_STORAGE_KEY = "know-pollen-user";
