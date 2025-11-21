import Brand from "../models/Brand.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const formatResponse = (data) => ({
  success: true,
  data,
});

const sortQuery = { order: 1, name: 1 };

const toOptionalString = (value) =>
  typeof value === "string" ? value.trim() : undefined;

const toOptionalNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export const listBrands = asyncHandler(async (_req, res) => {
  const brands = await Brand.find({ isFeatured: true }).sort(sortQuery).lean();
  res.json(formatResponse(brands));
});

export const adminListBrands = asyncHandler(async (_req, res) => {
  const brands = await Brand.find().sort(sortQuery).lean();
  res.json(formatResponse(brands));
});

export const adminCreateBrand = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.name || !payload.name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Brand name is required",
    });
  }

  const brand = await Brand.create({
    name: payload.name.trim(),
    slug: toOptionalString(payload.slug),
    description: toOptionalString(payload.description) || "",
    country: toOptionalString(payload.country) || "",
    logoUrl: toOptionalString(payload.logoUrl) || "",
    website: toOptionalString(payload.website) || "",
    order: toOptionalNumber(payload.order) ?? 0,
    isFeatured:
      payload.isFeatured === undefined ? true : Boolean(payload.isFeatured),
  });

  res.status(201).json(formatResponse(brand));
});

export const adminUpdateBrand = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: "Brand not found",
    });
  }

  const name = toOptionalString(payload.name);
  if (name !== undefined) {
    brand.name = name;
  }

  const slug = toOptionalString(payload.slug);
  if (slug !== undefined) {
    brand.slug = slug;
  }

  const description = toOptionalString(payload.description);
  if (description !== undefined) {
    brand.description = description;
  }

  const country = toOptionalString(payload.country);
  if (country !== undefined) {
    brand.country = country;
  }

  const logoUrl = toOptionalString(payload.logoUrl);
  if (logoUrl !== undefined) {
    brand.logoUrl = logoUrl;
  }

  const website = toOptionalString(payload.website);
  if (website !== undefined) {
    brand.website = website;
  }

  const order = toOptionalNumber(payload.order);
  if (order !== undefined) {
    brand.order = order;
  }

  if (payload.isFeatured !== undefined) {
    brand.isFeatured = Boolean(payload.isFeatured);
  }

  await brand.save();
  res.json(formatResponse(brand));
});

export const adminDeleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return res.status(404).json({
      success: false,
      message: "Brand not found",
    });
  }
  await brand.deleteOne();
  res.json({ success: true });
});

export default {
  listBrands,
  adminListBrands,
  adminCreateBrand,
  adminUpdateBrand,
  adminDeleteBrand,
};
