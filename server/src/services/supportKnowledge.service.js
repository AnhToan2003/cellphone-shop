// src/services/supportKnowledge.service.js
import { Promotion } from "../models/Promotion.js";
import Brand from "../models/Brand.js";
import HomeCategory from "../models/HomeCategory.js";

const SHIPPING_FLAT_FEE = Number(process.env.SHIPPING_FLAT_FEE ?? 30_000);
const WARRANTY_DEFAULT_MONTHS = Number(process.env.WARRANTY_DEFAULT_MONTHS ?? 12);
const RETURN_WINDOW_DAYS = Number(process.env.RETURN_WINDOW_DAYS ?? 10);

const MAX_PROMOS = Number(process.env.KB_MAX_PROMOS ?? 5);
const MAX_BRANDS = Number(process.env.KB_MAX_BRANDS ?? 8);
const MAX_CATEGORIES = Number(process.env.KB_MAX_CATEGORIES ?? 5);
const MAX_CONTEXT_CHARS = Number(process.env.KB_MAX_CONTEXT_CHARS ?? 1500);
const CACHE_TTL_MS = Number(process.env.KB_CACHE_TTL_MS ?? 60_000);

let cache = { value: "", expiresAt: 0 };

const safe = (value) => (value == null ? "" : String(value).trim());

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const clampText = (text, limit = MAX_CONTEXT_CHARS) => {
  if (!text || text.length <= limit) return text || "";
  const slice = text.slice(0, limit);
  const lastBreak = Math.max(slice.lastIndexOf("\n"), slice.lastIndexOf(". "));
  const trimmed = lastBreak > 200 ? slice.slice(0, lastBreak) : slice;
  return `${trimmed.trim()}...`;
};

const buildPromotionSnippet = (promotion = {}) => {
  const scopeMap = {
    global: "Toàn bộ cửa hàng",
    product: "Theo sản phẩm",
    customerTier: "Theo hạng thành viên",
  };
  const scope = scopeMap[promotion.scope] || "Chung";
  const percent = Number(promotion.discountPercent);
  const discount = Number.isFinite(percent)
    ? `${Math.max(0, Math.min(100, percent))}%`
    : "ưu đãi";
  const note = safe(promotion.description);
  return `- ${safe(promotion.name) || "Khuyến mãi"} (${scope}): giảm ${discount}${
    note ? ` - ${note}` : ""
  }`;
};

const buildBrandSnippet = (brand = {}) => {
  const name = safe(brand.name) || "Thương hiệu";
  const country = safe(brand.country);
  return `- ${name}${country ? ` (${country})` : ""}`;
};

const buildCategorySnippet = (category = {}) => {
  const title = safe(category.title) || "Danh mục";
  const subtitle = safe(category.subtitle) || "Sản phẩm nổi bật";
  return `- ${title}: ${subtitle}`;
};

export const buildSupportKnowledge = async ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && cache.value && cache.expiresAt > now) {
    return cache.value;
  }

  try {
    const [promotions, brands, categories] = await Promise.all([
      Promotion.find({ isActive: true }).sort({ createdAt: -1 }).limit(MAX_PROMOS).lean(),
      Brand.find({ isFeatured: true }).sort({ order: 1, name: 1 }).limit(MAX_BRANDS).lean(),
      HomeCategory.find({ isFeatured: true })
        .sort({ order: 1, createdAt: 1 })
        .limit(MAX_CATEGORIES)
        .lean(),
    ]);

    const sections = [];

    sections.push(
      [
        "Chính sách chung:",
        `- Phí giao hàng nội tỉnh: ${formatCurrency(
          SHIPPING_FLAT_FEE
        )} (có thể miễn phí theo đợt khuyến mãi).`,
        "- Thanh toán hỗ trợ: COD, chuyển khoản VietQR (xác nhận trong 5-10 phút).",
        `- Bảo hành tiêu chuẩn: ${WARRANTY_DEFAULT_MONTHS} tháng, đổi mới NSX trong ${RETURN_WINDOW_DAYS} ngày.`,
        "- CSKH hỗ trợ trade-in, nâng cấp gói bảo hành và chương trình khách hàng thân thiết.",
      ].join("\n")
    );

    sections.push(
      [
        "Thương hiệu nổi bật:",
        brands.length
          ? brands.map(buildBrandSnippet).join("\n")
          : "- Danh sách thương hiệu đang được cập nhật.",
      ].join("\n")
    );

    sections.push(
      [
        "Danh mục gợi ý trên trang chủ:",
        categories.length
          ? categories.map(buildCategorySnippet).join("\n")
          : "- Chưa có danh mục nào được cấu hình.",
      ].join("\n")
    );

    sections.push(
      [
        "Khuyến mãi đang chạy:",
        promotions.length
          ? promotions.map(buildPromotionSnippet).join("\n")
          : "- Hiện chưa có chương trình khuyến mãi công bố.",
      ].join("\n")
    );

    const raw = sections.filter(Boolean).join("\n\n");
    const clamped = clampText(raw);

    cache = { value: clamped, expiresAt: now + CACHE_TTL_MS };
    return clamped;
  } catch (error) {
    console.warn("buildSupportKnowledge error:", error.message);
    cache = { value: "", expiresAt: now + 15_000 };
    return "";
  }
};

export default buildSupportKnowledge;
