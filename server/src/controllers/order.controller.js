import dayjs from "dayjs";
import { z } from "zod";

import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Review } from "../models/Review.js";

import {
  loadActivePromotions,
  resolveEffectivePricing,
  findVariantForSelection,
} from "../utils/pricing.js";
import {
  adjustUserLifetimeSpend,
  restockOrderInventory,
} from "../services/order.service.js";

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
    fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
    phone: z.string().min(8, "Số điện thoại không hợp lệ"),
    address: z.string().optional().default("Nhận tại showroom Ngọc Triết Store"),
  }),
  paymentMethod: z.enum(["cod", "store"]).default("cod"),
  summary: z
    .object({
      shipping: z
        .number()
        .min(0)
        .max(1_000_000)
        .optional(),
      items: z.number().min(0).optional(),
      grand: z.number().min(0).optional(),
    })
    .optional(),
}).superRefine((data, ctx) => {
  if (data.paymentMethod === "cod") {
    if (!data.shippingInfo.address || data.shippingInfo.address.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Vui lòng nhập địa chỉ giao hàng hợp lệ khi chọn thanh toán khi nhận hàng (COD)",
        path: ["shippingInfo", "address"],
      });
    }
  }
});

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const updateStatusSchema = z.object({
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

const getOrderStatusLabel = (status, paymentMethod) => {
  const isStore = paymentMethod === "store";
  if (isStore) {
    switch (status) {
      case "pending":
        return "Chờ chuẩn bị máy";
      case "processing":
      case "shipped":
        return "Máy sẵn sàng tại Showroom";
      case "delivered":
        return "Khách đã nhận máy";
      case "cancelled":
        return "Đã hủy giữ máy";
      default:
        return status;
    }
  }

  switch (status) {
    case "pending":
      return "Chờ xác nhận đơn";
    case "processing":
      return "Đang chuẩn bị hàng";
    case "shipped":
      return "Đang giao hàng (Ship COD)";
    case "delivered":
      return "Giao hàng thành công";
    case "cancelled":
      return "Đã hủy đơn";
    default:
      return status;
  }
};

const SHIPPING_FLAT_FEE = 30_000;

const variantFilter = (variant) =>
  variant?._id
    ? { _id: variant._id }
    : { color: variant?.color || "", capacity: variant?.capacity || "" };

const normalizeVariantValue = (value) =>
  value === undefined || value === null ? "" : value.toString().trim().toLowerCase();

const reserveInventory = async (product, quantity, variant) => {
  const usesVariantStock =
    variant?.stock !== null &&
    variant?.stock !== undefined &&
    Number.isFinite(Number(variant.stock));

  if (usesVariantStock) {
    const selected = variantFilter(variant);
    return Product.findOneAndUpdate(
      {
        _id: product._id,
        stock: { $gte: quantity },
        variants: {
          $elemMatch: { ...selected, stock: { $gte: quantity } },
        },
      },
      {
        $inc: {
          stock: -quantity,
          "variants.$[variant].stock": -quantity,
        },
      },
      {
        new: true,
        arrayFilters: [
          { ...Object.fromEntries(
            Object.entries(selected).map(([key, value]) => [`variant.${key}`, value])
          ), "variant.stock": { $gte: quantity } },
        ],
      }
    );
  }

  return Product.findOneAndUpdate(
    { _id: product._id, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    { new: true }
  );
};

const releaseInventoryReservation = async (reservation) => {
  if (reservation.variant) {
    const selected = variantFilter(reservation.variant);
    const result = await Product.updateOne(
      {
        _id: reservation.productId,
        variants: { $elemMatch: { ...selected, stock: { $ne: null } } },
      },
      {
        $inc: {
          stock: reservation.quantity,
          "variants.$[variant].stock": reservation.quantity,
        },
      },
      {
        arrayFilters: [
          Object.fromEntries(
            Object.entries(selected).map(([key, value]) => [`variant.${key}`, value])
          ),
        ],
      }
    );
    if (result.matchedCount > 0) return;
  }

  await Product.updateOne(
    { _id: reservation.productId },
    { $inc: { stock: reservation.quantity } }
  );
};

const DEFAULT_WARRANTY_MONTHS = 12;
const FALLBACK_WARRANTY_POLICY =
  Product?.schema?.paths?.warrantyPolicy?.options?.default ||
  "Lỗi 1 đổi 1 trong 10 ngày. Bảo hành 12 tháng. Không bảo hành khi rơi vỡ hoặc vào nước.";

const resolveWarrantyMonths = (product) => {
  if (!product) {
    return DEFAULT_WARRANTY_MONTHS;
  }

  const rawValue =
    typeof product.warrantyMonths === "number"
      ? product.warrantyMonths
      : Number(product.warrantyMonths);

  if (Number.isFinite(rawValue) && rawValue > 0) {
    return Math.max(1, Math.min(rawValue, 60));
  }

  return DEFAULT_WARRANTY_MONTHS;
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

const buildReviewKey = (orderId, productId) => {
  if (!orderId || !productId) {
    return null;
  }
  return `${orderId}:${productId}`;
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
    const orderId =
      doc._id && typeof doc._id.toString === "function"
        ? doc._id.toString()
        : order?._id?.toString?.() || "";
    doc.items = doc.items.map((item) => {
      const current =
        typeof item?.toObject === "function"
          ? item.toObject({ virtuals: true })
          : { ...item };
      const productId = getItemProductId(current);
      const reviewKey = buildReviewKey(orderId, productId);
      return {
        ...current,
        alreadyReviewed: reviewedSet
          ? (reviewKey && reviewedSet.has(reviewKey)) ||
            (productId && reviewedSet.has(productId)) ||
            Boolean(current.alreadyReviewed)
          : Boolean(current.alreadyReviewed),
      };
    });
  }

  return {
    ...doc,
    statusLabel: getOrderStatusLabel(doc.status, doc.paymentMethod),
  };
};

const populateOrder = (query) =>
  query
    .populate("user", "name email customerTier lifetimeSpend")
    .populate(
      "items.product",
      "name slug images finalPrice price oldPrice warrantyPolicy warrantyMonths brand"
    );

export const createOrder = asyncHandler(async (req, res) => {
  const payload = orderSchema.parse(req.body);

  const productIds = payload.items.map((item) =>
    item.productId ? item.productId.toString() : ""
  );
  const uniqueIds = Array.from(new Set(productIds.filter(Boolean)));
  const products = await Product.find({ _id: { $in: uniqueIds } });
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product])
  );

  if (productMap.size !== uniqueIds.length) {
    return res.status(400).json({
      success: false,
      message: "One or more products do not exist",
    });
  }

  let itemsTotal = 0;
  const orderItems = [];
  const reservations = [];
  const promotions = await loadActivePromotions();
  const customerTier = req.user?.customerTier;

  try {
    for (const item of payload.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        const error = new Error("Product not found");
        error.statusCode = 400;
        throw error;
      }

      const variantSelection = {
        color: item.color || "",
        capacity: item.capacity || "",
      };
      const selectedVariant = findVariantForSelection(
        product.variants,
        variantSelection
      );
      const variants = Array.isArray(product.variants) ? product.variants : [];
      const requiresColor = variants.some((variant) => normalizeVariantValue(variant.color));
      const requiresCapacity = variants.some((variant) => normalizeVariantValue(variant.capacity));
      const invalidVariantSelection =
        (requiresColor && !variantSelection.color) ||
        (requiresCapacity && !variantSelection.capacity) ||
        (variantSelection.color &&
          normalizeVariantValue(selectedVariant?.color) !==
            normalizeVariantValue(variantSelection.color)) ||
        (variantSelection.capacity &&
          normalizeVariantValue(selectedVariant?.capacity) !==
            normalizeVariantValue(variantSelection.capacity));

      if (variants.length > 0 && invalidVariantSelection) {
        const error = new Error("Vui lòng chọn đúng màu sắc và dung lượng sản phẩm");
        error.statusCode = 400;
        throw error;
      }

      const pricing = resolveEffectivePricing(product, {
        promotions,
        customerTier,
        variantSelection,
      });
      const reserved = await reserveInventory(
        product,
        item.quantity,
        selectedVariant
      );

      if (!reserved) {
        const error = new Error(
          `Sản phẩm ${product.name} hoặc biến thể đã chọn không đủ tồn kho`
        );
        error.statusCode = 409;
        throw error;
      }

      const reservation = {
        productId: product._id,
        quantity: item.quantity,
        variant: selectedVariant,
      };
      reservations.push(reservation);

      const price = pricing.finalPrice;
      const rawListedPrice = Number(product.oldPrice);
      const listedPrice =
        Number.isFinite(rawListedPrice) && rawListedPrice > 0
          ? rawListedPrice
          : pricing.originalPrice || pricing.basePrice || price;
      itemsTotal += price * item.quantity;

      orderItems.push({
        product: product._id,
        variantId: selectedVariant?._id || null,
        name: product.name,
        price,
        listedPrice,
        quantity: item.quantity,
        image: selectedVariant?.images?.[0] || product.images?.[0] || "",
        color: item.color || "",
        capacity: item.capacity || "",
      });
    }
  } catch (error) {
    await Promise.allSettled(
      reservations.map(releaseInventoryReservation)
    );
    throw error;
  }

  const isStorePickup = payload.paymentMethod === "store";
  const summaryShipping =
    typeof payload.summary?.shipping === "number"
      ? Math.max(0, Math.round(payload.summary.shipping))
      : null;
  const shippingFee = isStorePickup
    ? 0
    : summaryShipping !== null
    ? Math.max(SHIPPING_FLAT_FEE, summaryShipping)
    : SHIPPING_FLAT_FEE;
  const grandTotal = itemsTotal + shippingFee;

  const paymentMessage = isStorePickup
    ? "Nhận máy và thanh toán trực tiếp tại Ngọc Triết Store."
    : "Thanh toán khi nhận hàng (COD).";

  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingInfo: payload.shippingInfo,
      paymentMethod: payload.paymentMethod,
      payment: {
        provider: payload.paymentMethod,
        status: "pending",
        message: paymentMessage,
      },
      totals: {
        items: itemsTotal,
        shipping: shippingFee,
        grand: grandTotal,
      },
    });
  } catch (error) {
    await Promise.allSettled(
      reservations.map(releaseInventoryReservation)
    );
    throw error;
  }

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

  let reviewedSet = null;
  const orderIds = orders
    .map((order) =>
      order?._id && typeof order._id.toString === "function"
        ? order._id
        : null
    )
    .filter(Boolean);

  if (orderIds.length) {
    const reviewedDocs = await Review.find({
      user: req.user._id,
      order: { $in: orderIds },
    })
      .select("order product")
      .lean();
    reviewedSet = new Set(
      reviewedDocs
        .map((doc) =>
          buildReviewKey(
            doc.order && typeof doc.order.toString === "function"
              ? doc.order.toString()
              : doc.order?.toString?.(),
            doc.product && typeof doc.product.toString === "function"
              ? doc.product.toString()
              : doc.product?.toString?.()
          )
        )
        .filter((value) => typeof value === "string" && value.length > 0)
    );
  }

  res.json({
    success: true,
    data: orders.map((order) => buildOrderPayload(order, reviewedSet)),
  });
});

export const getMyWarrantyItems = asyncHandler(async (req, res) => {
  const orders = await populateOrder(
    Order.find({
      user: req.user._id,
      status: { $ne: "cancelled" },
    }).sort({ createdAt: -1 })
  );

  const now = dayjs();

  const warrantyItems = [];

  orders.forEach((order) => {
    const baseOrder =
      typeof order.toObject === "function"
        ? order.toObject({ virtuals: true })
        : { ...order };
    const activatedAt = baseOrder.createdAt
      ? new Date(baseOrder.createdAt)
      : new Date();
    const orderId = order._id?.toString?.() || "";
    const orderCode = orderId.slice(-8).toUpperCase();
    const orderStatus = baseOrder.status || "pending";

    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const currentItem =
        typeof item.toObject === "function" ? item.toObject() : item;
      const productDoc = currentItem.product;

      const productId = getItemProductId(currentItem);
      const productName =
        productDoc?.name || currentItem.name || "Sản phẩm không xác định";
      const productBrand = productDoc?.brand || "";
      const productSlug = productDoc?.slug || null;
      const warrantyPolicy =
        productDoc?.warrantyPolicy?.trim?.() || FALLBACK_WARRANTY_POLICY;
      const warrantyMonths = resolveWarrantyMonths(productDoc);
      const expiresAt = dayjs(activatedAt).add(warrantyMonths, "month");
      const primaryImage =
        (Array.isArray(productDoc?.images) && productDoc.images[0]) ||
        currentItem.image ||
        "";

      warrantyItems.push({
        orderId,
        orderCode,
        orderStatus,
        productId,
        productSlug,
        productName,
        productBrand,
        quantity: currentItem.quantity || 1,
        price:
          Number(currentItem.price ?? NaN) ||
          Number(productDoc?.finalPrice ?? NaN) ||
          Number(productDoc?.price ?? 0),
        color: currentItem.color || "",
        capacity: currentItem.capacity || "",
        warrantyPolicy,
        warrantyMonths,
        activatedAt: activatedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: expiresAt.isBefore(now) ? "expired" : "active",
        image: primaryImage,
      });
    });
  });

  res.json({
    success: true,
    data: {
      total: warrantyItems.length,
      active: warrantyItems.filter((item) => item.status === "active").length,
      expired: warrantyItems.filter((item) => item.status === "expired").length,
      items: warrantyItems,
    },
  });
});

export const lookupWarrantyByPhone = asyncHandler(async (req, res) => {
  const rawPhone = (req.query.phone || "").trim();
  if (!rawPhone) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập số điện thoại để tra cứu bảo hành.",
    });
  }

  const cleanPhone = rawPhone.replace(/\D/g, "");
  if (cleanPhone.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Số điện thoại không hợp lệ (tối thiểu 8-11 chữ số).",
    });
  }

  const localPhone = cleanPhone.startsWith("84") && cleanPhone.length > 9
    ? "0" + cleanPhone.slice(2)
    : cleanPhone;

  const phoneRegex = new RegExp(localPhone.replace(/^0/, "(0|\\+84)?"), "i");

  const orders = await populateOrder(
    Order.find({
      "shippingInfo.phone": { $regex: phoneRegex },
      status: { $ne: "cancelled" },
    }).sort({ createdAt: -1 })
  );

  const now = dayjs();
  const warrantyItems = [];
  let customerName = "";

  orders.forEach((order) => {
    const baseOrder =
      typeof order.toObject === "function"
        ? order.toObject({ virtuals: true })
        : { ...order };
    const activatedAt = baseOrder.createdAt
      ? new Date(baseOrder.createdAt)
      : new Date();
    const orderId = order._id?.toString?.() || "";
    const orderCode = orderId.slice(-8).toUpperCase();
    const orderStatus = baseOrder.status || "pending";
    if (!customerName && baseOrder.shippingInfo?.fullName) {
      customerName = baseOrder.shippingInfo.fullName;
    }

    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item) => {
      const currentItem =
        typeof item.toObject === "function" ? item.toObject() : item;
      const productDoc = currentItem.product;

      const productId = getItemProductId(currentItem);
      const productName =
        productDoc?.name || currentItem.name || "Sản phẩm không xác định";
      const productBrand = productDoc?.brand || "";
      const productSlug = productDoc?.slug || null;
      const warrantyPolicy =
        productDoc?.warrantyPolicy?.trim?.() || FALLBACK_WARRANTY_POLICY;
      const warrantyMonths = resolveWarrantyMonths(productDoc);
      const expiresAt = dayjs(activatedAt).add(warrantyMonths, "month");
      const primaryImage =
        (Array.isArray(productDoc?.images) && productDoc.images[0]) ||
        currentItem.image ||
        "";

      const diffDays = expiresAt.diff(now, "day");
      const isExpired = expiresAt.isBefore(now);

      warrantyItems.push({
        id: `${orderId}-${productId}`,
        orderId,
        orderCode,
        orderStatus,
        paymentMethod: baseOrder.paymentMethod || "cod",
        buyerName: baseOrder.shippingInfo?.fullName || "Khách hàng",
        buyerPhone: baseOrder.shippingInfo?.phone || rawPhone,
        productId,
        productSlug,
        productName,
        productBrand,
        quantity: currentItem.quantity || 1,
        price:
          Number(currentItem.price ?? NaN) ||
          Number(productDoc?.finalPrice ?? NaN) ||
          Number(productDoc?.price ?? 0),
        color: currentItem.color || "",
        capacity: currentItem.capacity || "",
        warrantyPolicy,
        warrantyMonths,
        activatedAt: activatedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: isExpired ? "expired" : "active",
        daysRemaining: Math.max(0, diffDays),
        image: primaryImage,
      });
    });
  });

  return res.json({
    success: true,
    data: {
      phone: rawPhone,
      customerName: customerName || "Quý khách",
      total: warrantyItems.length,
      active: warrantyItems.filter((item) => item.status === "active").length,
      expired: warrantyItems.filter((item) => item.status === "expired").length,
      items: warrantyItems,
    },
  });
});

export const getAllOrders = asyncHandler(async (req, res) => {
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
      message: "Đơn hàng đã được duyệt và không thể hủy",
    });
  }

  order.status = "cancelled";
  await order.save();

  await restockOrderInventory(order);
  await adjustUserLifetimeSpend(order.user, -order.totals.grand);

  const updated = await populateOrder(Order.findById(order._id));

  res.json({
    success: true,
    message: "Đơn hàng đã được hủy",
    data: buildOrderPayload(updated),
  });
});
