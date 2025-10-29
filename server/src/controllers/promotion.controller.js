import { z } from "zod";

import { Promotion } from "../models/Promotion.js";
import { Product } from "../models/Product.js";
import {
  CUSTOMER_TIERS,
  CUSTOMER_TIER_LABELS,
} from "../constants/customer.js";

const ISO_DATE_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{1,3})?Z$/;

const dateInput = z
  .union([
    z
      .string()
      .trim()
      .regex(ISO_DATE_REGEX, "Date must be an ISO8601 string"),
    z.date(),
  ])
  .optional();

const basePromotionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Promotion name must contain at least 2 characters")
    .max(160, "Promotion name must not exceed 160 characters"),
  description: z.string().trim().max(500, "Description must not exceed 500 characters").optional(),
  scope: z.enum(["global", "product", "customerTier"]),
  discountPercent: z
    .number()
    .min(0, "Discount must be at least 0%")
    .max(100, "Discount must not exceed 100%"),
  startAt: dateInput,
  endAt: dateInput,
  products: z.array(z.string()).optional(),
  customerTiers: z.array(z.enum(Object.values(CUSTOMER_TIERS))).optional(),
  isActive: z.boolean().optional(),
});

const createPromotionSchema = basePromotionSchema;
const updatePromotionSchema = basePromotionSchema.partial();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const ensureProductsExist = async (productIds = []) => {
  if (!productIds.length) return [];
  const products = await Product.find({ _id: { $in: productIds } }).select("_id");
  const foundIds = new Set(products.map((product) => product._id.toString()));
  const missing = productIds.filter((id) => !foundIds.has(id));
  if (missing.length) {
    throw new Error("Some products were not found");
  }
  return products.map((product) => product._id);
};

const parseDate = (value) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const validateScopeTargets = (data) => {
  if (data.scope === "product" && (!data.products || data.products.length === 0)) {
    throw new Error("Product promotions must target at least one product");
  }
  if (
    data.scope === "customerTier" &&
    (!data.customerTiers || data.customerTiers.length === 0)
  ) {
    throw new Error("Tier promotions must target at least one customer tier");
  }
};

const normalizePromotionPayload = async (payload) => {
  const data = {
    description: "",
    products: [],
    customerTiers: [],
    isActive: true,
    ...payload,
  };

  data.description = (data.description ?? "").toString().trim();
  data.products = Array.isArray(data.products) ? data.products : [];
  data.customerTiers = Array.isArray(data.customerTiers)
    ? data.customerTiers
    : [];
  if (data.isActive === undefined) {
    data.isActive = true;
  }

  if (data.products?.length) {
    data.products = await ensureProductsExist(data.products);
  }
  if (data.startAt) {
    data.startAt = parseDate(data.startAt);
  }
  if (data.endAt) {
    data.endAt = parseDate(data.endAt);
  }
  if (data.startAt && data.endAt && data.endAt < data.startAt) {
    throw new Error("endAt must be greater than startAt");
  }

  validateScopeTargets(data);

  return data;
};

const decoratePromotion = (promotion) => {
  const doc =
    typeof promotion.toObject === "function"
      ? promotion.toObject({ virtuals: true })
      : { ...promotion };
  return {
    ...doc,
    status: promotion.isActive ? "active" : "inactive",
    isCurrentlyActive: promotion.isActive,
    customerTierLabels: doc.customerTiers?.map(
      (tier) => CUSTOMER_TIER_LABELS[tier] || tier
    ),
  };
};

export const listPromotions = asyncHandler(async (_req, res) => {
  const promotions = await Promotion.find()
    .sort({ createdAt: -1 })
    .populate("products", "name slug");

  res.json({
    success: true,
    data: promotions.map(decoratePromotion),
  });
});

const normalizeListField = (value) => {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return undefined;
  return [value];
};

export const createPromotion = asyncHandler(async (req, res) => {
  const parsed = createPromotionSchema.parse({
    ...req.body,
    discountPercent: Number(req.body.discountPercent),
    startAt: req.body.startAt || undefined,
    endAt: req.body.endAt || undefined,
    products: normalizeListField(req.body.products),
    customerTiers: normalizeListField(req.body.customerTiers),
  });

  const prepared = {
    ...parsed,
    description: parsed.description ?? "",
    products: parsed.products ?? [],
    customerTiers: parsed.customerTiers ?? [],
    isActive: parsed.isActive ?? true,
    startAt: parsed.startAt ?? new Date().toISOString(),
  };

  let normalized;
  try {
    normalized = await normalizePromotionPayload(prepared);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid promotion payload",
    });
  }
  const promotion = await Promotion.create(normalized);

  const hydrated = await Promotion.findById(promotion._id).populate(
    "products",
    "name slug"
  );

  res.status(201).json({
    success: true,
    message: "Promotion created",
    data: decoratePromotion(hydrated),
  });
});

export const updatePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) {
    return res.status(404).json({
      success: false,
      message: "Promotion not found",
    });
  }

  const parsed = updatePromotionSchema.parse({
    ...req.body,
    discountPercent:
      req.body.discountPercent !== undefined
        ? Number(req.body.discountPercent)
        : undefined,
    startAt: req.body.startAt === "" ? undefined : req.body.startAt,
    endAt: req.body.endAt === "" ? undefined : req.body.endAt,
    products:
      req.body.products !== undefined
        ? normalizeListField(req.body.products)
        : undefined,
    customerTiers:
      req.body.customerTiers !== undefined
        ? normalizeListField(req.body.customerTiers)
        : undefined,
  });

  const merged = {
    name: parsed.name ?? promotion.name,
    description:
      parsed.description !== undefined
        ? parsed.description
        : promotion.description ?? "",
    scope: parsed.scope ?? promotion.scope,
    discountPercent:
      parsed.discountPercent !== undefined
        ? parsed.discountPercent
        : promotion.discountPercent,
    startAt:
      parsed.startAt !== undefined
        ? parsed.startAt
        : promotion.startAt ?? undefined,
    endAt:
      parsed.endAt !== undefined ? parsed.endAt : promotion.endAt ?? undefined,
    products:
      parsed.products !== undefined
        ? parsed.products
        : promotion.products?.map((id) => id.toString()) ?? [],
    customerTiers:
      parsed.customerTiers !== undefined
        ? parsed.customerTiers
        : promotion.customerTiers ?? [],
    isActive:
      parsed.isActive !== undefined ? parsed.isActive : promotion.isActive,
  };

  let normalized;
  try {
    normalized = await normalizePromotionPayload(merged);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Invalid promotion payload",
    });
  }

  Object.assign(promotion, normalized);
  await promotion.save();

  const hydrated = await Promotion.findById(promotion._id).populate(
    "products",
    "name slug"
  );

  res.json({
    success: true,
    message: "Promotion updated",
    data: decoratePromotion(hydrated),
  });
});

export const deletePromotion = asyncHandler(async (req, res) => {
  const promotion = await Promotion.findById(req.params.id);
  if (!promotion) {
    return res.status(404).json({
      success: false,
      message: "Promotion not found",
    });
  }

  await promotion.deleteOne();

  res.json({
    success: true,
    message: "Promotion deleted",
  });
});
