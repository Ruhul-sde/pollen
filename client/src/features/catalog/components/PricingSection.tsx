import React, { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import storyOne from "@/app/Images/1c.jpg";
import storyTwo from "@/app/Images/2e.jpg";
import storyThree from "@/app/Images/3a.PNG";
import { FragranceProduct } from "@/core/types";
import { PriceTag } from "@/shared/components/PriceTag";
import { QuantityControl } from "@/shared/components/QuantityControl";
import { DEFAULT_FRAGRANCES } from "@/app/data";

interface PricingSectionProps {
  fragrances?: FragranceProduct[];
  onAddToCart: (fragrance: FragranceProduct) => void;
  onBuyNow?: (id: number) => void;
  cartItems: { id: number; quantity: number }[];
  onChangeQuantity: (id: number, change: number) => void;
}

export function PricingSection({
  fragrances = [],
  onAddToCart,
  onBuyNow,
  cartItems,
  onChangeQuantity,
}: PricingSectionProps) {
  const [justAddedId, setJustAddedId] = useState<number | null>(null);
  const CANONICAL_ORDER = ["power-of-you", "lost-cherry", "fresh-orchid"];

  const CARD_IMAGE_MAP: Record<string, string> = {
    "power-of-you": storyTwo,
    "lost-cherry": storyThree,
    "fresh-orchid": storyOne,
    "Power of You": storyTwo,
    "Lost Cherry": storyThree,
    "Fresh Orchid": storyOne,
    "1": storyTwo,
    "2": storyThree,
    "3": storyOne,
  };

  const getCardImage = (fragrance: FragranceProduct, idx: number) => {
    if (fragrance.slug && CARD_IMAGE_MAP[fragrance.slug]) return CARD_IMAGE_MAP[fragrance.slug];
    if (fragrance.name && CARD_IMAGE_MAP[fragrance.name]) return CARD_IMAGE_MAP[fragrance.name];
    const idKey = String(fragrance.productId ?? fragrance.id ?? "");
    if (idKey && CARD_IMAGE_MAP[idKey]) return CARD_IMAGE_MAP[idKey];
    const lower = (fragrance.slug || fragrance.name || "").toLowerCase();
    if (lower.includes("power")) return storyTwo;
    if (lower.includes("cherry")) return storyThree;
    if (lower.includes("orchid")) return storyOne;
    return fragrance.img || [storyTwo, storyThree, storyOne][idx % 3];
  };

  const sourceList = (fragrances && fragrances.length > 0) ? fragrances : DEFAULT_FRAGRANCES;
  const perfumes = sourceList
    .filter((f) => !f.isBundle)
    .sort((a, b) => {
      const aKey = (a.slug || a.name || "").toLowerCase().replace(/\s+/g, "-");
      const bKey = (b.slug || b.name || "").toLowerCase().replace(/\s+/g, "-");
      const aIdx = CANONICAL_ORDER.findIndex((k) => aKey.includes(k) || k.includes(aKey));
      const bIdx = CANONICAL_ORDER.findIndex((k) => bKey.includes(k) || k.includes(bKey));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return (a.productId ?? a.id ?? 0) - (b.productId ?? b.id ?? 0);
    });

  const pricingCards = perfumes.map((f, idx) => ({
    image: getCardImage(f, idx),
    fragrance: f,
  }));

  if (pricingCards.length === 0) return null;

  return (
    <section
      id="shop-collection"
      className="bg-black px-4 py-14 text-white sm:px-6 md:px-10 md:py-20 scroll-mt-20 sm:scroll-mt-24"
    >
      <div className="mx-auto max-w-screen-2xl">
        <h2 className="mb-10 text-center text-2xl font-medium uppercase tracking-[0.08em] sm:text-3xl md:mb-14 md:text-4xl">
          Shop the collection
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-5 lg:gap-8">
          {pricingCards.map(({ image, fragrance }) => {
            const quantity = cartItems.find((item) => item.id === fragrance.id)?.quantity ?? 0;
            return (
              <article
                key={fragrance.id}
                className="mx-auto flex w-full max-w-sm flex-col text-center"
              >
                <div className="aspect-[4/5] overflow-hidden bg-white dark:bg-neutral-900 border border-transparent dark:border-neutral-800">
                  <img
                    src={image}
                    alt={fragrance.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col items-center px-2 pt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.08em] sm:text-base">
                    {fragrance.name}
                  </h3>

                  <div className="mt-3 flex items-center justify-center">
                    <PriceTag
                      price={fragrance.price}
                      originalPrice={fragrance.originalPrice}
                      size="sm"
                      theme="dark"
                    />
                  </div>

                  {quantity === 0 ? (
                    <button
                      type="button"
                      onClick={() => {
                        onAddToCart(fragrance);
                        setJustAddedId(fragrance.id);
                        toast.success(`${fragrance.name} added to cart!`, {
                          action: {
                            label: "View Cart",
                            onClick: () => {
                              window.dispatchEvent(new CustomEvent("open-cart-drawer"));
                            },
                          },
                        });
                        setTimeout(() => {
                          setJustAddedId((curr) => (curr === fragrance.id ? null : curr));
                        }, 1200);
                      }}
                      className={`mt-6 inline-flex items-center justify-center gap-1.5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-all cursor-pointer ${
                        justAddedId === fragrance.id
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white text-black hover:bg-neutral-200 active:scale-95"
                      }`}
                    >
                      {justAddedId === fragrance.id ? (
                        <>
                          <Check size={14} className="stroke-[2.5]" />
                          <span>Added to cart</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} />
                          <span>Add to cart</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <QuantityControl
                        quantity={quantity}
                        onIncrease={() => {
                          onAddToCart(fragrance);
                          toast.success(`Updated ${fragrance.name} quantity (${quantity + 1}) in cart!`, {
                            action: {
                              label: "View Cart",
                              onClick: () => {
                                window.dispatchEvent(new CustomEvent("open-cart-drawer"));
                              },
                            },
                          });
                        }}
                        onDecrease={() => onChangeQuantity(fragrance.id, -1)}
                        variant="light"
                        size="md"
                      />
                      {onBuyNow && (
                        <button
                          type="button"
                          onClick={() => onBuyNow(fragrance.id)}
                          className="bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-black transition-colors hover:bg-neutral-200 cursor-pointer active:scale-95"
                        >
                          Buy now →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
