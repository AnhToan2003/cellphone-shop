import mongoose from "mongoose";
import slugify from "slugify";

const normalizeForSearch = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .toLowerCase()
    .trim();

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: null },
    finalPrice: { type: Number, default: null },
    discountPercent: { type: Number, default: 0 },
    description: { type: String, default: "" },
    warrantyPolicy: {
      type: String,
      default:
        "Lỗi 1 đổi 1 trong 10 ngày. Bảo hành 12 tháng. Không bảo hành khi rơi vỡ hoặc vào nước.",
      trim: true,
    },
    warrantyMonths: {
      type: Number,
      default: 12,
      min: 1,
      max: 60,
    },
    category: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    imageUrl: { type: String, required: true },
    images: {
      type: [String],
      default: [],
    },
    rating: { type: Number, default: 4.5 },
    ratingCount: { type: Number, default: 0 },
    specs: {
      type: Map,
      of: String,
      default: {},
    },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    options: {
      colors: { type: [String], default: [] },
      capacities: { type: [String], default: [] },
    },
    variants: {
      type: [
        {
          color: { type: String, default: "" },
          capacity: { type: String, default: "" },
          price: { type: Number, required: true, min: 0 },
          stock: { type: Number, default: null, min: 0 },
          images: { type: [String], default: [] },
        },
      ],
      default: [],
    },
    searchKeywords: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const buildSlug = (name, uniqueSuffix) =>
  slugify(`${name}-${uniqueSuffix}`, {
    lower: true,
    strict: true,
    trim: true,
  });

productSchema.pre("save", function setComputedFields(next) {
  const price = Number(this.price ?? 0);
  const oldPrice =
    this.oldPrice !== null && this.oldPrice !== undefined
      ? Number(this.oldPrice)
      : null;

  this.finalPrice = price;

  if (oldPrice && oldPrice > price) {
    this.discountPercent = Math.min(
      100,
      Math.max(0, Math.round(((oldPrice - price) / oldPrice) * 100))
    );
  } else {
    this.discountPercent = 0;
  }

  if (!this.images || this.images.length === 0) {
    this.images = this.imageUrl ? [this.imageUrl] : [];
  }

  const normalizedWarrantyMonths = Number(this.warrantyMonths ?? 12);
  if (!Number.isFinite(normalizedWarrantyMonths) || normalizedWarrantyMonths <= 0) {
    this.warrantyMonths = 12;
  } else {
    this.warrantyMonths = Math.max(
      1,
      Math.min(60, Math.floor(normalizedWarrantyMonths))
    );
  }

  if (!this.isModified("name") && this.slug) {
    this.searchKeywords = normalizeForSearch(
      `${this.name} ${this.brand} ${this.description}`
    );
    return next();
  }

  const baseSlug = slugify(this.name, { lower: true, strict: true, trim: true });
  const uniqueSuffix =
    this.slug && !this.isNew
      ? this.slug.split("-").pop()
      : this._id?.toString()?.slice(-6) || Date.now().toString(36);

  this.slug = buildSlug(baseSlug || "product", uniqueSuffix);
  this.searchKeywords = normalizeForSearch(
    `${this.name} ${this.brand} ${this.description}`
  );

  if (Array.isArray(this.options?.colors)) {
    this.options.colors = this.options.colors.map((color) => color.trim());
  }
  if (Array.isArray(this.options?.capacities)) {
    this.options.capacities = this.options.capacities.map((cap) => cap.trim());
  }

  if (Array.isArray(this.variants)) {
    this.variants = this.variants
      .map((variant) => {
        const color =
          typeof variant?.color === "string" ? variant.color.trim() : "";
        const capacity =
          typeof variant?.capacity === "string" ? variant.capacity.trim() : "";
        const price = Number(variant?.price ?? NaN);
        const stock =
          variant?.stock === null || variant?.stock === undefined
            ? null
            : Number(variant.stock);
        const images = Array.isArray(variant?.images)
          ? variant.images
              .map((image) =>
                typeof image === "string" ? image.trim() : ""
              )
              .filter((image) => image.length > 0)
          : [];

        return {
          color,
          capacity,
          price,
          stock:
            stock === null || Number.isNaN(stock) || stock < 0
              ? null
              : Math.floor(stock),
          images,
        };
      })
      .filter(
        (variant) =>
          Number.isFinite(variant.price) && variant.price >= 0
      );
  } else {
    this.variants = [];
  }

  const variantPrices = this.variants
    .map((variant) => Number(variant.price))
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (variantPrices.length) {
    const lowestVariantPrice = Math.min(...variantPrices);
    if (!Number.isFinite(this.price) || this.price <= 0) {
      this.price = lowestVariantPrice;
    }
    this.finalPrice = Math.min(this.price, lowestVariantPrice);
  }

  next();
});

export const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
