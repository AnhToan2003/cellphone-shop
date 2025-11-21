import { z } from "zod";

import { Product } from "../models/Product.js";

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

const normalizeImageList = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter((value) => value.length > 0);
      }
    } catch {
      return [input.trim()];
    }
  }
  return [];
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
      const images = normalizeImageList(variant.images);

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
        images,
      };
    })
    .filter(Boolean);
};

const DEFAULT_WARRANTY_POLICY =
  "Lỗi 1 đổi 1 trong 10 ngày. Bảo hành 12 tháng. Không bảo hành khi rơi vỡ hoặc vào nước.";

const sanitizeWarrantyPolicy = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length) {
      return trimmed;
    }
  }
  return DEFAULT_WARRANTY_POLICY;
};

const sanitizeWarrantyMonths = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 12;
  }
  return Math.max(1, Math.min(Math.floor(numeric), 60));
};

const baseSchema = z.object({
  name: z.string().min(2, "Product name must contain at least 2 characters"),
  brand: z
    .string()
    .min(2, "Brand must contain at least 2 characters"),
  price: z.number().nonnegative("Price must be greater than or equal to 0"),
  oldPrice: z.number().nonnegative().optional(),
  stock: z.number().int().min(0).optional(),
  description: z.string().optional(),
  warrantyPolicy: z.string().max(1024).optional(),
  warrantyMonths: z.number().int().min(1).max(60).optional(),
  images: z.array(z.string()).optional(),
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
  if (payload.warrantyPolicy !== undefined) {
    product.warrantyPolicy = sanitizeWarrantyPolicy(payload.warrantyPolicy);
  }
  if (payload.warrantyMonths !== undefined) {
    product.warrantyMonths = sanitizeWarrantyMonths(payload.warrantyMonths);
  }
  if (payload.stock !== undefined) {
    product.stock = payload.stock ?? 0;
  }
  if (payload.images !== undefined) {
    const sanitizedImages = payload.images
      .map((image) => (typeof image === "string" ? image.trim() : ""))
      .filter((image) => image.length > 0);
    product.images = sanitizedImages;
  }
  if (payload.imageUrl !== undefined) {
    const trimmedImage = payload.imageUrl.trim();
    product.imageUrl = trimmedImage;
    if (!Array.isArray(product.images) || !product.images.length) {
      product.images = [trimmedImage];
    } else if (!product.images.includes(trimmedImage)) {
      product.images = [trimmedImage, ...product.images.filter((img) => img !== trimmedImage)];
    }
  } else if (
    (!product.imageUrl || !product.imageUrl.length) &&
    Array.isArray(product.images) &&
    product.images.length
  ) {
    product.imageUrl = product.images[0];
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
    warrantyMonths: numberOrUndefined(req.body.warrantyMonths),
  });

  const options = parseOptionsFromBody(req.body);
  const variants = parseVariantsFromBody(req.body.variants);
  const normalizedImages = normalizeImageList(req.body.images);
  const gallery = normalizedImages.length
    ? normalizedImages
    : [payload.imageUrl];
  const coverImage = gallery[0] || payload.imageUrl;

  const product = await Product.create({
    name: payload.name.trim(),
    brand: payload.brand.trim(),
    price: payload.price,
    oldPrice: payload.oldPrice ?? null,
    stock: payload.stock ?? 0,
    description: payload.description ?? "",
    warrantyPolicy: sanitizeWarrantyPolicy(payload.warrantyPolicy),
    warrantyMonths: sanitizeWarrantyMonths(payload.warrantyMonths),
    imageUrl: coverImage,
    images: gallery,
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
    warrantyMonths: numberOrUndefined(req.body.warrantyMonths),
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
