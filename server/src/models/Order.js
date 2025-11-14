import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    image: String,
    color: {
      type: String,
      default: "",
      trim: true,
    },
    capacity: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const shippingInfoSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const totalsSchema = new mongoose.Schema(
  {
    items: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
    },
    grand: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: "cod",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "awaiting", "completed", "failed"],
      default: "pending",
    },
    reference: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      default: "",
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    qrData: {
      type: String,
      default: "",
      trim: true,
    },
    transferContent: {
      type: String,
      default: "",
      trim: true,
    },
    quickLink: {
      type: String,
      default: "",
      trim: true,
    },
    transactionNo: {
      type: String,
      default: "",
      trim: true,
    },
    bankCode: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (value) => value.length > 0,
    },
    shippingInfo: {
      type: shippingInfoSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "vietqr"],
      default: "cod",
    },
    payment: {
      type: paymentSchema,
      default: () => ({
        provider: "cod",
        status: "pending",
        qrData: "",
      }),
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    totals: {
      type: totalsSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ user: 1, createdAt: -1 });

export const Order =
  mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;






