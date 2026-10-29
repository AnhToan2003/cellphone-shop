import Category from "../models/Category.js";
import { Product } from "../models/Product.js";
import slugify from "slugify";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const formatResponse = (data) => ({
  success: true,
  data,
});

export const listCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ order: 1, name: 1 }).lean();
  res.set("Cache-Control", "public, max-age=60, s-maxage=300, stale-while-revalidate=86400");
  res.json(formatResponse(categories));
});

export const adminListCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ order: 1, name: 1 }).lean();

  // Attach product counts for each category
  const counts = await Product.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
      },
    },
  ]);

  const countMap = {};
  counts.forEach((c) => {
    if (c._id) countMap[c._id.toLowerCase()] = c.count;
  });

  const enriched = categories.map((cat) => ({
    ...cat,
    productCount: countMap[cat.name.toLowerCase()] || 0,
  }));

  res.json(formatResponse(enriched));
});

export const adminCreateCategory = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  if (!payload.name || !payload.name.trim()) {
    return res.status(400).json({
      success: false,
      message: "Tên danh mục là bắt buộc",
    });
  }

  const name = payload.name.trim();
  const existing = await Category.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
  });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `Danh mục "${name}" đã tồn tại`,
    });
  }

  let subCategories = [];
  if (Array.isArray(payload.subCategories)) {
    subCategories = payload.subCategories.map((s) => s.trim()).filter(Boolean);
  } else if (typeof payload.subCategories === "string") {
    subCategories = payload.subCategories
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const category = await Category.create({
    name,
    slug: payload.slug ? slugify(payload.slug, { lower: true, strict: true }) : undefined,
    icon: payload.icon?.trim() || "🍎",
    description: payload.description?.trim() || "",
    subCategories: Array.from(new Set(subCategories)),
    order: Number.isFinite(Number(payload.order)) ? Number(payload.order) : 0,
    isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
  });

  res.status(201).json(formatResponse(category));
});

export const adminUpdateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy danh mục",
    });
  }

  const payload = req.body || {};
  if (payload.name && payload.name.trim() !== category.name) {
    const existing = await Category.findOne({
      _id: { $ne: category._id },
      name: { $regex: new RegExp(`^${payload.name.trim()}$`, "i") },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Danh mục "${payload.name.trim()}" đã tồn tại`,
      });
    }
    category.name = payload.name.trim();
  }

  if (payload.slug) {
    category.slug = slugify(payload.slug, { lower: true, strict: true });
  } else if (payload.name) {
    category.slug = slugify(category.name, { lower: true, strict: true });
  }

  if (payload.icon !== undefined) category.icon = payload.icon.trim() || "🍎";
  if (payload.description !== undefined) category.description = payload.description.trim();
  if (payload.order !== undefined && Number.isFinite(Number(payload.order))) {
    category.order = Number(payload.order);
  }
  if (payload.isActive !== undefined) {
    category.isActive = Boolean(payload.isActive);
  }

  if (payload.subCategories !== undefined) {
    let subCategories = [];
    if (Array.isArray(payload.subCategories)) {
      subCategories = payload.subCategories.map((s) => s.trim()).filter(Boolean);
    } else if (typeof payload.subCategories === "string") {
      subCategories = payload.subCategories
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    category.subCategories = Array.from(new Set(subCategories));
  }

  await category.save();
  res.json(formatResponse(category));
});
export const adminDeleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy danh mục",
    });
  }

  await category.deleteOne();
  res.json({
    success: true,
    message: "Đã xóa danh mục thành công",
  });
});

export const adminAddSubCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy danh mục",
    });
  }

  const { subCategory } = req.body || {};
  if (!subCategory || !subCategory.trim()) {
    return res.status(400).json({
      success: false,
      message: "Tên danh mục con là bắt buộc",
    });
  }

  const cleanSub = subCategory.trim();
  const exists = category.subCategories.some(
    (s) => s.toLowerCase() === cleanSub.toLowerCase()
  );
  if (exists) {
    return res.status(400).json({
      success: false,
      message: `Dòng sản phẩm "${cleanSub}" đã tồn tại trong danh mục này`,
    });
  }

  category.subCategories.push(cleanSub);
  await category.save();

  res.json(formatResponse(category));
});

export const adminDeleteSubCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy danh mục",
    });
  }

  const { subCategory } = req.body || {};
  if (!subCategory) {
    return res.status(400).json({
      success: false,
      message: "Tên danh mục con cần xóa là bắt buộc",
    });
  }

  category.subCategories = category.subCategories.filter(
    (s) => s.toLowerCase() !== subCategory.trim().toLowerCase()
  );
  await category.save();

  res.json(formatResponse(category));
});
