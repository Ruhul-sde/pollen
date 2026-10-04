import mongoose from "mongoose";
import { Product } from "../models/Product.js";
import Category from "../models/Category.js";
import Brand from "../models/Brand.js";
import Variant from "../models/Variant.js";
import { paginate } from "../shared/utils/pagination.js";

// ── Products ───────────────────────────────────────────────────────────────

/** GET /api/v1/products */
export async function getProducts(req, res, next) {
  try {
    const {
      page = 1, limit = 20,
      sort = "newest",
      category, brand,
      minPrice, maxPrice,
      search, inStock,
      featured, bestSeller,
    } = req.query;

    const filter = { isPublished: true };

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (inStock === "true") filter.inStock = true;
    if (featured === "true") filter.isFeatured = true;
    if (bestSeller === "true") filter.isBestSeller = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sortMap = {
      newest: { createdAt: -1 },
      popular: { soldCount: -1 },
      rating: { rating: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    };

    const result = await paginate(Product, filter, {
      page,
      limit,
      sort: sortMap[sort] || { createdAt: -1 },
      populate: "category brand",
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/products/:id */
export async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category brand")
      .lean();

    if (!product || !product.isPublished) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const variants = await Variant.find({ productId: product._id, isActive: true }).lean();

    res.json({ success: true, data: { ...product, variants } });
  } catch (err) {
    next(err);
  }
}

/** GET /api/v1/products/slug/:slug */
export async function getProductBySlug(req, res, next) {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isPublished: true })
      .populate("category brand")
      .lean();

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const variants = await Variant.find({ productId: product._id, isActive: true }).lean();

    res.json({ success: true, data: { ...product, variants } });
  } catch (err) {
    next(err);
  }
}

// ── Categories ────────────────────────────────────────────────────────────────

/** GET /api/v1/categories */
export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

// ── Brands ────────────────────────────────────────────────────────────────────

/** GET /api/v1/brands */
export async function getBrands(req, res, next) {
  try {
    const brands = await Brand.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    res.json({ success: true, data: brands });
  } catch (err) {
    next(err);
  }
}

// ── Admin Product Management ───────────────────────────────────────────────────

/** POST /api/v1/admin/products */
export async function createProduct(req, res, next) {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: "Product created", data: product });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/admin/products/:id */
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.originalPrice !== undefined) {
      updateData.originalPrice = updateData.originalPrice ? Number(updateData.originalPrice) : null;
    }

    let product;
    if (mongoose.isValidObjectId(id)) {
      product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      product = await Product.findOneAndUpdate(
        { $or: [{ productId: Number(id) || -1 }, { slug: id }] },
        updateData,
        { new: true, runValidators: true }
      );
    }
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, message: "Product updated", data: product });
  } catch (err) {
    next(err);
  }
}

/** DELETE /api/v1/admin/products/:id */
export async function deleteProduct(req, res, next) {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isPublished: false });
    res.json({ success: true, message: "Product unpublished" });
  } catch (err) {
    next(err);
  }
}

/** POST /api/v1/admin/products/:id/variants */
export async function addVariant(req, res, next) {
  try {
    const variant = await Variant.create({ ...req.body, productId: req.params.id });
    res.status(201).json({ success: true, data: variant });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/admin/variants/:id */
export async function updateVariant(req, res, next) {
  try {
    const variant = await Variant.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!variant) return res.status(404).json({ success: false, message: "Variant not found" });
    res.json({ success: true, data: variant });
  } catch (err) {
    next(err);
  }
}

/** PUT /api/v1/admin/variants/:id/stock */
export async function updateStock(req, res, next) {
  try {
    const { stock } = req.body;
    const variant = await Variant.findByIdAndUpdate(req.params.id, { stock }, { new: true });
    if (!variant) return res.status(404).json({ success: false, message: "Variant not found" });

    // Update parent product inStock flag
    const allVariants = await Variant.find({ productId: variant.productId });
    const anyInStock = allVariants.some((v) => v.stock > 0);
    await Product.findByIdAndUpdate(variant.productId, { inStock: anyInStock });

    res.json({ success: true, message: "Stock updated", data: { stock: variant.stock } });
  } catch (err) {
    next(err);
  }
}

// ── Auto-seed on startup ──────────────────────────────────────────────────────
export async function autoSeedProducts() {
  try {
    const count = await Product.countDocuments();
    if (count > 0) {
      // Ensure products sync with official Google Doc pricing and specifications
      await Product.updateMany(
        { productId: 1, price: { $ne: 499 } },
        { $set: { price: 499, originalPrice: 699, volume: "50 ML" } }
      );
      await Product.updateMany(
        { productId: 2, price: { $ne: 499 } },
        { $set: { price: 499, originalPrice: 699, volume: "50 ML" } }
      );
      await Product.updateMany(
        { productId: 3, price: { $ne: 499 } },
        { $set: { price: 499, originalPrice: 699, volume: "50 ML" } }
      );
      console.log(`[Products] ${count} products in DB verified with official Google Doc specifications`);
      return;
    }

    // Load from JSON seed file
    const { default: products } = await import("../../DataBase Seed/products.json", { assert: { type: "json" } });
    const formatted = products.map((p) => {
      if (Array.isArray(p.notes)) {
        const types = ["top", "heart", "base"];
        return {
          ...p,
          notes: p.notes.map((n, idx) => (typeof n === "string" ? { type: types[idx % 3] || "top", name: n.trim(), icon: "" } : n)),
        };
      }
      return p;
    });
    await Product.insertMany(formatted);
    console.log(`[Products] Seeded ${formatted.length} products`);
  } catch (err) {
    console.warn("[Products] Auto-seed warning:", err.message);
  }
}
