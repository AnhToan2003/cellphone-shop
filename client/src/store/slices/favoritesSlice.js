import { createSlice } from "@reduxjs/toolkit";

export const FAVORITES_STORAGE_KEY = "cellphones_favorites";

const loadInitialItems = () => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const getProductId = (product) => {
  if (!product || typeof product !== "object") return null;
  return product._id || product.id || null;
};

const sanitizeProduct = (product) => {
  const id = getProductId(product);
  if (!id) return null;
  const normalizedPromotion = product.appliedPromotion
    ? {
        id:
          product.appliedPromotion.id ||
          product.appliedPromotion._id ||
          null,
        name: product.appliedPromotion.name || "",
        scope: product.appliedPromotion.scope || null,
        discountPercent:
          product.appliedPromotion.discountPercent ?? null,
      }
    : null;
  return {
    _id: id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price ?? 0,
    basePrice:
      product.basePrice !== undefined ? product.basePrice : null,
    oldPrice: product.oldPrice !== undefined ? product.oldPrice : null,
    finalPrice:
      product.finalPrice ??
      (product.price !== undefined ? product.price : null),
    effectiveDiscountPercent:
      product.effectiveDiscountPercent ?? null,
    discountPercent: product.discountPercent ?? 0,
    rating: product.rating ?? 0,
    ratingCount: product.ratingCount ?? 0,
    imageUrl: product.imageUrl ?? "",
    images: Array.isArray(product.images) ? product.images : [],
    appliedPromotion: normalizedPromotion,
  };
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    items: loadInitialItems(),
  },
  reducers: {
    toggleFavorite(state, { payload }) {
      const productId = getProductId(payload);
      if (!productId) {
        return;
      }
      const exists = state.items.findIndex((item) => item._id === productId);
      if (exists !== -1) {
        state.items.splice(exists, 1);
      } else {
        const sanitized = sanitizeProduct(payload);
        if (sanitized) {
          state.items.unshift(sanitized);
        }
      }
    },
    removeFavorite(state, { payload }) {
      const targetId =
        (payload && (payload._id || payload.id)) || payload || null;
      if (!targetId) {
        return;
      }
      state.items = state.items.filter((item) => item._id !== targetId);
    },
    clearFavorites(state) {
      state.items = [];
    },
    upsertFavorites(state, { payload }) {
      if (!Array.isArray(payload)) return;
      state.items = payload
        .map(sanitizeProduct)
        .filter((item) => item && item._id);
    },
  },
});

export const {
  toggleFavorite,
  removeFavorite,
  clearFavorites,
  upsertFavorites,
} = favoritesSlice.actions;

export default favoritesSlice.reducer;
