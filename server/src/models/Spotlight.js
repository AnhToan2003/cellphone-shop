import mongoose from "mongoose";

const spotlightSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    badge: {
      type: String,
      default: "SẢN PHẨM NỔI BẬT",
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "Sở hữu ngay flagship mới nhất với ưu đãi đặc quyền và bảo hành chu đáo tại Ngọc Triết Store.",
      trim: true,
    },
    customPrice: {
      type: Number,
      default: null,
    },
    customOldPrice: {
      type: Number,
      default: null,
    },
    customImage: {
      type: String,
      default: "",
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
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

export const Spotlight =
  mongoose.models.Spotlight || mongoose.model("Spotlight", spotlightSchema);

export default Spotlight;
