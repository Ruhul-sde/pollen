import React from "react";
import { ArrowRight } from "lucide-react";
import type { FragranceProduct } from "@/core/types";
import { useTenantConfig } from "@/config/tenantContext";

export interface BundleSectionProps {
  fragrances?: FragranceProduct[];
  onAddBundle: () => void;
}

export function BundleSection({
  fragrances = [],
  onAddBundle,
}: BundleSectionProps) {
  const { branding } = useTenantConfig();
  const companyName = branding?.companyName || "Know Pollen";
  const perfumes = (fragrances || []).filter((f) => !f.isBundle);

  return (
    <section id="bundle" className="bg-black px-6 py-24 text-white md:px-16 md:py-32">
      <div className="mx-auto grid max-w-screen-xl items-center gap-16 md:grid-cols-2">
        <div>
          <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.45em] text-white/40">
            Get Your Bundle
          </p>
          <h2 className="mb-8 text-[clamp(2.5rem,6vw,5rem)] font-extrabold leading-[0.92] tracking-tight">
            All three.
            <br />
            <em className="font-light italic text-white/50">One story.</em>
          </h2>
          <p className="mb-10 max-w-sm text-sm leading-relaxed text-white/55">
            {perfumes.length > 0
              ? perfumes.map((p) => p.name).join(" + ")
              : "Power of You + Lost Cherry + Fresh Orchid"}
            . The complete {companyName} collection. Three moods, one identity. Bundle and save.
          </p>
          <button
            type="button"
            onClick={onAddBundle}
            className="inline-flex items-center gap-3 bg-white px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-black hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Get the Bundle <ArrowRight size={14} />
          </button>
        </div>
        <div className="flex justify-center gap-4 md:justify-end">
          {perfumes.map((fragrance) => (
            <div
              key={fragrance.id}
              className="relative max-w-[120px] flex-1 overflow-hidden aspect-[3/5]"
            >
              <img
                src={fragrance.img}
                alt={fragrance.name}
                className="h-full w-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-[8px] font-bold uppercase tracking-[0.15em]">
                {fragrance.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
