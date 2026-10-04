import React from "react";
import storyOne from "@/app/Images/1c.jpg";
import storyTwo from "@/app/Images/2e.jpg";
import storyThree from "@/app/Images/3a.PNG";
import { FragranceProduct } from "@/core/types";

interface IntroStoriesProps {
  fragrances?: FragranceProduct[];
}

export function IntroStories({ fragrances = [] }: IntroStoriesProps) {
  const routes: Record<string, string> = {
    "lost-cherry": "/lost-cherry",
    "power-of-you": "/power-of-you",
    "fresh-orchid": "/fresh-orchid",
    "Lost Cherry": "/lost-cherry",
    "Power of You": "/power-of-you",
    "Fresh Orchid": "/fresh-orchid",
  };

  const storyImages: Record<string, string> = {
    "power-of-you": storyTwo,
    "lost-cherry": storyThree,
    "fresh-orchid": storyOne,
    "Power of You": storyTwo,
    "Lost Cherry": storyThree,
    "Fresh Orchid": storyOne,
  };

  const CANONICAL_ORDER = ["power-of-you", "lost-cherry", "fresh-orchid"];
  const defaultImages = [storyTwo, storyThree, storyOne];
  const perfumes = (fragrances || [])
    .filter((f) => !f.isBundle)
    .sort((a, b) => {
      const aSlug = (a.slug || a.name || "").toLowerCase().replace(/\s+/g, "-");
      const bSlug = (b.slug || b.name || "").toLowerCase().replace(/\s+/g, "-");
      const aIdx = CANONICAL_ORDER.findIndex((k) => aSlug.includes(k) || k.includes(aSlug));
      const bIdx = CANONICAL_ORDER.findIndex((k) => bSlug.includes(k) || k.includes(bSlug));
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

  if (perfumes.length === 0) return null;

  return (
    <div>
      {perfumes.map((panel, index) => {
        const image =
          storyImages[panel.slug || ""] ||
          storyImages[panel.name] ||
          defaultImages[index % defaultImages.length];
        const route =
          routes[panel.slug || ""] || routes[panel.name] || `/${panel.slug || "collection"}`;

        return (
          <section
            key={panel.slug || panel.name || index}
            className="relative h-[clamp(600px,90vh,900px)] overflow-hidden bg-black md:h-[clamp(620px,90vh,980px)]"
          >
            <img
              src={image}
              alt={panel.name}
              className="absolute inset-0 h-full w-full object-cover object-center md:object-contain md:object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/5" />
            <div className="absolute inset-x-6 bottom-10 z-10 mx-auto max-w-xl text-center text-white md:bottom-14">
              <h2 className="text-xl font-medium uppercase tracking-[0.08em] md:text-2xl">
                {panel.name}
              </h2>
              <p className="mt-2 text-xs font-normal uppercase tracking-[0.14em] md:text-sm">
                {panel.tagline}
              </p>
              <a
                href={route}
                className="mt-5 inline-block text-xs font-medium uppercase tracking-[0.12em] text-white underline underline-offset-8 transition-opacity hover:opacity-70"
              >
                Explore Parfum
              </a>
            </div>
          </section>
        );
      })}
    </div>
  );
}
