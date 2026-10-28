import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    icon: {
      type: String,
      default: "🍎",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    subCategories: {
      type: [String],
      default: [],
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true, trim: true });
  }
  next();
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
