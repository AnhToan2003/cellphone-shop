import HomeCategory from "../models/HomeCategory.js";
import { Product } from "../models/Product.js";
import { applyPricingToProduct, loadActivePromotions } from "../utils/pricing.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const formatResponse = (data) => ({
  success: true,
  data,
});

const sortQuery = { order: 1, createdAt: 1 };
const MAX_LINKED_PRODUCTS = 12;

const normalizeSingleSlug = (value) =>
  typeof value === "string" ? value.trim() : "";

const toCandidateArray = (input) => {
  if (!input) {
    return [];
  }
  if (Array.isArray(input)) {
    return input;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // ignore invalid JSON payloads
      }
    }
    return trimmed.split(/[\s,;]+/);
  }
  return [];
};

const normalizeProductSlugs = (input) => {
  const seen = new Set();
  const normalized = [];
  toCandidateArray(input).forEach((candidate) => {
    const slug = normalizeSingleSlug(candidate);
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      normalized.push(slug);
    }
  });
  return normalized.slice(0, MAX_LINKED_PRODUCTS);
};

const extractCategorySlugs = (category) => {
  if (!category) return [];
  const normalized = normalizeProductSlugs(category.productSlugs);
  if (normalized.length) {
    return normalized;
  }
  const fallback = normalizeSingleSlug(category.productSlug);
  return fallback ? [fallback] : [];
};

const attachLinkedProducts = async (categories, { customerTier } = {}) => {
  if (!Array.isArray(categories) || !categories.length) {
    return [];
  }

  const slugSet = new Set();
  const normalizedCategories = categories.map((category) => {
    const normalizedSlugs = extractCategorySlugs(category);
    normalizedSlugs.forEach((slug) => slugSet.add(slug));
    return { ...category, productSlugs: normalizedSlugs };
  });

  if (!slugSet.size) {
    return normalizedCategories.map((category) => ({
      ...category,
      linkedProducts: [],
    }));
  }

  const products = await Product.find({
    slug: { $in: Array.from(slugSet) },
  })
    .select(
      "name slug brand price finalPrice oldPrice discountPercent imageUrl images rating ratingCount appliedPromotion"
    )
    .lean();

  const promotions = await loadActivePromotions();
  const productMap = products.reduce((acc, product) => {
    const enriched = applyPricingToProduct(product, {
      promotions,
      customerTier,
    });
    acc[product.slug] = enriched;
    return acc;
  }, {});

  return normalizedCategories.map((category) => ({
    ...category,
    linkedProducts: category.productSlugs
      .map((slug) => productMap[slug])
      .filter(Boolean),
  }));
};

export const listHomeCategories = asyncHandler(async (req, res) => {
  const categoriesDoc = await HomeCategory.find({ isFeatured: true })
    .sort(sortQuery)
    .lean();
  const categories = await attachLinkedProducts(categoriesDoc, {
    customerTier: req.user?.customerTier,
  });
  res.json(formatResponse(categories));
});

export const adminListHomeCategories = asyncHandler(async (req, res) => {
  const categoriesDoc = await HomeCategory.find().sort(sortQuery).lean();
  const categories = await attachLinkedProducts(categoriesDoc, {
    customerTier: req.user?.customerTier,
  });
  res.json(formatResponse(categories));
});

export const adminCreateHomeCategory = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const normalizedSlugs = normalizeProductSlugs(payload.productSlugs);
  const primarySlug =
    normalizeSingleSlug(payload.productSlug) ||
    normalizedSlugs[0] ||
    "";

  const category = await HomeCategory.create({
    title: payload.title,
    subtitle: payload.subtitle,
    gradient: payload.gradient,
    searchKeyword: payload.searchKeyword,
    productSlug: primarySlug,
    productSlugs:
      normalizedSlugs.length > 0
        ? normalizedSlugs
        : primarySlug
        ? [primarySlug]
        : [],
    order: Number.isFinite(Number(payload.order))
      ? Number(payload.order)
      : 0,
    isFeatured:
      payload.isFeatured === undefined ? true : Boolean(payload.isFeatured),
  });
  res.status(201).json(formatResponse(category));
});

export const adminUpdateHomeCategory = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const category = await HomeCategory.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Home category not found",
    });
  }

  category.title = payload.title ?? category.title;
  category.subtitle = payload.subtitle ?? category.subtitle;
  category.gradient = payload.gradient ?? category.gradient;
  category.searchKeyword = payload.searchKeyword ?? category.searchKeyword;

  let primarySlug = normalizeSingleSlug(category.productSlug);
  if (payload.productSlug !== undefined) {
    primarySlug = normalizeSingleSlug(payload.productSlug);
    category.productSlug = primarySlug;
  } else if (primarySlug !== category.productSlug) {
    category.productSlug = primarySlug;
  }

  if (payload.productSlugs !== undefined) {
    const normalizedSlugs = normalizeProductSlugs(payload.productSlugs);
    category.productSlugs =
      normalizedSlugs.length > 0
        ? normalizedSlugs
        : primarySlug
        ? [primarySlug]
        : [];
  } else if (
    (!Array.isArray(category.productSlugs) ||
      category.productSlugs.length === 0) &&
    primarySlug
  ) {
    category.productSlugs = [primarySlug];
  }

  if (payload.order !== undefined) {
    const nextOrder = Number(payload.order);
    if (Number.isFinite(nextOrder)) {
      category.order = nextOrder;
    }
  }
  if (payload.isFeatured !== undefined) {
    category.isFeatured = Boolean(payload.isFeatured);
  }

  await category.save();
  res.json(formatResponse(category));
});

export const adminDeleteHomeCategory = asyncHandler(async (req, res) => {
  const category = await HomeCategory.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Home category not found",
    });
  }
  await category.deleteOne();
  res.json({ success: true });
});

export default {
  listHomeCategories,
  adminListHomeCategories,
  adminCreateHomeCategory,
  adminUpdateHomeCategory,
  adminDeleteHomeCategory,
};
