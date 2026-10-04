export function calculateDiscountPercent(originalPrice?: number, price?: number): number {
  const orig = Number(originalPrice) || 0;
  const curr = Number(price) || 0;
  if (orig <= curr || orig <= 0) return 0;
  return Math.round(((orig - curr) / orig) * 100);
}

export function calculateCartTotals(
  items: Array<{ price: number; quantity: number }>,
  discountAmount = 0,
  shippingCost = 0
): {
  subtotal: number;
  total: number;
  discount: number;
  shipping: number;
  itemCount: number;
} {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const discount = Math.min(subtotal, Math.max(0, discountAmount));
  const shipping = Math.max(0, shippingCost);
  const total = Math.max(0, subtotal - discount + shipping);

  return {
    subtotal,
    total,
    discount,
    shipping,
    itemCount,
  };
}
