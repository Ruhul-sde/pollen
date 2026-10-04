import React from "react";
import type { FragranceProduct } from "@/core/types";
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage";

// Gallery & Recommendation Assets
import orchidOne from "./Images/1a.PNG";
import orchidTwo from "./Images/1b.PNG";
import orchidThree from "./Images/1c.jpg";
import orchidFour from "./Images/1d.PNG";
import orchidFive from "./Images/1e.PNG";

import powerOne from "./Images/2a.PNG";
import powerTwo from "./Images/2b.png";
import powerThree from "./Images/2c.PNG";
import powerFour from "./Images/2d.PNG";
import powerFive from "./Images/2e.jpg";

import cherryThree from "./Images/3a.PNG";
import cherryOne from "./Images/3b.PNG";
import cherryGalleryThree from "./Images/3c.PNG";
import cherryTwo from "./Images/3d.PNG";
import cherryFour from "./Images/3e.jpg";

import giftSetHero from "./Images/4a.PNG";

// Re-export modular components from features
export {
  Hero,
  IntroStories,
  BottleCarousel,
  PricingSection,
  FragrancesSection,
  BundleSection,
  MomentSection,
  TrackBanner,
  AboutSection,
  DetailPurchaseControl,
  PerfumeVariants,
  GiftSetPage,
  GiftSetGallerySection,
  CollectionPage,
  CollectionPageUpdated,
  CollectionPageWithBack,
} from "@/features/catalog";

export { CheckoutSection } from "@/features/checkout";

// Gallery configurations
const POWER_OF_YOU_GALLERY = [
  { image: powerOne, alt: "Power of You fragrance" },
  { image: powerTwo, alt: "Power of You bottle detail" },
  { image: powerThree, alt: "Power of You fragrance detail" },
  { image: powerFour, alt: "Power of You lifestyle" },
  { image: powerFive, alt: "Power of You fragrance bottle" },
];

const POWER_OF_YOU_RECOMMENDATIONS = [
  { image: orchidOne, name: "Fresh Orchid", href: "/fresh-orchid" },
  { image: cherryThree, name: "Lost Cherry", href: "/lost-cherry" },
  { image: giftSetHero, name: "The Legacy Set", href: "/gift-set" },
];

const LOST_CHERRY_GALLERY = [
  { image: cherryOne, alt: "Lost Cherry fragrance" },
  { image: cherryTwo, alt: "Lost Cherry bottle detail" },
  { image: cherryGalleryThree, alt: "Lost Cherry fragrance detail" },
  { image: cherryFour, alt: "Lost Cherry lifestyle" },
  { image: cherryThree, alt: "Lost Cherry fragrance bottle" },
];

const LOST_CHERRY_RECOMMENDATIONS = [
  { image: orchidOne, name: "Fresh Orchid", href: "/fresh-orchid" },
  { image: powerOne, name: "Power of You", href: "/power-of-you" },
  { image: giftSetHero, name: "The Legacy Set", href: "/gift-set" },
];

const FRESH_ORCHID_GALLERY = [
  { image: orchidOne, alt: "Fresh Orchid fragrance" },
  { image: orchidTwo, alt: "Fresh Orchid bottle detail" },
  { image: orchidThree, alt: "Fresh Orchid fragrance detail" },
  { image: orchidFour, alt: "Fresh Orchid lifestyle" },
  { image: orchidFive, alt: "Fresh Orchid fragrance bottle" },
];

const FRESH_ORCHID_RECOMMENDATIONS = [
  { image: powerOne, name: "Power of You", href: "/power-of-you" },
  { image: cherryThree, name: "Lost Cherry", href: "/lost-cherry" },
  { image: giftSetHero, name: "The Legacy Set", href: "/gift-set" },
];

interface ProductPageProps {
  product?: FragranceProduct;
  onAddToCart: () => void;
  onBuyNow?: () => void;
  onBack: () => void;
  quantity: number;
  onChangeQuantity: (change: number) => void;
}

export function PowerOfYouPage({
  product,
  onAddToCart,
  onBuyNow,
  onBack,
  quantity,
  onChangeQuantity,
}: ProductPageProps) {
  return (
    <ProductDetailPage
      product={product}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      onBack={onBack}
      quantity={quantity}
      onChangeQuantity={onChangeQuantity}
      galleryImages={POWER_OF_YOU_GALLERY}
      recommendations={[]}
    />
  );
}

export function PowerOfYouPageWithRecommendations({
  product,
  onAddToCart,
  onBuyNow,
  onBack,
  quantity,
  onChangeQuantity,
}: ProductPageProps) {
  return (
    <ProductDetailPage
      product={product}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      onBack={onBack}
      quantity={quantity}
      onChangeQuantity={onChangeQuantity}
      galleryImages={POWER_OF_YOU_GALLERY}
      recommendations={POWER_OF_YOU_RECOMMENDATIONS}
    />
  );
}

export function LostCherryPageWithRecommendations({
  product,
  onAddToCart,
  onBuyNow,
  onBack,
  quantity,
  onChangeQuantity,
}: ProductPageProps) {
  return (
    <ProductDetailPage
      product={product}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      onBack={onBack}
      quantity={quantity}
      onChangeQuantity={onChangeQuantity}
      galleryImages={LOST_CHERRY_GALLERY}
      recommendations={LOST_CHERRY_RECOMMENDATIONS}
    />
  );
}

export function FreshOrchidPageWithRecommendations({
  product,
  onAddToCart,
  onBuyNow,
  onBack,
  quantity,
  onChangeQuantity,
}: ProductPageProps) {
  return (
    <ProductDetailPage
      product={product}
      onAddToCart={onAddToCart}
      onBuyNow={onBuyNow}
      onBack={onBack}
      quantity={quantity}
      onChangeQuantity={onChangeQuantity}
      galleryImages={FRESH_ORCHID_GALLERY}
      recommendations={FRESH_ORCHID_RECOMMENDATIONS}
    />
  );
}
