import mongoose from "mongoose";

const homeCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: "", trim: true },
    gradient: {
      type: String,
      default: "from-slate-900 via-slate-700 to-slate-500",
      trim: true,
    },
    searchKeyword: { type: String, default: "", trim: true },
    productSlug: { type: String, default: "", trim: true },
    productSlugs: {
      type: [String],
      default: [],
      set: (values) => {
        if (!Array.isArray(values)) return [];
        const seen = new Set();
        return values
          .map((value) => (value || "").trim())
          .filter((value) => {
            if (!value || seen.has(value)) return false;
            seen.add(value);
            return true;
          })
          .slice(0, 12);
      },
    },
    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: true },
  },
  { timestamps: true }
);

homeCategorySchema.index({ order: 1, createdAt: 1 });

export const HomeCategory =
  mongoose.models.HomeCategory ||
  mongoose.model("HomeCategory", homeCategorySchema);

export default HomeCategory;
