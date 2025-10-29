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

const sanitizeProduct = (product) => {
  if (!product || typeof product !== "object") return null;
  return {
    _id: product._id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price ?? 0,
    finalPrice: product.finalPrice ?? null,
    discountPercent: product.discountPercent ?? 0,
    rating: product.rating ?? 0,
    ratingCount: product.ratingCount ?? 0,
    imageUrl: product.imageUrl ?? "",
    images: Array.isArray(product.images) ? product.images : [],
  };
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState: {
    items: loadInitialItems(),
  },
  reducers: {
    toggleFavorite(state, { payload }) {
      const exists = state.items.findIndex((item) => item._id === payload._id);
      if (exists !== -1) {
        state.items.splice(exists, 1);
      } else {
        const sanitized = sanitizeProduct(payload);
        if (sanitized?._id) {
          state.items.unshift(sanitized);
        }
      }
    },
    removeFavorite(state, { payload }) {
      state.items = state.items.filter((item) => item._id !== payload);
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
