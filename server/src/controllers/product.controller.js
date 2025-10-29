import { z } from "zod";

import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { Order } from "../models/Order.js";
import { buildPagination, preparePagination } from "../utils/paginate.js";
import {
  applyPricingToProduct,
  loadActivePromotions,
} from "../utils/pricing.js";

const escapeRegExp = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeForSearch = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const productInputSchema = z.object({
  name: z.string().min(2, "Product name must contain at least 2 characters"),
  brand: z.string().min(2, "Brand must contain at least 2 characters"),
  category: z.string().optional().default(""),
  price: z.number().nonnegative("Price must be greater than or equal to 0"),
  discountPercent: z.number().min(0).max(100).default(0),
  stock: z.number().int().min(0).default(0),
  description: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
  images: z.array(z.string()).default([]),
  specs: z.record(z.string().min(1), z.string().min(1)).default({}),
  rating: z.number().min(0).max(5).default(4.5),
  ratingCount: z.number().int().min(0).default(0),
  featured: z.boolean().default(false),
  options: z
    .object({
      colors: z.array(z.string()).default([]),
      capacities: z.array(z.string()).default([]),
    })
    .default({ colors: [], capacities: [] }),
});

const updateSchema = productInputSchema.partial();

const uploadSchema = z.object({
  name: z.string().min(2, "Product name must contain at least 2 characters"),
  brand: z.string().min(2, "Brand must contain at least 2 characters"),
  category: z.string().optional().default(""),
  price: z.number().nonnegative("Price must be greater than or equal to 0"),
  stock: z.number().int().min(0).default(0),
  description: z.string().optional().default(""),
});

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const listProducts = asyncHandler(async (req, res) => {
  const {
    search = "",
    brand,
    min,
    max,
    page = "1",
    limit = "12",
  } = req.query;

  const conditions = [];

  if (search) {
    const normalized = String(search).trim();
    if (normalized) {
      const terms = normalized.split(/\s+/).filter(Boolean);
      terms.forEach((term) => {
        const accentRegex = new RegExp(escapeRegExp(term), "i");
        const normalizedTerm = normalizeForSearch(term);
        const normalizedRegex = new RegExp(escapeRegExp(normalizedTerm), "i");
        conditions.push({
          $or: [
            { name: accentRegex },
            { brand: accentRegex },
            { description: accentRegex },
            { category: accentRegex },
            { slug: accentRegex },
            { searchKeywords: { $regex: normalizedRegex } },
          ],
        });
      });
    }
  }

  if (brand) {
    const brands = String(brand)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (brands.length) {
      conditions.push({
        brand: {
          $in: brands.map(
            (value) => new RegExp(`^${escapeRegExp(value)}$`, "i")
          ),
        },
      });
    }
  }

  if (min || max) {
    const priceFilter = {};
    if (min) {
      priceFilter.$gte = Number(min);
    }
    if (max) {
      priceFilter.$lte = Number(max);
    }
    if (Object.keys(priceFilter).length) {
      conditions.push({ price: priceFilter });
    }
  }

  const filters = conditions.length ? { $and: conditions } : {};

  const pagination = preparePagination({
    page: Number(page),
    limit: Number(limit),
  });

  const [items, total] = await Promise.all([
    Product.find(filters)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Product.countDocuments(filters),
  ]);

  const promotions = await loadActivePromotions();
  const customerTier = req.user?.customerTier;
  const enrichedItems = items.map((item) =>
    applyPricingToProduct(item, { promotions, customerTier })
  );

  res.json({
    success: true,
    data: enrichedItems,
    pagination: buildPagination({
      totalItems: total,
      page: pagination.page,
      limit: pagination.limit,
    }),
  });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  await Product.updateOne({ _id: product._id }, { $inc: { views: 1 } });
  product.views = (product.views || 0) + 1;

  const promotions = await loadActivePromotions();
  const customerTier = req.user?.customerTier;
  const productWithPricing = applyPricingToProduct(product, {
    promotions,
    customerTier,
  });

  res.json({
    success: true,
    data: productWithPricing,
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const payload = productInputSchema.parse({
    ...req.body,
    price: Number(req.body.price),
    discountPercent: Number(req.body.discountPercent ?? 0),
    stock: Number(req.body.stock ?? 0),
    rating: Number(req.body.rating ?? 4.5),
    ratingCount: Number(req.body.ratingCount ?? 0),
  });

  const normalizedImageUrl = payload.imageUrl?.trim?.() || "";
  const preparedImages = payload.images?.length
    ? payload.images
    : normalizedImageUrl
    ? [normalizedImageUrl]
    : [];

  const options = {
    colors: (payload.options?.colors || []).map((color) => color.trim()).filter(Boolean),
    capacities: (payload.options?.capacities || [])
      .map((cap) => cap.trim())
      .filter(Boolean),
  };

  const { options: _ignoredOptions, ...restPayload } = payload;

  const product = await Product.create({
    ...restPayload,
    brand: payload.brand.trim(),
    imageUrl: normalizedImageUrl,
    images: preparedImages,
    category: payload.category?.trim() || "",
    options,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const payload = updateSchema.parse({
    ...req.body,
    price:
      req.body.price !== undefined ? Number(req.body.price) : undefined,
    discountPercent:
      req.body.discountPercent !== undefined
        ? Number(req.body.discountPercent)
        : undefined,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : undefined,
    rating:
      req.body.rating !== undefined ? Number(req.body.rating) : undefined,
    ratingCount:
      req.body.ratingCount !== undefined
        ? Number(req.body.ratingCount)
        : undefined,
  });

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  if (payload.imageUrl !== undefined) {
    payload.imageUrl = payload.imageUrl?.trim?.() || "";
    if (!payload.images || payload.images.length === 0) {
      payload.images = payload.imageUrl ? [payload.imageUrl] : payload.images;
    }
  }

  if (payload.options) {
    payload.options = {
      colors: Array.isArray(payload.options.colors)
        ? payload.options.colors.map((color) => color.trim()).filter(Boolean)
        : [],
      capacities: Array.isArray(payload.options.capacities)
        ? payload.options.capacities.map((cap) => cap.trim()).filter(Boolean)
        : [],
    };
  }

  Object.assign(product, payload);
  if (payload.brand !== undefined) {
    product.brand = payload.brand.trim();
  }
  if (payload.category !== undefined) {
    product.category = payload.category?.trim() || "";
  }
  await product.save();

  res.json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  await product.deleteOne();

  res.json({
    success: true,
    message: "Product removed",
  });
});

export const uploadProduct = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Product image is required",
    });
  }

  const parsed = uploadSchema.parse({
    ...req.body,
    price: Number(req.body.price),
    stock: Number(req.body.stock ?? 0),
  });

  const imageUrl = `/uploads/products/${req.file.filename}`;

  const product = await Product.create({
    name: parsed.name,
    brand: parsed.brand.trim(),
    category: parsed.category?.trim() || "",
    price: parsed.price,
    stock: parsed.stock,
    description: parsed.description ?? "",
    imageUrl,
    images: [imageUrl],
  });

  res.status(201).json({
    success: true,
    message: "Product uploaded successfully",
    data: product,
  });
});

const reviewInputSchema = z.object({
  rating: z.preprocess((val) => Number(val), z.number().min(1).max(5)),
  comment: z.string().optional().default(""),
});

const hasPurchasedProduct = async (userId, productId) => {
  return Order.exists({
    user: userId,
    "items.product": productId,
    status: "delivered",
  });
};

export const getProductReviews = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const reviews = await Review.find({ product: product._id })
    .sort({ createdAt: -1 })
    .populate("user", "name email");

  const stats = reviews.reduce(
    (acc, review) => {
      acc.total += 1;
      acc.sum += review.rating;
      return acc;
    },
    { total: 0, sum: 0 }
  );

  let canReview = false;
  if (req.user) {
    const alreadyReviewed = await Review.exists({
      user: req.user._id,
      product: product._id,
    });
    if (!alreadyReviewed) {
      const hasOrder = await hasPurchasedProduct(req.user._id, product._id);
      canReview = Boolean(hasOrder);
    }
  }

  res.json({
    success: true,
    data: reviews,
    meta: {
      total: stats.total,
      average: stats.total ? Number((stats.sum / stats.total).toFixed(2)) : 0,
      canReview,
    },
  });
});

export const createProductReview = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const payload = reviewInputSchema.parse(req.body);

  const alreadyReviewed = await Review.exists({
    user: req.user._id,
    product: product._id,
  });

  if (alreadyReviewed) {
    return res.status(400).json({
      success: false,
      message: "Bạn đã đánh giá sản phẩm này",
    });
  }

  const hasOrder = await hasPurchasedProduct(req.user._id, product._id);
  if (!hasOrder) {
    return res.status(400).json({
      success: false,
      message: "Bạn cần mua sản phẩm trước khi đánh giá",
    });
  }

  const review = await Review.create({
    user: req.user._id,
    product: product._id,
    rating: payload.rating,
    comment: payload.comment?.trim() || "",
  });

  const aggregate = await Review.aggregate([
    { $match: { product: product._id } },
    {
      $group: {
        _id: "$product",
        average: { $avg: "$rating" },
        total: { $sum: 1 },
      },
    },
  ]);

  if (aggregate.length) {
    await Product.findByIdAndUpdate(product._id, {
      rating: Number(aggregate[0].average.toFixed(2)),
      ratingCount: aggregate[0].total,
    });
  }

  const populated = await Review.findById(review._id).populate(
    "user",
    "name email"
  );

  res.status(201).json({
    success: true,
    message: "Gửi đánh giá thành công",
    data: populated,
  });
});


