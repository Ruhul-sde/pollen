import React, { useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { FragranceProduct } from "@/core/types";

export interface FragrancesSectionProps {
  fragrances?: FragranceProduct[];
  onAddToCart: (fragrance: FragranceProduct) => void;
}

export function FragrancesSection({
  fragrances = [],
  onAddToCart,
}: FragrancesSectionProps) {
  const displayFragrances = fragrances.filter((f) => !f.isBundle);
  const [active, setActive] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartX = useRef(0);

  const go = (index: number) =>
    setActive((index + displayFragrances.length) % (displayFragrances.length || 1));

  const change = (index: number) => {
    go(index);
    setDragOffset(0);
  };

  if (displayFragrances.length === 0) return null;

  return (
    <section id="fragrances" className="bg-white border-t border-[#e8e8e8]">
      <div className="flex items-center justify-between border-b border-[#e8e8e8] px-6 py-8 md:px-16">
        <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-black/40">
          Fragrances
        </p>
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-semibold tracking-[0.3em] text-black/35">
            {String(active + 1).padStart(2, "0")} / {String(displayFragrances.length).padStart(2, "0")}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => change(active - 1)}
              aria-label="Previous fragrance"
              className="flex h-9 w-9 items-center justify-center border border-black/20 hover:border-black cursor-pointer transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => change(active + 1)}
              aria-label="Next fragrance"
              className="flex h-9 w-9 items-center justify-center border border-black/20 hover:border-black cursor-pointer transition-colors"
            >
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
      <div
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={(event) => {
          dragStartX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          const delta = dragStartX.current - event.clientX;
          dragStartX.current = 0;
          if (Math.abs(delta) > 50) change(active + (delta > 0 ? 1 : -1));
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(calc(-${active * 100}% + ${dragOffset}px))`,
          }}
        >
          {displayFragrances.map((fragrance, index) => (
            <article
              key={fragrance.id}
              className="grid w-full flex-shrink-0 grid-cols-1 md:grid-cols-2"
              style={{ minHeight: "clamp(480px, 72vh, 800px)" }}
            >
              <div className="relative min-h-[280px] overflow-hidden bg-[#f5f0eb] md:min-h-0">
                <img
                  src={fragrance.img}
                  alt={fragrance.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center gap-6 bg-white px-6 py-10 md:gap-8 md:px-16 md:py-16">
                <div>
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.4em] text-black/35">
                    {String(index + 1).padStart(2, "0")} / {String(displayFragrances.length).padStart(2, "0")}
                  </p>
                  <h2 className="mb-3 text-[clamp(2.2rem,5vw,4rem)] font-extrabold leading-tight tracking-tight">
                    {fragrance.name}
                  </h2>
                  {fragrance.tagline && (
                    <p className="mb-6 text-base italic text-black/50">{fragrance.tagline}</p>
                  )}
                  <p className="max-w-sm text-sm leading-relaxed text-black/65">
                    {fragrance.description}
                  </p>
                </div>
                {fragrance.notes && fragrance.notes.length > 0 && (
                  <div>
                    <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.4em] text-black/35">
                      Key Notes
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {fragrance.notes.map((note, index) => {
                        const noteText = typeof note === "string" ? note : (note as any)?.name || "";
                        if (!noteText) return null;
                        return (
                          <span
                            key={`${noteText}-${index}`}
                            className="border border-black px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em]"
                          >
                            {noteText}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onAddToCart(fragrance)}
                  className="inline-flex self-start items-center gap-3 bg-black px-8 py-4 text-xs font-bold uppercase tracking-[0.18em] text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Add to cart <ArrowRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
