import mongoose from "mongoose";

import { CUSTOMER_TIERS } from "../constants/customer.js";

const promotionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    scope: {
      type: String,
      enum: ["global", "product", "customerTier"],
      required: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    startAt: {
      type: Date,
      default: () => new Date(),
    },
    endAt: {
      type: Date,
      default: null,
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    customerTiers: [
      {
        type: String,
        enum: Object.values(CUSTOMER_TIERS),
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

promotionSchema.index({ scope: 1, isActive: 1, startAt: 1, endAt: 1 });

export const Promotion =
  mongoose.models.Promotion || mongoose.model("Promotion", promotionSchema);

export default Promotion;
