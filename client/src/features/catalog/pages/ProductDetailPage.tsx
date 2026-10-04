import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FragranceProduct } from "@/core/types";
import { Footer } from "@/app/footer";
import { PriceTag } from "@/shared/components/PriceTag";
import { DetailPurchaseControl } from "../components/DetailPurchaseControl";
import { DetailSkeleton } from "@/shared/components/LoadingSkeleton";

interface ProductDetailPageProps {
  product?: FragranceProduct;
  onAddToCart: () => void;
  onBuyNow?: () => void;
  onBack: () => void;
  quantity: number;
  onChangeQuantity: (change: number) => void;
  galleryImages: Array<{ image: string; alt: string }>;
  recommendations?: Array<{ image: string; name: string; href: string }>;
}

export function ProductDetailPage({
  product,
  onAddToCart,
  onBuyNow,
  onBack,
  quantity,
  onChangeQuantity,
  galleryImages,
  recommendations = [],
}: ProductDetailPageProps) {
  const [activeImage, setActiveImage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  if (!product) {
    return <DetailSkeleton />;
  }

  const gallery = galleryImages.length > 0
    ? galleryImages
    : [{ image: product.img, alt: product.name }];

  const changeImage = (direction: number) =>
    setActiveImage((index) => (index + direction + gallery.length) % gallery.length);

  return (
    <div className="[&>section]:!min-h-0 [&>section]:!pb-0 bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-200">
      <section className="min-h-screen bg-white dark:bg-[#0a0a0a] px-3 pb-16 pt-4 sm:px-6 md:px-8 md:pt-8 text-black dark:text-white">
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
            {/* Gallery Area */}
            <div className="relative">
              {/* Mobile Carousel */}
              <div
                className="relative aspect-[0.86/1] overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900 md:hidden"
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
                  src={gallery[activeImage].image}
                  alt={gallery[activeImage].alt}
                  className="aspect-[0.86/1] h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => changeImage(-1)}
                  aria-label={`Previous ${product.name} image`}
                  className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/85 dark:bg-neutral-800/85 text-black dark:text-white transition-colors hover:bg-white dark:hover:bg-neutral-700 cursor-pointer"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => changeImage(1)}
                  aria-label={`Next ${product.name} image`}
                  className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center bg-white/85 dark:bg-neutral-800/85 text-black dark:text-white transition-colors hover:bg-white dark:hover:bg-neutral-700 cursor-pointer"
                >
                  <ArrowRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {gallery.map((gal, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      aria-label={`Show ${product.name} image ${index + 1}`}
                      className={`h-1.5 w-1.5 rounded-full ${index === activeImage ? "bg-black dark:bg-white" : "bg-black/30 dark:bg-white/40"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Desktop Mosaic Gallery */}
              <div className="hidden grid-cols-4 gap-1 sm:gap-2 md:grid">
                <div className="col-span-4 aspect-[1.4/1] overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900 border border-transparent dark:border-neutral-800">
                  <img
                    src={gallery[0].image}
                    alt={gallery[0].alt}
                    className="h-full w-full object-cover"
                  />
                </div>
                {gallery.slice(1).map((gal, idx) => (
                  <div key={idx} className="aspect-[0.86/1] overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900 border border-transparent dark:border-neutral-800">
                    <img src={gal.image} alt={gal.alt} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Meta & Purchase */}
            <div className="flex flex-col justify-center px-5 py-4 lg:px-0">
              <button
                type="button"
                onClick={onBack}
                className="mb-8 inline-flex w-fit items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer group"
              >
                <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-1 duration-200" />
                <span>Back</span>
              </button>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/70 dark:text-neutral-400">
              {product.tagline || "Bold · Fierce · Unapologetic"}
            </p>
            <h1 className="mt-3 text-3xl font-bold uppercase tracking-[0.08em] sm:text-4xl text-black dark:text-white">
              {product.name}
            </h1>
            <p className="mt-2 text-lg font-semibold uppercase tracking-[0.08em] text-black/90 dark:text-neutral-200">
              {product.volume || "50 ML"}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] uppercase font-medium">
              <span className="bg-black/10 dark:bg-white/10 px-3 py-1 text-black dark:text-white">{product.type || "Parfum"}</span>
              <span className="bg-black/10 dark:bg-white/10 px-3 py-1 text-black dark:text-white">{product.gender || "Unisex"}</span>
            </div>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-black/65 dark:text-neutral-300">
              {product.description}
            </p>

            {product.notes && product.notes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {product.notes.map((note, index) => {
                  const noteText = typeof note === "string" ? note : (note as any)?.name || "";
                  if (!noteText) return null;
                  return (
                    <span
                      key={`${noteText}-${index}`}
                      className="border border-black/20 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-black/70 dark:text-neutral-300"
                    >
                      {noteText}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Standardized Price & Discount Tag */}
            <div className="mt-6 flex items-center gap-5">
              <PriceTag
                price={product.price}
                originalPrice={product.originalPrice}
                size="xl"
              />
              <DetailPurchaseControl
                quantity={quantity}
                onAddToCart={onAddToCart}
                onBuyNow={onBuyNow}
                onChangeQuantity={onChangeQuantity}
              />
            </div>
          </div>
        </div>
      </div>
    </section>

      {/* Brand Story Section */}
      <section className="bg-white dark:bg-[#0a0a0a] px-6 py-14 md:px-16 md:py-20 text-black dark:text-white">
        <div className="mx-auto max-w-screen-xl border-t border-black/15 dark:border-neutral-800 pt-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-black/40 dark:text-neutral-400">
            {product.name}
          </p>
          <h2 className="mt-4 max-w-2xl text-2xl font-bold uppercase tracking-[0.06em] md:text-4xl text-black dark:text-white">
            {product.storyTitle || "Crafted to be remembered."}
          </h2>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-black/65 dark:text-neutral-300">
            {product.storyDescription ||
              "Formulated with rare botanicals and artisanal fragrance compounds designed to evoke an unforgettable presence."}
          </p>
        </div>
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section className="bg-white dark:bg-[#0a0a0a] px-6 py-14 md:px-16 md:py-20 text-black dark:text-white">
          <div className="mx-auto max-w-screen-xl">
            <h2 className="text-xl font-semibold uppercase tracking-[0.08em] md:text-2xl text-black dark:text-white">
              You may also like
            </h2>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              {recommendations.map((item) => (
                <article key={item.name} className="text-center">
                  <div className="aspect-[4/5] overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900 border border-transparent dark:border-neutral-800">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                    {item.name}
                  </h3>
                  <a
                    href={item.href}
                    className="mt-3 inline-block text-[10px] font-semibold uppercase tracking-[0.15em] underline underline-offset-4 text-black dark:text-neutral-300 hover:opacity-75"
                  >
                    Shop now
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer
        onOpenPrivacy={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "privacy" }))}
        onOpenTerms={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "terms" }))}
        onOpenRefund={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "refund" }))}
        onOpenCookies={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "cookies" }))}
        onOpenOrdersShipping={() => window.dispatchEvent(new CustomEvent("open-policy", { detail: "orders" }))}
      />
    </div>
  );
}
