import mongoose from "mongoose";
import slugify from "slugify";

const slugifyValue = (value = "") =>
  slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
    logoUrl: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },
    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: true },
  },
  { timestamps: true }
);

brandSchema.pre("validate", function handleSlug(next) {
  if (this.name) {
    this.name = this.name.trim();
  }
  if (this.slug) {
    this.slug = slugifyValue(this.slug);
  }
  if (!this.slug && this.name) {
    const fallback =
      slugifyValue(this.name) ||
      slugifyValue(this._id?.toString() || "brand-" + Date.now());
    this.slug = fallback;
  }
  next();
});

brandSchema.index({ order: 1, name: 1 });
brandSchema.index({ slug: 1 }, { unique: true });

export const Brand =
  mongoose.models.Brand || mongoose.model("Brand", brandSchema);

export default Brand;
