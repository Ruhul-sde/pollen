import React from "react";
import { calculateDiscountPercent } from "../utils/calculations";
import { formatPrice } from "../utils/formatters";

interface PriceTagProps {
  price: number;
  originalPrice?: number;
  currencySymbol?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  theme?: "light" | "dark" | "amber";
  className?: string;
}

export function PriceTag({
  price,
  originalPrice,
  currencySymbol = "₹",
  size = "md",
  theme = "light",
  className = "",
}: PriceTagProps) {
  const discountPercent = calculateDiscountPercent(originalPrice, price);
  const hasDiscount = discountPercent > 0;

  const sizeClasses = {
    xs: {
      price: "text-xs font-semibold",
      original: "text-[10px]",
      badge: "text-[8px] px-1 py-0.2",
    },
    sm: {
      price: "text-sm font-semibold",
      original: "text-xs",
      badge: "text-[9px] px-1.5 py-0.5",
    },
    md: {
      price: "text-base font-bold",
      original: "text-xs",
      badge: "text-[10px] px-1.5 py-0.5",
    },
    lg: {
      price: "text-xl font-bold",
      original: "text-sm",
      badge: "text-[10px] px-2 py-0.5",
    },
    xl: {
      price: "text-2xl sm:text-3xl font-bold",
      original: "text-base sm:text-lg",
      badge: "text-xs px-2.5 py-1",
    },
  }[size];

  const themeClasses = {
    light: {
      price: "text-black dark:text-white",
      original: "text-black/45 dark:text-neutral-400",
      badge: "bg-black text-white dark:bg-amber-400/20 dark:text-amber-300 dark:border dark:border-amber-400/30",
    },
    dark: {
      price: "text-white",
      original: "text-white/50",
      badge: "bg-amber-400/20 text-amber-300 border border-amber-400/30",
    },
    amber: {
      price: "text-amber-300",
      original: "text-neutral-400",
      badge: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    },
  }[theme];

  return (
    <div className={`inline-flex items-baseline gap-2 font-mono ${className}`}>
      <span className={`${sizeClasses.price} ${themeClasses.price}`}>
        {formatPrice(price, currencySymbol)}
      </span>

      {hasDiscount && originalPrice && (
        <>
          <span className={`line-through ${sizeClasses.original} ${themeClasses.original}`}>
            {formatPrice(originalPrice, currencySymbol)}
          </span>
          <span
            className={`rounded font-sans font-bold uppercase tracking-wider ${sizeClasses.badge} ${themeClasses.badge}`}
          >
            {discountPercent}% off
          </span>
        </>
      )}
    </div>
  );
}
