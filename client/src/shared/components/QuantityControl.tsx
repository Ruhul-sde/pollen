import React from "react";
import { Minus, Plus } from "lucide-react";

interface QuantityControlProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
  disabled?: boolean;
}

export function QuantityControl({
  quantity,
  onIncrease,
  onDecrease,
  min = 0,
  max = 99,
  size = "md",
  variant = "light",
  className = "",
  disabled = false,
}: QuantityControlProps) {
  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
    lg: "h-12 text-base",
  }[size];

  const buttonSize = {
    sm: "w-8",
    md: "w-10",
    lg: "w-12",
  }[size];

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size];

  const themeClasses = {
    light: "border-black/30 dark:border-neutral-700 text-black dark:text-white bg-white dark:bg-neutral-900",
    dark: "border-neutral-800 text-white bg-neutral-900",
  }[variant];

  const hoverClasses = {
    light: "hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black",
    dark: "hover:bg-neutral-800 hover:text-amber-400",
  }[variant];

  return (
    <div
      className={`inline-flex items-center border font-semibold select-none ${sizeClasses} ${themeClasses} ${className}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= min}
        aria-label="Decrease quantity"
        className={`flex h-full ${buttonSize} items-center justify-center transition-colors disabled:opacity-30 ${hoverClasses}`}
      >
        <Minus size={iconSize} />
      </button>

      <span className="flex h-full min-w-8 items-center justify-center px-1 font-mono text-center">
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || quantity >= max}
        aria-label="Increase quantity"
        className={`flex h-full ${buttonSize} items-center justify-center transition-colors disabled:opacity-30 ${hoverClasses}`}
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
}
