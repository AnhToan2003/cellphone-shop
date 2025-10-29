import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import {
  CUSTOMER_TIERS,
  determineCustomerTier,
} from "../constants/customer.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
    },
    usernameLower: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      default: function buildUsernameLower() {
        return this.username ? this.username.trim().toLowerCase() : undefined;
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    lifetimeSpend: {
      type: Number,
      default: 0,
      min: 0,
    },
    customerTier: {
      type: String,
      enum: Object.values(CUSTOMER_TIERS),
      default: CUSTOMER_TIERS.BRONZE,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.password;
        delete ret.__v;
        delete ret.usernameLower;
        return ret;
      },
    },
  }
);

userSchema.methods.recalculateTier = function recalculateTier() {
  this.customerTier = determineCustomerTier(this.lifetimeSpend || 0);
};

userSchema.pre("save", async function handleSave(next) {
  if (this.isModified("username")) {
    this.username = this.username.trim();
    this.usernameLower = this.username.toLowerCase();
  }

  if (this.isModified("email")) {
    this.email = this.email.trim().toLowerCase();
  }

  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  if (
    this.isNew ||
    this.isModified("lifetimeSpend") ||
    !this.customerTier
  ) {
    this.recalculateTier();
  }

  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);

export default User;
