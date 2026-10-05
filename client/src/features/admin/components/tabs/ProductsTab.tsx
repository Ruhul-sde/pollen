import React, { useState, useRef, useMemo } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  DollarSign,
  Edit3,
  ExternalLink,
  Eye,
  Flame,
  Image as ImageIcon,
  Layers,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { BackendProduct, updateAdminProduct, uploadImage } from "@/app/api";

import pollen1 from "@/app/Images/1c.jpg";
import pollen2 from "@/app/Images/2e.jpg";
import pollen3 from "@/app/Images/3e.jpg";
import giftSetHero from "@/app/Images/4a.PNG";
import bottle1 from "@/app/Images/1a bg.png";
import bottle2 from "@/app/Images/2a bg.png";
import bottle3 from "@/app/Images/3a bg.png";

interface ProductsTabProps {
  products: BackendProduct[];
  searchQuery: string;
  onAddProduct: () => void;
  onEditProduct: (product: BackendProduct) => void;
  onEditPrice: (product: BackendProduct) => void;
  onToggleStock: (product: BackendProduct) => void;
  onDeleteProduct: (productId: string, name: string) => void;
  onRefresh?: () => void;
}

/**
 * Dynamically resolves product image URL with smart fallback to high-res bundled assets
 */
function resolveFragranceImage(
  prod: BackendProduct,
  mode: "editorial" | "bottle" = "editorial"
): string {
  if (prod.imageUrl && typeof prod.imageUrl === "string" && prod.imageUrl.trim() !== "") {
    const raw = prod.imageUrl.trim();
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
      return raw;
    }
    if (raw.startsWith("/uploads")) {
      const serverOrigin = import.meta.env.VITE_SERVER_URL || "https://pollen-server.jxdww2.easypanel.host";
      return `${serverOrigin}${raw}`;
    }
    return raw;
  }

  const key = (prod.slug || prod.name || String((prod as any).productId || "")).toLowerCase();

  if (key.includes("power") || key === "1") {
    return mode === "bottle" ? bottle2 : pollen2;
  }
  if (key.includes("cherry") || key === "2") {
    return mode === "bottle" ? bottle3 : pollen3;
  }
  if (key.includes("orchid") || key === "3") {
    return mode === "bottle" ? bottle1 : pollen1;
  }
  if (key.includes("gift") || key.includes("bundle") || key.includes("set") || key === "4") {
    return giftSetHero;
  }

  return pollen1;
}

/**
 * Individual modern fragrance card with dynamic image upload & rich micro-interactions
 */
function FragranceAdminCard({
  product,
  onEditProduct,
  onEditPrice,
  onToggleStock,
  onDeleteProduct,
  onRefresh,
}: {
  product: BackendProduct;
  onEditProduct: (p: BackendProduct) => void;
  onEditPrice: (p: BackendProduct) => void;
  onToggleStock: (p: BackendProduct) => void;
  onDeleteProduct: (id: string, name: string) => void;
  onRefresh?: () => void;
}) {
  const [viewMode, setViewMode] = useState<"editorial" | "bottle">("editorial");
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDisplayImage =
    localImageUrl ||
    (imageError ? resolveFragranceImage(product, "bottle") : resolveFragranceImage(product, viewMode));

  const hasDiscount =
    product.originalPrice && Number(product.originalPrice) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round(
        ((Number(product.originalPrice) - Number(product.price)) /
          Number(product.originalPrice)) *
          100
      )
    : 0;

  // Extract structured olfactory notes
  const notesList = useMemo(() => {
    if (!product.notes) return [];
    if (Array.isArray(product.notes)) {
      return product.notes.map((n: any) => (typeof n === "string" ? n : n.name || ""));
    }
    return [];
  }, [product.notes]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB.");
      return;
    }

    try {
      setIsUploading(true);
      const uploadedUrl = await uploadImage(file);
      setLocalImageUrl(uploadedUrl);

      // Persist directly to backend
      const targetId = product._id || (product as any).productId || product.slug;
      await updateAdminProduct(targetId, {
        imageUrl: uploadedUrl,
      });

      toast.success(`Image updated for ${product.name}!`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="group relative rounded-2xl border border-neutral-800/90 bg-neutral-900/40 p-5 backdrop-blur-md flex flex-col justify-between hover:border-amber-500/40 hover:bg-neutral-900/60 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-black/50">
      <div>
        {/* Modern Image Canvas with Hover Controls & Status Badges */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-b from-neutral-950 via-neutral-900 to-black border border-neutral-800/80 flex items-center justify-center">
          <img
            src={currentDisplayImage}
            alt={product.name}
            onError={() => setImageError(true)}
            className={`h-full w-full ${
              viewMode === "bottle" ? "object-contain p-4 drop-shadow-2xl" : "object-cover"
            } transition-transform duration-500 group-hover:scale-105 select-none`}
          />

          {/* Uploading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
              <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
              <span className="text-[11px] font-bold text-amber-300 tracking-wider uppercase">
                Uploading Image...
              </span>
            </div>
          )}

          {/* Floating Top Status Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
            {/* Stock Status Badge */}
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md backdrop-blur-md ${
                product.inStock
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  product.inStock ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              {product.inStock ? "In Stock" : "Out of Stock"}
            </span>

            {/* Discount Badge */}
            {hasDiscount && (
              <span className="rounded-full bg-amber-400 text-black px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-md">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Floating Bottom Canvas Controls (Switch View & Instant Upload) */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 opacity-90 group-hover:opacity-100 transition-opacity">
            {/* View Mode Toggle: Lifestyle vs Bottle */}
            <div className="flex items-center rounded-lg bg-black/60 backdrop-blur-md border border-neutral-700/80 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("editorial")}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  viewMode === "editorial"
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Editorial Lifestyle View"
              >
                Editorial
              </button>
              <button
                type="button"
                onClick={() => setViewMode("bottle")}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  viewMode === "bottle"
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
                title="Isolated Bottle View"
              >
                Bottle
              </button>
            </div>

            {/* Quick Replace Image Action */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg bg-black/75 hover:bg-black text-neutral-300 hover:text-amber-400 border border-neutral-700/80 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase backdrop-blur-md transition-all cursor-pointer shadow-md"
              title="Replace Fragrance Image"
            >
              <Camera className="h-3 w-3" />
              <span>Change Image</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />
          </div>
        </div>

        {/* Product Details Section */}
        <div className="mt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                  {product.volume || "50 ML"} · {product.type || (product as any).concentration || "Parfum"}
                </span>
                {(product as any).gender && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-800/60 px-1.5 py-0.5 rounded">
                    {(product as any).gender}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5 group-hover:text-amber-300 transition-colors">
                {product.name}
              </h3>
            </div>

            {/* Price Presentation */}
            <div className="text-right font-mono shrink-0">
              <div className="flex items-baseline gap-1.5 justify-end">
                <span className="text-base font-bold text-amber-300">₹{product.price}</span>
                {hasDiscount && (
                  <span className="text-xs text-neutral-500 line-through">
                    ₹{product.originalPrice}
                  </span>
                )}
              </div>
              {hasDiscount && (
                <span className="inline-block text-[10px] font-semibold text-emerald-400 font-sans">
                  Save ₹{Number(product.originalPrice) - Number(product.price)}
                </span>
              )}
            </div>
          </div>

          {/* Tagline & Description */}
          {product.tagline && (
            <p className="mt-1 text-xs font-medium text-neutral-300 italic line-clamp-1">
              "{product.tagline}"
            </p>
          )}

          <p className="mt-2 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Olfactory Notes Badges */}
          {notesList.length > 0 && (
            <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mr-1 flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-amber-400" />
                Notes:
              </span>
              {notesList.slice(0, 4).map((note: string, idx: number) => (
                <span
                  key={idx}
                  className="rounded-md bg-neutral-800/80 border border-neutral-700/60 px-2 py-0.5 text-[10px] font-medium text-neutral-300 shadow-2xs"
                >
                  {note}
                </span>
              ))}
              {notesList.length > 4 && (
                <span className="text-[9px] font-bold text-neutral-500">
                  +{notesList.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modern Control Action Bar */}
      <div className="mt-5 pt-4 border-t border-neutral-800/80 flex items-center justify-between gap-2 flex-wrap">
        {/* In-Stock Quick Switcher */}
        <button
          type="button"
          onClick={() => onToggleStock(product)}
          className={`flex-1 min-w-[110px] rounded-xl py-2 px-3 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
            product.inStock
              ? "bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
          }`}
          title={product.inStock ? "Click to mark as Out of Stock" : "Click to Restock"}
        >
          <Zap className="h-3.5 w-3.5" />
          <span>{product.inStock ? "Mark Sold Out" : "Restock Now"}</span>
        </button>

        {/* Edit Fragrance Details */}
        <button
          type="button"
          onClick={() => onEditProduct(product)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800/90 text-neutral-200 hover:text-white hover:bg-neutral-700 text-xs font-bold transition-all cursor-pointer"
          title="Edit Details, Notes, Story & Gallery"
        >
          <Edit3 className="h-3.5 w-3.5 text-neutral-400 group-hover:text-amber-400" />
          <span>Edit</span>
        </button>

        {/* Quick Price Adjust */}
        <button
          type="button"
          onClick={() => onEditPrice(product)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 border border-amber-400/30 text-xs font-bold transition-all cursor-pointer"
          title="Adjust Retail Price & Original Price"
        >
          <Tag className="h-3.5 w-3.5" />
          <span>Price</span>
        </button>

        {/* Delete Fragrance */}
        <button
          type="button"
          onClick={() => onDeleteProduct(product._id, product.name)}
          className="p-2 rounded-xl bg-neutral-800/90 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
          title="Delete Fragrance from Catalog"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function ProductsTab({
  products,
  searchQuery,
  onAddProduct,
  onEditProduct,
  onEditPrice,
  onToggleStock,
  onDeleteProduct,
  onRefresh,
}: ProductsTabProps) {
  const [stockFilter, setStockFilter] = useState<"all" | "inStock" | "outOfStock">("all");
  const [sortBy, setSortBy] = useState<"default" | "priceAsc" | "priceDesc" | "name">("default");

  // Summary statistics
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.inStock).length;
    const outOfStock = total - inStock;
    const avgPrice =
      total > 0
        ? Math.round(products.reduce((acc, p) => acc + (Number(p.price) || 0), 0) / total)
        : 0;
    return { total, inStock, outOfStock, avgPrice };
  }, [products]);

  // Filtering & Sorting
  const processedProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (p.name || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.tagline || "").toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Stock Filter
      if (stockFilter === "inStock" && !p.inStock) return false;
      if (stockFilter === "outOfStock" && p.inStock) return false;

      return true;
    });

    // Sorting
    if (sortBy === "priceAsc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "priceDesc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "name") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return result;
  }, [products, searchQuery, stockFilter, sortBy]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner & Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Fragrance Catalog</h2>
            <span className="rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              {products.length} Fragrances
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage perfumes, olfactory pyramids, live pricing, stock inventory, and dynamic visual assets.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddProduct}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-[0_4px_16px_rgba(212,175,55,0.25)] hover:shadow-[0_6px_22px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Fragrance</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
            Total Fragrances
          </span>
          <span className="text-xl font-bold text-white font-mono mt-1 block">
            {stats.total}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
            In Stock Active
          </span>
          <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
            {stats.inStock}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
            Sold Out / Inactive
          </span>
          <span className="text-xl font-bold text-rose-400 font-mono mt-1 block">
            {stats.outOfStock}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Average Bottle Price
          </span>
          <span className="text-xl font-bold text-amber-300 font-mono mt-1 block">
            ₹{stats.avgPrice}
          </span>
        </div>
      </div>

      {/* Filters & Sorting Control Bar */}
      <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Stock Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950 border border-neutral-800 self-start">
          <button
            type="button"
            onClick={() => setStockFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stockFilter === "all"
                ? "bg-white text-black shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter("inStock")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stockFilter === "inStock"
                ? "bg-emerald-500 text-black shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            In Stock ({stats.inStock})
          </button>
          <button
            type="button"
            onClick={() => setStockFilter("outOfStock")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stockFilter === "outOfStock"
                ? "bg-rose-500 text-white shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Sold Out ({stats.outOfStock})
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-neutral-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs font-bold text-white focus:border-amber-400 focus:outline-hidden cursor-pointer"
          >
            <option value="default">Default Order</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Fragrance Cards Grid */}
      {processedProducts.length === 0 ? (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-12 text-center">
          <Package className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No fragrances found</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or filter settings, or add a new fragrance to the catalog.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedProducts.map((prod) => (
            <FragranceAdminCard
              key={prod._id || prod.name}
              product={prod}
              onEditProduct={onEditProduct}
              onEditPrice={onEditPrice}
              onToggleStock={onToggleStock}
              onDeleteProduct={onDeleteProduct}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
