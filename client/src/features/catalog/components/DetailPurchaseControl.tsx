import React from "react";
import { QuantityControl } from "@/shared/components/QuantityControl";

interface DetailPurchaseControlProps {
  quantity: number;
  onAddToCart: () => void;
  onBuyNow?: () => void;
  onChangeQuantity: (change: number) => void;
}

export function DetailPurchaseControl({
  quantity,
  onAddToCart,
  onBuyNow,
  onChangeQuantity,
}: DetailPurchaseControlProps) {
  if (quantity === 0) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onAddToCart}
          className="bg-black dark:bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
        >
          Add to cart
        </button>
        {onBuyNow && (
          <button
            type="button"
            onClick={onBuyNow}
            className="border border-black dark:border-white bg-white dark:bg-neutral-900 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-colors cursor-pointer"
          >
            Buy now
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityControl
        quantity={quantity}
        onIncrease={onAddToCart}
        onDecrease={() => onChangeQuantity(-1)}
        size="lg"
        variant="light"
      />
      {onBuyNow && (
        <button
          type="button"
          onClick={onBuyNow}
          className="bg-black dark:bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-sm cursor-pointer"
        >
          Buy now →
        </button>
      )}
    </div>
  );
}
