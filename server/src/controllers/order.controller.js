import { z } from "zod";

import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";
import { User } from "../models/User.js";
import {
  loadActivePromotions,
  resolveEffectivePricing,
} from "../utils/pricing.js";

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
        color: z.string().optional().default(""),
        capacity: z.string().optional().default(""),
      })
    )
    .min(1, "Cart is empty"),
  shippingInfo: z.object({
    fullName: z.string().min(2, "Full name must contain at least 2 characters"),
    phone: z.string().min(8, "Phone number is not valid"),
    address: z.string().min(5, "Address must contain at least 5 characters"),
  }),
  paymentMethod: z.enum(["cod", "mock"]).default("cod"),
});

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const updateStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

const ORDER_STATUS_LABELS = {
  pending: "Chờ xác nhận",
  processing: "Đã duyệt",
  shipped: "Đang giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
};

const getItemProductId = (item = {}) => {
  const productRef = item.product ?? item;
  if (!productRef) return null;

  if (typeof productRef === "string") {
    return productRef;
  }

  if (typeof productRef === "object") {
    if (productRef._id) {
      return productRef._id.toString();
    }
    if (productRef.id) {
      return productRef.id.toString();
    }
    if (
      typeof productRef.toString === "function" &&
      productRef.toString !== Object.prototype.toString
    ) {
      const value = productRef.toString();
      if (value && value !== "[object Object]") {
        return value;
      }
    }
  }

  return null;
};
const buildOrderPayload = (order, reviewedProducts) => {
  const doc =
    typeof order.toObject === "function"
      ? order.toObject({ virtuals: true })
      : { ...order };

  let reviewedSet = null;
  if (reviewedProducts) {
    if (reviewedProducts instanceof Set) {
      reviewedSet = new Set(
        Array.from(reviewedProducts, (value) => value.toString())
      );
    } else if (Array.isArray(reviewedProducts)) {
      reviewedSet = new Set(
        reviewedProducts.map((value) => value.toString())
      );
    } else {
      reviewedSet = new Set([reviewedProducts.toString()]);
    }
  }

  if (Array.isArray(doc.items)) {
    doc.items = doc.items.map((item) => {
      const current =
        typeof item?.toObject === "function"
          ? item.toObject({ virtuals: true })
          : { ...item };
      const productId = getItemProductId(current);
      return {
        ...current,
        alreadyReviewed: reviewedSet
          ? productId
            ? reviewedSet.has(productId)
            : false
          : Boolean(current.alreadyReviewed),
      };
    });
  }

  return {
    ...doc,
    statusLabel: ORDER_STATUS_LABELS[doc.status] || doc.status,
  };
};const populateOrder = (query) =>
  query
    .populate("user", "name email customerTier lifetimeSpend")
    .populate("items.product", "name slug images finalPrice price oldPrice");

const restockOrderInventory = async (order) => {
  await Promise.all(
    order.items.map(async (item) => {
      const productId =
        item?.product && item.product._id
          ? item.product._id
          : item?.product;
      if (!productId) return;
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: item.quantity } },
        { new: false }
      );
    })
  );
};

const adjustUserLifetimeSpend = async (userId, amount) => {
  if (!userId || !amount) return;
  const userDoc = await User.findById(userId);
  if (!userDoc) return;
  const nextValue = Math.max(
    0,
    Number(userDoc.lifetimeSpend || 0) + Number(amount)
  );
  userDoc.lifetimeSpend = nextValue;
  if (typeof userDoc.recalculateTier === "function") {
    userDoc.recalculateTier();
  }
  await userDoc.save();
};

export const createOrder = asyncHandler(async (req, res) => {
  const payload = orderSchema.parse(req.body);

  const productIds = payload.items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  if (productMap.size !== productIds.length) {
    return res.status(400).json({
      success: false,
      message: "One or more products do not exist",
    });
  }

  let itemsTotal = 0;
  const orderItems = [];
  const promotions = await loadActivePromotions();
  const customerTier = req.user?.customerTier;

  for (const item of payload.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Product ${product.name} is out of stock`,
      });
    }

    const pricing = resolveEffectivePricing(product, {
      promotions,
      customerTier,
    });
    const price = pricing.finalPrice;
    const lineTotal = price * item.quantity;
    itemsTotal += lineTotal;

    product.stock = Math.max(product.stock - item.quantity, 0);
    await product.save();

    orderItems.push({
      product: product._id,
      name: product.name,
      price,
      quantity: item.quantity,
      image: product.images?.[0] || "",
      color: item.color || "",
      capacity: item.capacity || "",
    });
  }

  const shippingFee = itemsTotal >= 20000000 ? 0 : 30000;
  const grandTotal = itemsTotal + shippingFee;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingInfo: payload.shippingInfo,
    paymentMethod: payload.paymentMethod,
    totals: {
      items: itemsTotal,
      shipping: shippingFee,
      grand: grandTotal,
    },
  });

  await adjustUserLifetimeSpend(req.user._id, grandTotal);

  const hydrated = await populateOrder(Order.findById(order._id));
  const responseOrder = buildOrderPayload(hydrated);

  res.status(201).json({
    success: true,
    message: "Order placed successfully",
    data: responseOrder,
  });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await populateOrder(
    Order.find({ user: req.user._id }).sort({ createdAt: -1 })
  );

  const productIds = new Set();
  orders.forEach((order) => {
    const items = Array.isArray(order?.items) ? order.items : [];
    items.forEach((item) => {
      const current =
        typeof item?.toObject === "function"
          ? item.toObject({ virtuals: true })
          : item;
      const productId = getItemProductId(current);
      if (productId) {
        productIds.add(productId);
      }
    });
  });

  let reviewedSet = null;
  if (productIds.size) {
    const reviewedDocs = await Review.find({
      user: req.user._id,
      product: { $in: Array.from(productIds) },
    }).select("product");
    reviewedSet = new Set(
      reviewedDocs
        .map((doc) =>
          doc.product && typeof doc.product.toString === "function"
            ? doc.product.toString()
            : doc.product
        )
        .filter(Boolean)
    );
  }

  res.json({
    success: true,
    data: orders.map((order) => buildOrderPayload(order, reviewedSet)),
  });
});export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await populateOrder(
    Order.find().sort({ createdAt: -1 })
  );

  res.json({
    success: true,
    data: orders.map((order) => buildOrderPayload(order)),
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = updateStatusSchema.parse(req.body);

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  const previousStatus = order.status;

  if (order.status === status) {
    const hydrated = await populateOrder(Order.findById(order._id));

    return res.json({
      success: true,
      message: "Order status unchanged",
      data: buildOrderPayload(hydrated),
    });
  }

  if (["cancelled", "delivered"].includes(order.status)) {
    return res.status(400).json({
      success: false,
      message: "Không thể chỉnh sửa đơn hàng đã hoàn tất",
    });
  }

  order.status = status;
  await order.save();

  if (status === "cancelled" && previousStatus !== "cancelled") {
    await restockOrderInventory(order);
    await adjustUserLifetimeSpend(order.user, -order.totals.grand);
  }

  const updated = await populateOrder(Order.findById(order._id));

  res.json({
    success: true,
    message: "Cập nhật trạng thái đơn hàng",
    data: buildOrderPayload(updated),
  });
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (order.status !== "pending") {
    return res.status(400).json({
      success: false,
      message: "ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t vÃ  khÃ´ng thá»ƒ há»§y",
    });
  }

  order.status = "cancelled";
  await order.save();

  await restockOrderInventory(order);
  await adjustUserLifetimeSpend(order.user, -order.totals.grand);

  const updated = await populateOrder(Order.findById(order._id));

  res.json({
    success: true,
    message: "ÄÆ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c há»§y",
    data: buildOrderPayload(updated),
  });
});
















