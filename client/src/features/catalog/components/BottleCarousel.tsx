import React, { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, ShoppingBag, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import carouselOne from "@/app/Images/1a bg.png";
import carouselTwo from "@/app/Images/2a bg.png";
import carouselThree from "@/app/Images/3a bg.png";
import { FragranceProduct } from "@/core/types";
import { PriceTag } from "@/shared/components/PriceTag";
import { DEFAULT_FRAGRANCES } from "@/app/data";

interface BottleCarouselProps {
  fragrances?: FragranceProduct[];
  onAddToCart: (fragrance: FragranceProduct) => void;
  onBuyNow?: (id: number) => void;
}

const CAROUSEL_IMAGE_MAP: Record<string, string> = {
  "power-of-you": carouselTwo,
  "lost-cherry": carouselThree,
  "fresh-orchid": carouselOne,
  "Power of You": carouselTwo,
  "Lost Cherry": carouselThree,
  "Fresh Orchid": carouselOne,
  "1": carouselTwo,
  "2": carouselThree,
  "3": carouselOne,
};

function getCarouselImage(fragrance: FragranceProduct, fallbackIndex: number): string {
  if (fragrance.slug && CAROUSEL_IMAGE_MAP[fragrance.slug]) {
    return CAROUSEL_IMAGE_MAP[fragrance.slug];
  }
  if (fragrance.name && CAROUSEL_IMAGE_MAP[fragrance.name]) {
    return CAROUSEL_IMAGE_MAP[fragrance.name];
  }
  const idKey = String(fragrance.productId ?? fragrance.id ?? "");
  if (idKey && CAROUSEL_IMAGE_MAP[idKey]) {
    return CAROUSEL_IMAGE_MAP[idKey];
  }
  const lower = (fragrance.slug || fragrance.name || "").toLowerCase();
  if (lower.includes("power")) return carouselTwo;
  if (lower.includes("cherry")) return carouselThree;
  if (lower.includes("orchid")) return carouselOne;

  const fallback = [carouselTwo, carouselThree, carouselOne];
  return fallback[fallbackIndex % fallback.length];
}

const CANONICAL_ORDER = ["power-of-you", "lost-cherry", "fresh-orchid"];

export function BottleCarousel({ fragrances = [], onAddToCart, onBuyNow }: BottleCarouselProps) {
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

  const carouselSlides = perfumes.map((f, idx) => ({
    image: getCarouselImage(f, idx),
    fragrance: f,
  }));

  const [active, setActive] = useState(0);
  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    isMobile: typeof window !== "undefined" ? window.innerWidth < 640 : false,
    isTablet: typeof window !== "undefined" ? window.innerWidth >= 640 && window.innerWidth < 1024 : false,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setJustAdded(false);
  }, [active]);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setDimensions({
        width: w,
        isMobile: w < 640,
        isTablet: w >= 640 && w < 1024,
      });
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { isMobile, isTablet, width } = dimensions;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (carouselSlides.length === 0) return;
      if (e.key === "ArrowLeft") {
        setActive((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
      } else if (e.key === "ArrowRight") {
        setActive((prev) => (prev + 1) % carouselSlides.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [carouselSlides.length]);

  if (carouselSlides.length === 0) return null;

  const move = (direction: number) =>
    setActive((index) => (index + direction + carouselSlides.length) % carouselSlides.length);

  const getCircularOffset = (index: number, total: number) => {
    let diff = (index - active) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  };

  const get3DTransform = (diff: number) => {
    // Dynamic X offset computed proportionally to container width for all devices
    let xOffset = 320;
    if (isMobile) {
      xOffset = Math.min(120, Math.max(88, width * 0.28));
    } else if (isTablet) {
      xOffset = Math.min(220, Math.max(150, width * 0.26));
    } else {
      xOffset = Math.min(320, Math.max(220, width * 0.24));
    }

    if (diff === 0) {
      // CENTER / FRONT ITEM: prominently ZOOMED, comfortably contained, lifted slightly for ample text clearance
      return {
        x: 0,
        y: isMobile ? -4 : -8,
        z: isMobile ? 55 : 85,
        rotateY: 0,
        rotateZ: 0,
        scale: isMobile ? 1.14 : 1.22,
        opacity: 1,
        zIndex: 30,
        filter: "drop-shadow(0 18px 26px rgba(0,0,0,0.16))",
      };
    }

    if (diff === -1) {
      // LEFT SIDE ITEM: clearly visible, scaled down, angled inwards into 3D circle
      return {
        x: -xOffset,
        y: isMobile ? 6 : 10,
        z: isMobile ? -45 : -80,
        rotateY: isMobile ? 18 : 24,
        rotateZ: -1.5,
        scale: isMobile ? 0.74 : 0.78,
        opacity: 0.85,
        zIndex: 15,
        filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.10))",
      };
    }

    if (diff === 1) {
      // RIGHT SIDE ITEM: clearly visible, scaled down, angled inwards into 3D circle
      return {
        x: xOffset,
        y: isMobile ? 6 : 10,
        z: isMobile ? -45 : -80,
        rotateY: isMobile ? -18 : -24,
        rotateZ: 1.5,
        scale: isMobile ? 0.74 : 0.78,
        opacity: 0.85,
        zIndex: 15,
        filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.10))",
      };
    }

    // Behind / back of circle for catalogs with > 3 items
    return {
      x: diff > 0 ? xOffset * 1.5 : -xOffset * 1.5,
      y: 12,
      z: -220,
      rotateY: diff > 0 ? -55 : 55,
      rotateZ: 0,
      scale: 0.5,
      opacity: 0,
      zIndex: 5,
      filter: "blur(4px)",
    };
  };

  const handleDragEnd = (_e: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    setIsDragging(false);
    const threshold = 35;
    if (info.offset.x < -threshold || info.velocity.x < -200) {
      move(1);
    } else if (info.offset.x > threshold || info.velocity.x > 200) {
      move(-1);
    }
  };

  const selected = carouselSlides[active];

  const handleAddToCart = () => {
    if (justAdded || !selected) return;
    onAddToCart(selected.fragrance);
    setJustAdded(true);
    toast.success(`${selected.fragrance.name} added to cart!`, {
      action: {
        label: "View Cart",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("open-cart-drawer"));
        },
      },
    });
    setTimeout(() => {
      move(1);
    }, 800);
  };

  return (
    <section id="fragrances" className="relative bg-white dark:bg-[#0a0a0a] px-2 sm:px-6 md:px-10 py-8 sm:py-12 md:py-16 transition-colors duration-300 overflow-hidden">
      <div className="mx-auto flex max-w-screen-xl flex-col items-center">
        {/* 3D Carousel Stage Row with Floating Navigation Arrows */}
        <div className="relative w-full flex items-center justify-center">
          {/* Floating Left Arrow */}
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous fragrance"
            className="absolute left-1.5 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md text-black dark:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-md border border-black/10 dark:border-white/15"
          >
            <ArrowLeft size={16} strokeWidth={2} className="sm:hidden" />
            <ArrowLeft size={22} strokeWidth={1.5} className="hidden sm:block" />
          </button>

          {/* 3D Turntable / Rotation Stage */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="relative w-full h-[270px] min-[400px]:h-[300px] sm:h-[370px] md:h-[430px] lg:h-[470px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
            style={{
              perspective: 1200,
              perspectiveOrigin: "center center",
              transformStyle: "preserve-3d",
            }}
          >
            {carouselSlides.map((slide, idx) => {
              const diff = getCircularOffset(idx, carouselSlides.length);
              const transform = get3DTransform(diff);
              const isFront = diff === 0;

              return (
                <motion.div
                  key={slide.fragrance.id}
                  animate={{
                    x: transform.x,
                    y: transform.y,
                    z: transform.z,
                    rotateY: transform.rotateY,
                    rotateZ: transform.rotateZ,
                    scale: transform.scale,
                    opacity: transform.opacity,
                    filter: transform.filter,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 25,
                    mass: 0.85,
                  }}
                  whileHover={
                    !isFront
                      ? {
                          scale: (transform.scale as number) * 1.05,
                          opacity: 1,
                        }
                      : undefined
                  }
                  style={{
                    zIndex: transform.zIndex,
                    transformStyle: "preserve-3d",
                  }}
                  onClick={() => {
                    if (isDragging) return;
                    if (diff !== 0) move(diff);
                  }}
                  className={`absolute flex flex-col items-center justify-center ${
                    isFront ? "cursor-default" : "cursor-pointer"
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={slide.fragrance.name}
                    draggable={false}
                    className="h-[160px] min-[400px]:h-[185px] sm:h-[230px] md:h-[270px] lg:h-[310px] w-auto max-h-full object-contain pointer-events-none transition-all duration-300 rounded-xl sm:rounded-2xl"
                  />
                  {!isFront && (
                    <span className="mt-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      {slide.fragrance.name}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Floating Right Arrow */}
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next fragrance"
            className="absolute right-1.5 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/85 dark:bg-neutral-900/85 backdrop-blur-md text-black dark:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-md border border-black/10 dark:border-white/15"
          >
            <ArrowRight size={16} strokeWidth={2} className="sm:hidden" />
            <ArrowRight size={22} strokeWidth={1.5} className="hidden sm:block" />
          </button>
        </div>

        {/* Front Product Details Section - Placed with ample clearance so it NEVER imposes on the bottle */}
        <div className="mt-4 sm:mt-6 md:mt-8 text-center max-w-lg mx-auto px-4 z-20 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={selected.fragrance.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center"
            >
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-[0.14em] text-black dark:text-white">
                {selected.fragrance.name}
              </h2>
              <p className="mt-1 text-[10px] sm:text-[11px] md:text-xs font-medium uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">
                {selected.fragrance.tagline}
              </p>

              <div className="mt-2.5 flex items-center justify-center">
                <PriceTag
                  price={selected.fragrance.price}
                  originalPrice={selected.fragrance.originalPrice}
                  size="md"
                />
              </div>

              <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={justAdded}
                  className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-4 sm:px-5 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 cursor-pointer border ${
                    justAdded
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm scale-[1.02]"
                      : "border-black/20 dark:border-white/20 bg-white/70 dark:bg-neutral-900/70 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 hover:border-black/40 dark:hover:border-white/40 active:scale-95"
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check size={14} className="shrink-0 stroke-[2.5]" />
                      <span>Added to Cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={14} className="shrink-0 stroke-[2]" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onBuyNow) {
                      onBuyNow(selected.fragrance.id);
                    } else {
                      onAddToCart(selected.fragrance);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-lg bg-black dark:bg-white px-5 sm:px-6 py-2.5 text-[10px] sm:text-xs font-bold uppercase tracking-[0.16em] text-white dark:text-black transition-all hover:bg-neutral-800 dark:hover:bg-neutral-200 hover:scale-[1.02] active:scale-95 shadow-xs cursor-pointer"
                >
                  Buy Now
                </button>
              </div>

              {/* Added notification indicator */}
              <div className="h-4 sm:h-5 mt-1.5 flex items-center justify-center">
                <AnimatePresence>
                  {justAdded && (
                    <motion.p
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1"
                    >
                      <Check size={13} className="shrink-0" />
                      <span>Added! Showing next fragrance...</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Circular Indicator Dots */}
          <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2">
            {carouselSlides.map((slide, idx) => (
              <button
                key={slide.fragrance.id}
                type="button"
                onClick={() => setActive(idx)}
                aria-label={`Go to ${slide.fragrance.name}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  active === idx
                    ? "w-6 bg-black dark:bg-white"
                    : "w-1.5 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


