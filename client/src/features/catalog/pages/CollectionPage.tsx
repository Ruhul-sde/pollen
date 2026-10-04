import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { FragranceProduct } from "@/core/types";
import { PriceTag } from "@/shared/components/PriceTag";
import { Footer } from "@/app/footer";
import giftSetHero from "@/app/Images/4a.PNG";
import collectionSecondImage from "@/app/Images/4b.PNG";

export interface CollectionPageProps {
  products?: FragranceProduct[];
  onAddToCart?: (item: { id: number; name: string; img: string; price: number }) => void;
}

export function CollectionPage({ products = [] }: { products?: FragranceProduct[] } = {}) {
  const [expanded, setExpanded] = useState(false);
  const items = (products || []).map((p) => ({
    id: p.id,
    name: p.name,
    image: p.img,
    price: p.price,
    originalPrice: p.originalPrice,
  }));

  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-200">
      <div className="w-full overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900">
        <img
          src={giftSetHero}
          alt="The Legacy Set"
          className="block aspect-[16/9] w-full object-cover object-center"
        />
      </div>
      <section className="px-6 py-14 md:px-16 md:py-20 text-black dark:text-white">
        <div className="mx-auto max-w-screen-xl">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-black/40 dark:text-neutral-400">
            The collection
          </p>
          <h1 className="mt-4 text-3xl font-bold uppercase tracking-[0.06em] md:text-5xl text-black dark:text-white">
            Every mood. Every side of you.
          </h1>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((product) => (
              <article key={product.name}>
                <div className="aspect-[4/5] overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900 border border-transparent dark:border-neutral-800">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h2 className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  {product.name}
                </h2>
                <div className="mt-2">
                  <PriceTag
                    price={product.price}
                    originalPrice={product.originalPrice}
                    size="sm"
                  />
                </div>
              </article>
            ))}
          </div>
          <div className="mt-16 overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900">
            <img
              src={collectionSecondImage}
              alt="Know Pollen fragrance collection"
              className="block aspect-[16/9] w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            className="mt-6 inline-flex items-center gap-3 border border-black dark:border-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] cursor-pointer hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
          >
            {expanded ? "Read less" : "Read more"}
          </button>
          {expanded && (
            <div className="mt-8 grid gap-8 border-t border-black/15 dark:border-neutral-800 pt-8 text-sm leading-relaxed text-black/65 dark:text-neutral-300 md:grid-cols-2">
              <div>
                <h2 className="font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  Why buy Pollen
                </h2>
                <p className="mt-3">
                  Thoughtful fragrances made to last, with expressive scents for every version of
                  you.
                </p>
              </div>
              <div>
                <h2 className="font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  Collection includes
                </h2>
                <p className="mt-3">Power of You, Lost Cherry, Fresh Orchid, and The Legacy Set.</p>
              </div>
              <div>
                <h2 className="font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  Made to be remembered
                </h2>
                <p className="mt-3">
                  Distinctive compositions designed to leave a confident, personal impression.
                </p>
              </div>
              <div>
                <h2 className="font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  A scent for every day
                </h2>
                <p className="mt-3">
                  Choose a fragrance for your mood, your moment, and your own story.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer
        onOpenPrivacy={() =>
          window.dispatchEvent(new CustomEvent("open-policy", { detail: "privacy" }))
        }
        onOpenTerms={() =>
          window.dispatchEvent(new CustomEvent("open-policy", { detail: "terms" }))
        }
        onOpenRefund={() =>
          window.dispatchEvent(new CustomEvent("open-policy", { detail: "refund" }))
        }
        onOpenCookies={() =>
          window.dispatchEvent(new CustomEvent("open-policy", { detail: "cookies" }))
        }
      />
    </div>
  );
}

export function CollectionPageUpdated({
  products = [],
  onAddToCart,
}: {
  products?: FragranceProduct[];
  onAddToCart: (item: { id: number; name: string; img: string; price: number }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const items = (products || []).map((p) => ({
    id: p.id,
    name: p.name,
    image: p.img,
    price: p.price,
    originalPrice: p.originalPrice,
  }));

  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-200">
      <div className="w-full overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900">
        <img
          src={giftSetHero}
          alt="The Legacy Set"
          className="block aspect-[16/9] w-full object-cover object-center"
        />
      </div>
      <section className="px-6 py-14 md:px-16 md:py-20 text-black dark:text-white">
        <div className="mx-auto max-w-screen-xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-black/40 dark:text-neutral-400">
            The collection
          </p>
          <h1 className="mt-4 text-3xl font-bold uppercase tracking-[0.06em] md:text-5xl text-black dark:text-white">
            Every mood. Every side of you.
          </h1>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((product) => (
              <article key={product.name} className="mx-auto w-full max-w-xs">
                <div className="aspect-[4/5] overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900 border border-transparent dark:border-neutral-800">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h2 className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  {product.name}
                </h2>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-black/50 dark:text-neutral-400">
                  50 ML per bottle
                </p>
                <div className="mt-3 flex items-center justify-center gap-3">
                  <PriceTag
                    price={product.price}
                    originalPrice={product.originalPrice}
                    size="sm"
                    showBadge={false}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart({
                        id: product.id,
                        name: product.name,
                        img: product.image,
                        price: product.price,
                      });
                      toast.success(`${product.name} added to cart!`, {
                        action: {
                          label: "View Cart",
                          onClick: () => {
                            window.dispatchEvent(new CustomEvent("open-cart-drawer"));
                          },
                        },
                      });
                    }}
                    className="bg-black dark:bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    Add to cart
                  </button>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-16 overflow-hidden bg-[#f3f0ed] dark:bg-neutral-900">
            <img
              src={collectionSecondImage}
              alt="Know Pollen fragrance collection"
              className="block aspect-[16/9] w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            aria-expanded={expanded}
            className="mt-6 inline-flex items-center gap-3 border border-black dark:border-white px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] cursor-pointer hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors"
          >
            {expanded ? "Read less" : "Read more"}
          </button>
          {expanded && (
            <div className="mt-8 grid gap-8 border-t border-black/15 dark:border-neutral-800 pt-8 text-left text-sm leading-relaxed text-black/65 dark:text-neutral-300 md:grid-cols-2">
              <div>
                <h2 className="font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  Why buy Pollen
                </h2>
                <p className="mt-3">
                  Thoughtful fragrances made to last, with expressive scents for every version of
                  you.
                </p>
              </div>
              <div>
                <h2 className="font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  Collection includes
                </h2>
                <p className="mt-3">Power of You, Lost Cherry, Fresh Orchid, and The Legacy Set.</p>
              </div>
              <div>
                <h2 className="font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  Made to be remembered
                </h2>
                <p className="mt-3">
                  Distinctive compositions designed to leave a confident, personal impression.
                </p>
              </div>
              <div>
                <h2 className="font-semibold uppercase tracking-[0.08em] text-black dark:text-white">
                  A scent for every day
                </h2>
                <p className="mt-3">
                  Choose a fragrance for your mood, your moment, and your own story.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer
        onOpenPrivacy={() =>
          window.dispatchEvent(new CustomEvent("open-policy", { detail: "privacy" }))
        }
        onOpenTerms={() =>
          window.dispatchEvent(new CustomEvent("open-policy", { detail: "terms" }))
        }
        onOpenRefund={() =>
          window.dispatchEvent(new CustomEvent("open-policy", { detail: "refund" }))
        }
        onOpenCookies={() =>
          window.dispatchEvent(new CustomEvent("open-policy", { detail: "cookies" }))
        }
      />
    </div>
  );
}

export function CollectionPageWithBack({
  products,
  onAddToCart,
  onBack,
}: {
  products?: FragranceProduct[];
  onAddToCart: (item: { id: number; name: string; img: string; price: number }) => void;
  onBack?: () => void;
}) {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a0a0a] text-black dark:text-white min-h-screen transition-colors duration-200">
      <div className="mx-auto max-w-screen-xl px-4 pb-2 pt-6 text-left sm:px-6 md:px-16">
        <button
          type="button"
          onClick={handleBack}
          className="group inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 -ml-2.5 text-xs font-bold uppercase tracking-[0.18em] text-black/60 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer transition-all"
        >
          <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 duration-200" />
          <span>Back</span>
        </button>
      </div>
      <CollectionPageUpdated products={products} onAddToCart={onAddToCart} />
    </div>
  );
}
