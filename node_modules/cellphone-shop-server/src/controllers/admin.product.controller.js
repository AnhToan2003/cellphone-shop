import { z } from "zod";

import { Product, PRODUCT_BRANDS } from "../models/Product.js";

const numberOrUndefined = (value) =>
  value === undefined || value === null || value === ""
    ? undefined
    : Number(value);

const toTrimmedArray = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);
  }
  if (typeof input === "string") {
    return input
      .split(/[,;\n]/)
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }
  return [];
};

const parseOptionsFromBody = (body = {}) => {
  const source =
    body.options && typeof body.options === "object" ? body.options : body;
  const colors = toTrimmedArray(source.colors);
  const capacities = toTrimmedArray(source.capacities);
  return { colors, capacities };
};

const parseVariantsFromBody = (rawVariants) => {
  let variants = rawVariants;
  if (!variants) {
    return [];
  }
  if (typeof variants === "string") {
    try {
      variants = JSON.parse(variants);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(variants)) {
    return [];
  }

  return variants
    .map((variant) => {
      if (!variant || typeof variant !== "object") {
        return null;
      }
      const color =
        typeof variant.color === "string" ? variant.color.trim() : "";
      const capacity =
        typeof variant.capacity === "string" ? variant.capacity.trim() : "";
      const price = Number(variant.price);
      const stock =
        variant.stock === null || variant.stock === undefined
          ? null
          : Number(variant.stock);

      if (!Number.isFinite(price) || price < 0) {
        return null;
      }

      const normalizedStock =
        stock === null || Number.isNaN(stock) || stock < 0
          ? null
          : Math.floor(stock);

      return {
        color,
        capacity,
        price,
        stock: normalizedStock,
      };
    })
    .filter(Boolean);
};

const baseSchema = z.object({
  name: z.string().min(2, "Product name must contain at least 2 characters"),
  brand: z
    .string()
    .min(2, "Brand must contain at least 2 characters")
    .refine(
      (value) => PRODUCT_BRANDS.includes(value),
      "Brand is not supported"
    ),
  price: z.number().nonnegative("Price must be greater than or equal to 0"),
  oldPrice: z.number().nonnegative().optional(),
  stock: z.number().int().min(0).optional(),
  description: z.string().optional(),
});

const createSchema = baseSchema.extend({
  imageUrl: z.string().min(1, "Product image is required"),
});

const updateSchema = baseSchema
  .partial()
  .extend({
    imageUrl: z.string().min(1).optional(),
  })
  .refine(
    (payload) => Object.keys(payload).length > 0,
    "At least one field must be provided"
  );

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const applyProductPayload = (product, payload, extras = {}) => {
  if (payload.name !== undefined) {
    product.name = payload.name.trim();
  }
  if (payload.brand !== undefined) {
    product.brand = payload.brand.trim();
  }
  if (payload.price !== undefined) {
    product.price = payload.price;
  }
  if (payload.oldPrice !== undefined) {
    product.oldPrice = payload.oldPrice ?? null;
  }
  if (payload.description !== undefined) {
    product.description = payload.description ?? "";
  }
  if (payload.stock !== undefined) {
    product.stock = payload.stock ?? 0;
  }
  if (payload.imageUrl !== undefined) {
    product.imageUrl = payload.imageUrl;
    product.images = [payload.imageUrl];
  }

  if (extras.options) {
    product.options = {
      colors: extras.options.colors ?? [],
      capacities: extras.options.capacities ?? [],
    };
  }

  if (extras.variants) {
    product.variants = extras.variants;
  }

  return product;
};

export const adminListProducts = asyncHandler(async (req, res) => {
  const limitValue = numberOrUndefined(req.query.limit);
  const limit = Number.isFinite(limitValue) && limitValue > 0 ? limitValue : 100;

  const products = await Product.find()
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({
    success: true,
    data: products,
  });
});

export const adminCreateProduct = asyncHandler(async (req, res) => {
  const payload = createSchema.parse({
    ...req.body,
    price: Number(req.body.price),
    oldPrice: numberOrUndefined(req.body.oldPrice),
    stock: numberOrUndefined(req.body.stock),
  });

  const options = parseOptionsFromBody(req.body);
  const variants = parseVariantsFromBody(req.body.variants);

  const product = await Product.create({
    name: payload.name.trim(),
    brand: payload.brand.trim(),
    price: payload.price,
    oldPrice: payload.oldPrice ?? null,
    stock: payload.stock ?? 0,
    description: payload.description ?? "",
    imageUrl: payload.imageUrl,
    images: [payload.imageUrl],
    options,
    variants,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

export const adminUpdateProduct = asyncHandler(async (req, res) => {
  const payload = updateSchema.parse({
    ...req.body,
    price: numberOrUndefined(req.body.price),
    oldPrice: numberOrUndefined(req.body.oldPrice),
    stock: numberOrUndefined(req.body.stock),
  });

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const hasOptionsPayload =
    Object.prototype.hasOwnProperty.call(req.body, "options") ||
    Object.prototype.hasOwnProperty.call(req.body, "colors") ||
    Object.prototype.hasOwnProperty.call(req.body, "capacities");
  const hasVariantsPayload = Object.prototype.hasOwnProperty.call(
    req.body,
    "variants"
  );

  const options = hasOptionsPayload ? parseOptionsFromBody(req.body) : null;
  const variants = hasVariantsPayload
    ? parseVariantsFromBody(req.body.variants)
    : null;

  applyProductPayload(product, payload, {
    options: hasOptionsPayload ? options : undefined,
    variants: hasVariantsPayload ? variants : undefined,
  });
  await product.save();

  res.json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

export const adminDeleteProduct = asyncHandler(async (req, res) => {
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

export const adminUploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Product image is required",
    });
  }

  const imageUrl = `/uploads/products/${req.file.filename}`;

  res.status(201).json({
    success: true,
    imageUrl,
    data: { imageUrl },
  });
});

