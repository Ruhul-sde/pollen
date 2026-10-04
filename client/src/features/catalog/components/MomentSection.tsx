import React from "react";
import momentImage from "@/app/Images/4a.PNG";
import { useTenantConfig } from "@/config/tenantContext";
import { DEFAULT_ABOUT_STORY } from "@/config/tenantConfig";

export function MomentSection() {
  const { branding, config } = useTenantConfig();
  const isDark = config.theme?.mode === "dark";

  const aboutTitle = branding.aboutTitle || "About POLLEN";
  const aboutStory = branding.aboutStory || DEFAULT_ABOUT_STORY;
  const storyLines = aboutStory.split("\n").filter((l) => l.trim().length > 0);

  return (
    <section
      id="about"
      className="relative min-h-[580px] md:min-h-[660px] flex items-center justify-center overflow-hidden bg-black text-white px-4 sm:px-6 md:px-12 py-16 sm:py-24 md:py-32 scroll-mt-20"
    >
      {/* Background Image with Ambient Overlay */}
      <img
        src={momentImage}
        alt={aboutTitle}
        className="absolute inset-0 h-full w-full object-cover opacity-25 md:opacity-30 scale-105 transition-transform duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/90" />

      {/* Dynamic Content Container */}
      <div className="relative z-10 max-w-2xl mx-auto text-center space-y-6 sm:space-y-8">
        <div className="space-y-2">
          <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-[0.35em] text-amber-400">
            Brand Philosophy
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold uppercase tracking-[0.14em] text-white">
            {aboutTitle}
          </h2>
          <div className="h-0.5 w-12 sm:w-16 bg-amber-400/80 mx-auto mt-3" />
        </div>

        {/* Dynamic Story Lines */}
        <div className="space-y-3 sm:space-y-4 pt-2">
          {storyLines.map((line, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === storyLines.length - 1;
            return (
              <p
                key={idx}
                className={`text-xs sm:text-sm md:text-base leading-relaxed tracking-wide ${
                  isFirst
                    ? "font-semibold text-white/95 text-sm sm:text-base md:text-lg"
                    : isLast
                    ? "font-medium text-amber-300/90 text-sm sm:text-base italic pt-1"
                    : "font-light text-neutral-300"
                }`}
              >
                {line}
              </p>
            );
          })}
        </div>

        {/* CTA */}
        <div className="pt-2 sm:pt-4">
          <a
            href="#fragrances"
            className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 backdrop-blur-md px-6 sm:px-8 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black transition-all duration-300 active:scale-95 shadow-lg cursor-pointer"
          >
            Explore Fragrances
          </a>
        </div>
      </div>
    </section>
  );
}
