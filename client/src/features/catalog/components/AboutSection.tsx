import React from "react";
import { useTenantConfig } from "@/config/tenantContext";

export function AboutSection() {
  const { branding } = useTenantConfig();
  const companyName = branding?.companyName || "Know Pollen";

  return (
    <section id="about" className="border-t border-[#e8e8e8] bg-white px-6 py-24 md:px-16 md:py-32">
      <div className="mx-auto grid max-w-screen-xl items-start gap-16 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.45em] text-black/35">
            Company
          </p>
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-tight tracking-tight whitespace-pre-line">
            {companyName.split(" ").join("\n")}
          </h2>
        </div>
        <div className="space-y-6">
          <p className="max-w-xl text-base leading-relaxed text-black/70">
            {companyName} is a fragrance house rooted in the belief that scent is identity. We craft
            each fragrance to be worn, remembered, and claimed — not just smelled.
          </p>
          <p className="max-w-xl text-sm leading-relaxed text-black/50">
            Every bottle tells a different story: Power of You is the one you wear to take the room.
            Lost Cherry is the one you wear to take someone's attention. Fresh Orchid is the one you
            wear to take a breath.
          </p>
          <div className="flex flex-wrap gap-12 pt-4">
            {[
              ["3", "Fragrances"],
              ["100%", "Cruelty Free"],
              ["India", "Crafted In"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-3xl font-extrabold tracking-tight">{value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-black/35">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
