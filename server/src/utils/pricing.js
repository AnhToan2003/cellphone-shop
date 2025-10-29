import Promotion from "../models/Promotion.js";

export const isPromotionActive = (promotion, now = new Date()) => {
  if (!promotion?.isActive) return false;
  const startAt = promotion.startAt ? new Date(promotion.startAt) : null;
  const endAt = promotion.endAt ? new Date(promotion.endAt) : null;
  if (startAt && startAt > now) return false;
  if (endAt && endAt < now) return false;
  return true;
};

export const loadActivePromotions = async () => {
  const now = new Date();
  const promotions = await Promotion.find({
    isActive: true,
    $or: [{ endAt: null }, { endAt: { $gte: now } }],
  })
    .sort({ discountPercent: -1, createdAt: -1 })
    .lean();

  return promotions.filter((promotion) => isPromotionActive(promotion, now));
};

const promotionAppliesToProduct = (promotion, productId) => {
  if (promotion.scope === "global") {
    return true;
  }
  if (promotion.scope === "product") {
    return promotion.products?.some?.(
      (id) => id?.toString?.() === productId.toString()
    );
  }
  return false;
};

const promotionAppliesToTier = (promotion, tier) => {
  if (promotion.scope !== "customerTier") {
    return promotion.scope === "global";
  }
  if (!tier) return false;
  return promotion.customerTiers?.includes?.(tier);
};

const normalizeVariantValue = (value) =>
  value === undefined || value === null
    ? ""
    : value.toString().trim().toLowerCase();

const findVariantForSelection = (variants = [], selection = {}) => {
  if (!Array.isArray(variants) || variants.length === 0) {
    return null;
  }

  const targetColor = normalizeVariantValue(selection.color);
  const targetCapacity = normalizeVariantValue(selection.capacity);

  const normalized = variants.map((variant) => ({
    raw: variant,
    color: normalizeVariantValue(variant?.color),
    capacity: normalizeVariantValue(variant?.capacity),
  }));

  const directMatch = normalized.find(
    ({ color, capacity }) => color === targetColor && capacity === targetCapacity
  );
  if (directMatch) return directMatch.raw;

  if (targetCapacity) {
    const capacityMatch = normalized.find(
      ({ color, capacity }) => !color && capacity === targetCapacity
    );
    if (capacityMatch) return capacityMatch.raw;
  }

  if (targetColor) {
    const colorMatch = normalized.find(
      ({ color, capacity }) => color === targetColor && !capacity
    );
    if (colorMatch) return colorMatch.raw;
  }

  const defaultVariant = normalized.find(
    ({ color, capacity }) => !color && !capacity
  );
  return defaultVariant ? defaultVariant.raw : null;
};

export const resolveBestPromotion = ({
  promotions = [],
  productId,
  customerTier,
}) => {
  let bestPromotion = null;

  promotions.forEach((promotion) => {
    let applies = false;
    if (promotion.scope === "global") {
      applies = true;
    } else if (promotion.scope === "product") {
      applies = promotionAppliesToProduct(promotion, productId);
    } else if (promotion.scope === "customerTier") {
      applies = promotionAppliesToTier(promotion, customerTier);
    }

    if (!applies) {
      return;
    }

    if (
      !bestPromotion ||
      promotion.discountPercent > bestPromotion.discountPercent
    ) {
      bestPromotion = promotion;
    }
  });

  return bestPromotion;
};

export const resolveEffectivePricing = (
  product,
  { promotions = [], customerTier, variantSelection } = {}
) => {
  const productBasePrice = Number(product?.price ?? 0);
  const productBaseFinal = Number(
    product?.finalPrice ?? (productBasePrice > 0 ? productBasePrice : 0)
  );
  const discountFactor =
    productBasePrice > 0 && productBaseFinal > 0
      ? Math.max(0, productBaseFinal) / productBasePrice
      : 1;

  const variant = variantSelection
    ? findVariantForSelection(product?.variants, variantSelection)
    : null;

  const variantBasePrice = Number(
    variant?.price !== undefined && variant?.price !== null
      ? variant.price
      : productBasePrice
  );

  const baseBeforePromotion =
    discountFactor > 0 && discountFactor < 1
      ? Math.max(0, Math.round(variantBasePrice * discountFactor))
      : variantBasePrice;

  const base =
    baseBeforePromotion > 0 ? baseBeforePromotion : variantBasePrice;

  const original =
    typeof product?.oldPrice === "number" && product.oldPrice > 0
      ? Number(product.oldPrice)
      : variantBasePrice || base;

  const bestPromotion = resolveBestPromotion({
    promotions,
    productId: product._id,
    customerTier,
  });

  let finalPrice = base;
  if (bestPromotion) {
    finalPrice = Math.max(
      0,
      Math.round(base * (1 - bestPromotion.discountPercent / 100))
    );
  }

  const effectiveDiscountPercent =
    original > 0
      ? Math.max(0, Math.min(100, Math.round((1 - finalPrice / original) * 100)))
      : 0;

  return {
    basePrice: base,
    originalPrice: original || base,
    finalPrice,
    effectiveDiscountPercent,
    appliedPromotion: bestPromotion
      ? {
          id: bestPromotion._id?.toString?.() || null,
          name: bestPromotion.name,
          scope: bestPromotion.scope,
          discountPercent: bestPromotion.discountPercent,
        }
      : null,
  };
};

export const applyPricingToProduct = (
  product,
  { promotions = [], customerTier } = {}
) => {
  const doc =
    typeof product.toObject === "function"
      ? product.toObject({ virtuals: true })
      : { ...product };

  const pricing = resolveEffectivePricing(doc, { promotions, customerTier });

  return {
    ...doc,
    basePrice: pricing.basePrice,
    finalPrice: pricing.finalPrice,
    effectiveDiscountPercent: pricing.effectiveDiscountPercent,
    appliedPromotion: pricing.appliedPromotion,
  };
};
