import pollen1 from "./Images/1c.jpg";
import pollen2 from "./Images/2e.jpg";
import pollen3 from "./Images/3e.jpg";
import giftSetHero from "./Images/4a.PNG";

export const NAV_ITEMS = [
  { label: "SHOP", href: "/collection" },
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
 * Initial empty array before fetching live product details from MongoDB
 */
export const DEFAULT_FRAGRANCES: FragranceProduct[] = [];

export const FRAGRANCES: FragranceProduct[] = [];

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
      const serverOrigin = import.meta.env.VITE_SERVER_URL || "http://localhost:5001";
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
