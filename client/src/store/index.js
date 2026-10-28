import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice.js";
import cartReducer from "./slices/cartSlice.js";
import orderReducer from "./slices/orderSlice.js";
import productReducer from "./slices/productSlice.js";
import favoritesReducer, {
  FAVORITES_STORAGE_KEY,
} from "./slices/favoritesSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    orders: orderReducer,
    products: productReducer,
    favorites: favoritesReducer,
  },
});

if (typeof window !== "undefined") {
  let previousFavorites = store.getState().favorites.items;
  store.subscribe(() => {
    const state = store.getState();
    const currentFavorites = state.favorites.items;
    if (previousFavorites !== currentFavorites) {
      previousFavorites = currentFavorites;
      try {
        window.localStorage.setItem(
          FAVORITES_STORAGE_KEY,
          JSON.stringify(currentFavorites)
        );
      } catch (error) {
        // ignore persistence errors (e.g. storage disabled)
      }
    }
  });
}

