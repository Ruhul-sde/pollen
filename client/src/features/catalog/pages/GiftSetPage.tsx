import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import giftGalleryOne from "@/app/Images/4a.PNG";
import giftGalleryTwo from "@/app/Images/4b.PNG";
import giftGalleryThree from "@/app/Images/4c.jpg";
import giftGalleryFour from "@/app/Images/4d.PNG";
import giftGalleryFive from "@/app/Images/4e.PNG";
import { FragranceProduct } from "@/core/types";
import { PriceTag } from "@/shared/components/PriceTag";
import { Footer } from "@/app/footer";

const GIFT_SET_GALLERY = [
  { image: giftGalleryOne, alt: "The Gift Set" },
  { image: giftGalleryTwo, alt: "The Gift Set" },
  { image: giftGalleryThree, alt: "The Gift Set" },
  { image: giftGalleryFour, alt: "The Gift Set" },
  { image: giftGalleryFive, alt: "The Gift Set" },
];

interface GiftSetGalleryProps {
  product?: FragranceProduct;
  onAddBundle: () => void;
  onBuyNow?: () => void;
  onBack: () => void;
}

export function GiftSetGallerySection({ product, onAddBundle, onBuyNow, onBack }: GiftSetGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (!product) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-12 text-xs uppercase tracking-widest text-black/50">
        Loading bundle details from database...
      </div>
    );
  }

  const changeImage = (direction: number) =>
    setActiveImage((index) => (index + direction + GIFT_SET_GALLERY.length) % GIFT_SET_GALLERY.length);

  const price = product.price;
  const originalPrice = product.originalPrice ?? 1197;
  const name = product.name;
  const volume = product.volume || "(3 × 50ML)";
  const tagline = product.tagline || "The Complete Trio · Power, Seduction & Purity";
  const description = product.description;

  return (
    <section className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white px-3 pb-16 pt-4 sm:px-6 md:px-8 md:pt-8 transition-colors duration-200">
      <div className="mx-auto max-w-[1440px]">
        {/* Top Navigation Back Button (Instant visibility on mobile and desktop) */}
        <div className="mb-3 sm:mb-5">
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 -ml-2.5 text-xs font-bold uppercase tracking-[0.18em] text-black/60 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 duration-200" />
            <span>Back</span>
          </button>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:gap-16">
          <div className="min-w-0">
            <div
              className="relative overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900 md:hidden"
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0].clientX;
              }}
              onTouchEnd={(event) => {
                if (touchStartX.current === null) return;
                const distance = touchStartX.current - event.changedTouches[0].clientX;
                touchStartX.current = null;
                if (Math.abs(distance) > 40) changeImage(distance > 0 ? 1 : -1);
              }}
            >
              <img
                src={GIFT_SET_GALLERY[activeImage].image}
                alt={GIFT_SET_GALLERY[activeImage].alt}
                className="aspect-[0.86/1] h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => changeImage(-1)}
                aria-label="Previous gift set image"
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/85 dark:bg-neutral-800/85 text-black dark:text-white cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => changeImage(1)}
                aria-label="Next gift set image"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/85 dark:bg-neutral-800/85 text-black dark:text-white cursor-pointer"
              >
                <ArrowRight size={16} />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {GIFT_SET_GALLERY.map((gal, index) => (
                  <button
                    key={gal.alt}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`Show Gift Set image ${index + 1}`}
                    className={`h-1.5 w-1.5 rounded-full ${index === activeImage ? "bg-black dark:bg-white" : "bg-black/30 dark:bg-white/40"}`}
                  />
                ))}
              </div>
            </div>

            <div className="hidden grid-cols-4 gap-1 sm:gap-2 md:grid">
              <div className="col-span-4 aspect-[1.4/1] overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900 border border-transparent dark:border-neutral-800">
                <img
                  src={GIFT_SET_GALLERY[0].image}
                  alt={GIFT_SET_GALLERY[0].alt}
                  className="h-full w-full object-cover"
                />
              </div>
              {GIFT_SET_GALLERY.slice(1).map((gal) => (
                <div key={gal.alt} className="aspect-[0.86/1] overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900 border border-transparent dark:border-neutral-800">
                  <img src={gal.image} alt={gal.alt} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-center px-5 py-4 lg:px-0">
            <button
              type="button"
              onClick={onBack}
              className="mb-8 inline-flex w-fit items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer group"
            >
              <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1 duration-200" />
              <span>Back</span>
            </button>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/70 dark:text-neutral-400">{tagline}</p>
          <h1 className="mt-3 text-3xl font-bold uppercase tracking-[0.08em] sm:text-4xl text-black dark:text-white">{name}</h1>
          <p className="mt-2 text-lg font-semibold uppercase tracking-[0.08em] text-black/90 dark:text-neutral-200">{volume}</p>

          <div className="mt-5 flex flex-wrap gap-2 text-[10px] uppercase font-medium">
            <span className="bg-black/10 dark:bg-white/10 px-3 py-1 text-black dark:text-white">Parfum</span>
            <span className="bg-black/10 dark:bg-white/10 px-3 py-1 text-black dark:text-white">Unisex</span>
            <span className="bg-black/10 dark:bg-white/10 px-3 py-1 text-black dark:text-white">Gift set</span>
          </div>

          <p className="mt-5 max-w-md text-sm leading-relaxed text-black/65 dark:text-neutral-300">{description}</p>

          <div className="mt-6 flex items-center gap-5">
            <PriceTag
              price={price}
              originalPrice={originalPrice}
              size="xl"
            />
          </div>

          <p className="mt-3 text-xs text-black/60 dark:text-neutral-400">Incl. of all taxes</p>

          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onAddBundle}
              className="flex-1 bg-black dark:bg-white px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-white dark:text-black transition-colors hover:bg-neutral-800 dark:hover:bg-neutral-200 text-center cursor-pointer"
            >
              Add to cart
            </button>
            {onBuyNow && (
              <button
                type="button"
                onClick={onBuyNow}
                className="flex-1 border border-black dark:border-white bg-white dark:bg-neutral-900 px-5 py-4 text-xs font-bold uppercase tracking-[0.12em] text-black dark:text-white transition-colors hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black text-center cursor-pointer"
              >
                Buy now
              </button>
            )}
          </div>

          <p className="mt-8 text-xs text-black/65 dark:text-neutral-400">* Ships within 24-36 hours of ordering.</p>
        </div>
      </div>
    </div>
  </section>
);
}

export function GiftSetPage({
  product,
  onAddBundle,
  onBuyNow,
  onBack,
}: {
  product?: FragranceProduct;
  onAddBundle: () => void;
  onBuyNow?: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <GiftSetGallerySection product={product} onAddBundle={onAddBundle} onBuyNow={onBuyNow} onBack={onBack} />
      <Footer
        onOpenPrivacy={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "privacy" }))}
        onOpenTerms={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "terms" }))}
        onOpenRefund={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "refund" }))}
        onOpenCookies={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "cookies" }))}
        onOpenOrdersShipping={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "orders" }))}
      />
    </>
  );
}
