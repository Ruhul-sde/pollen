import React from "react";
import carouselOne from "@/app/Images/1a bg.png";
import carouselTwo from "@/app/Images/2a bg.png";
import carouselThree from "@/app/Images/3a bg.png";
import { FragranceProduct } from "@/core/types";

export const PERFUME_ROUTES: Record<string, string> = {
  "Power of You": "/power-of-you",
  "Lost Cherry": "/lost-cherry",
  "Fresh Orchid": "/fresh-orchid",
};

export const PERFUME_VARIANT_IMAGES: Record<string, string> = {
  "Power of You": carouselTwo,
  "Lost Cherry": carouselThree,
  "Fresh Orchid": carouselOne,
};

export interface PerfumeVariant {
  name: string;
  route: string;
  image: string;
  volume?: string;
}

export const PERFUME_VARIANTS: PerfumeVariant[] = [
  { name: "Power of You", route: "/power-of-you", image: carouselTwo, volume: "50ML" },
  { name: "Lost Cherry", route: "/lost-cherry", image: carouselThree, volume: "50ML" },
  { name: "Fresh Orchid", route: "/fresh-orchid", image: carouselOne, volume: "50ML" },
];

export interface PerfumeVariantsProps {
  currentName: string;
  fragrances?: FragranceProduct[];
  onSelectVariant?: (route: string) => void;
}

export function PerfumeVariants({
  currentName,
  fragrances = [],
  onSelectVariant,
}: PerfumeVariantsProps) {
  const variants = (fragrances || []).filter(
    (fragrance) => !fragrance.isBundle && fragrance.name !== currentName
  );

  if (variants.length === 0) return null;

  return (
    <section className="perfume-variant-picker bg-white dark:bg-[#0a0a0a] text-black dark:text-white px-5 pb-8 pt-2 md:px-0 md:pb-2 md:pt-0 transition-colors">
      <div className="max-w-md">
        <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-black dark:text-white">Choose variants</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {variants.map((variant) => {
            const route = variant.slug
              ? `/${variant.slug}`
              : PERFUME_ROUTES[variant.name] || "/collection";
            const image = PERFUME_VARIANT_IMAGES[variant.name] || variant.img;
            return (
              <a
                key={variant.id}
                href={route}
                onClick={(event) => {
                  if (!onSelectVariant) return;
                  event.preventDefault();
                  onSelectVariant(route);
                }}
                className="group text-center"
              >
                <div className="aspect-[0.86/1] overflow-hidden border border-black/20 dark:border-neutral-700 bg-white dark:bg-neutral-900">
                  <img
                    src={image}
                    alt={variant.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.06em] text-black dark:text-white">
                  {variant.name}
                </p>
                <p className="mt-1 text-[9px] uppercase tracking-[0.1em] text-black/55 dark:text-neutral-400">
                  ({variant.volume || "50ML"})
                </p>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
